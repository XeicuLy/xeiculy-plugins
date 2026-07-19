import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { x } from 'tinyexec';
import semver from 'semver';
import { getCommitSubjects, hasChangedSince, inferBumpType } from './lib/git-changes.ts';
import { writeJsonFilesAtomically } from './lib/atomic-write.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type ParsedArgs = { newVersion: string; previousVersion: string; dryRun: boolean; root: string };

export function parseArgs(argv: string[], defaultRoot: string): ParsedArgs {
  const positional: string[] = [];
  let dryRun = false;
  let root = defaultRoot;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--root') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --root');
      }
      root = resolve(value);
      i++;
      continue;
    }
    if (arg?.startsWith('--')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length !== 2) {
    throw new Error('Usage: node scripts/sync-versions.ts <newVersion> <previousVersion> [--dry-run] [--root <path>]');
  }

  const [newVersion, previousVersion] = positional;
  if (!semver.valid(newVersion) || !semver.valid(previousVersion)) {
    throw new Error(`Invalid version: ${newVersion} / ${previousVersion}`);
  }

  return { newVersion, previousVersion, dryRun, root };
}

type PendingWrite = { filePath: string; obj: Record<string, unknown>; label: string; summary?: string };

function loadJson(filePath: string): Record<string, unknown> {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

function commitWrites(writes: PendingWrite[], dryRun: boolean): void {
  if (dryRun) {
    for (const { label, summary } of writes) {
      console.log(`[dry-run] Would update ${label}`);
      if (summary) console.log(summary);
    }
    return;
  }

  writeJsonFilesAtomically(writes.map(({ filePath, obj }) => ({ filePath, obj })));

  for (const { summary } of writes) {
    if (summary) console.log(summary);
  }
}

async function previousTagExists(tag: string): Promise<boolean> {
  const result = await x('git', ['tag', '-l', tag], { throwOnError: true });
  return result.stdout.trim().length > 0;
}

async function run({ newVersion, previousVersion, dryRun, root }: ParsedArgs): Promise<void> {
  const marketplacePath = resolve(root, '.claude-plugin/marketplace.json');
  const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf-8')) as {
    plugins: Array<{ name: string; source: { path: string } }>;
  };

  const previousTag = `v${previousVersion}`;
  const tagExists = await previousTagExists(previousTag);
  if (!tagExists) {
    console.warn(`Tag ${previousTag} not found — treating all plugins as changed (initial release fallback)`);
  }

  const changedDirs = new Set<string>();
  const pendingWrites: PendingWrite[] = [];

  for (const plugin of marketplace.plugins) {
    const pluginDir = plugin.source.path;
    const range = tagExists ? `${previousTag}..HEAD` : 'HEAD';
    const changed = tagExists ? await hasChangedSince(range, pluginDir) : true;

    if (!changed) {
      console.log(`Skip ${plugin.name}: no changes since ${previousTag}`);
      continue;
    }

    const pluginJsonPath = resolve(root, `${pluginDir}/.claude-plugin/plugin.json`);
    const pluginJson = loadJson(pluginJsonPath);
    const currentPluginVersion = (pluginJson as { version: string }).version;

    const subjects = await getCommitSubjects(range, pluginDir);
    const bumpType = inferBumpType(subjects);
    const newPluginVersion = semver.inc(currentPluginVersion, bumpType);
    if (!newPluginVersion) {
      console.error(
        `Failed to calculate new version for ${plugin.name} from ${currentPluginVersion} with bump "${bumpType}"`,
      );
      process.exit(1);
    }

    pluginJson.version = newPluginVersion;
    pendingWrites.push({
      filePath: pluginJsonPath,
      obj: pluginJson,
      label: `${plugin.name} plugin.json`,
      summary: `${dryRun ? '[dry-run] Would update' : 'Updated'} ${plugin.name}: ${currentPluginVersion} -> ${newPluginVersion} (${bumpType})`,
    });
    changedDirs.add(pluginDir);
  }

  const marketplaceJson = loadJson(marketplacePath);
  const metadata = marketplaceJson.metadata as Record<string, unknown>;
  metadata.version = newVersion;
  const plugins = marketplaceJson.plugins as Array<Record<string, unknown>>;
  for (const plugin of plugins) {
    const source = plugin.source as Record<string, unknown>;
    if (changedDirs.has(source.path as string)) {
      source.ref = `v${newVersion}`;
    }
  }
  pendingWrites.push({ filePath: marketplacePath, obj: marketplaceJson, label: 'marketplace.json' });

  commitWrites(pendingWrites, dryRun);

  console.log(`Synced version ${newVersion}: ${changedDirs.size}/${marketplace.plugins.length} plugin(s) updated`);
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  let parsedArgs: ParsedArgs;
  try {
    parsedArgs = parseArgs(process.argv.slice(2), resolve(__dirname, '..'));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  run(parsedArgs).catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
