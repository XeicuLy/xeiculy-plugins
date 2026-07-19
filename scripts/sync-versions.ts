import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { x } from 'tinyexec';
import semver from 'semver';
import { getCommitSubjects, hasChangedSince, inferBumpType } from './lib/git-changes.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [newVersion, previousVersion] = args.filter((a) => a !== '--dry-run');
const semverLike = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

if (!newVersion || !previousVersion) {
  console.error('Usage: node scripts/sync-versions.ts <newVersion> <previousVersion> [--dry-run]');
  process.exit(1);
}

if (!semverLike.test(newVersion) || !semverLike.test(previousVersion)) {
  console.error(`Invalid version: ${newVersion} / ${previousVersion}`);
  process.exit(1);
}

type PendingWrite = { filePath: string; obj: Record<string, unknown>; label: string; summary?: string };

function loadJson(filePath: string): Record<string, unknown> {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

function commitWrite({ filePath, obj, label, summary }: PendingWrite): void {
  if (dryRun) {
    console.log(`[dry-run] Would update ${label}`);
  } else {
    writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
  }
  if (summary) console.log(summary);
}

async function previousTagExists(tag: string): Promise<boolean> {
  const result = await x('git', ['tag', '-l', tag], { throwOnError: true });
  return result.stdout.trim().length > 0;
}

async function run(): Promise<void> {
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

  for (const write of pendingWrites) {
    commitWrite(write);
  }

  console.log(`Synced version ${newVersion}: ${changedDirs.size}/${marketplace.plugins.length} plugin(s) updated`);
}

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
