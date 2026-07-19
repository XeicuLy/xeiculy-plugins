import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { consola } from 'consola';
import { x } from 'tinyexec';
import semver from 'semver';
import { getCommitSubjects, inferBumpType, type BumpType } from './lib/git-changes.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const BUMP_TYPES: BumpType[] = ['patch', 'minor', 'major'];

function parseArgs(): { dryRun: boolean; isCI: boolean; bumpType: BumpType | undefined } {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const isCI = args.includes('--ci') || process.env['CI'] === 'true' || process.env['GITHUB_ACTIONS'] === 'true';
  const bumpType = args.find((a): a is BumpType => BUMP_TYPES.includes(a as BumpType));
  return { dryRun, isCI, bumpType };
}

async function checkGitStatus(): Promise<void> {
  const result = await x('git', ['status', '--porcelain']);
  if (result.stdout.trim()) {
    consola.error('Working directory is dirty. Commit or stash changes first.');
    process.exit(1);
  }
  const branch = (await x('git', ['branch', '--show-current'])).stdout.trim();
  consola.info(`Current branch: ${branch}`);
  if (branch !== 'main') {
    consola.error(`Release must be run from main, but current branch is ${branch || '<detached>'}.`);
    process.exit(1);
  }
}

function readCurrentVersion(): string {
  const marketplacePath = resolve(root, '.claude-plugin/marketplace.json');
  const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf-8')) as {
    metadata: { version: string };
  };
  return marketplace.metadata.version;
}

async function promptBumpType(): Promise<BumpType> {
  const choice = await consola.prompt('Select version bump type:', {
    type: 'select',
    options: BUMP_TYPES,
  });
  if (typeof choice === 'symbol') process.exit(0);
  return choice as BumpType;
}

async function inferBumpTypeFromCommits(currentVersion: string): Promise<BumpType> {
  const tagCheck = await x('git', ['tag', '-l', `v${currentVersion}`]);
  const tagExists = tagCheck.stdout.trim() !== '';
  if (!tagExists) {
    consola.warn(`Tag v${currentVersion} not found, analyzing recent commits`);
  }
  const range = tagExists ? `v${currentVersion}..HEAD` : 'HEAD~20..HEAD';
  const subjects = await getCommitSubjects(range, '.');
  return inferBumpType(subjects);
}

function updateJsonFile(
  filePath: string,
  updater: (obj: Record<string, unknown>) => void,
  dryRun: boolean,
  label: string,
): void {
  if (dryRun) {
    consola.info(`[dry-run] Would update ${label}`);
    return;
  }
  const raw = readFileSync(filePath, 'utf-8');
  const obj = JSON.parse(raw) as Record<string, unknown>;
  updater(obj);
  writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

async function runCmd(cmd: string, args: string[], dryRun: boolean, label?: string): Promise<string> {
  const display = label ?? `${cmd} ${args.join(' ')}`;
  if (dryRun) {
    consola.info(`[dry-run] Would run: ${display}`);
    return '';
  }
  const result = await x(cmd, args, { nodeOptions: { cwd: root }, throwOnError: true });
  return result.stdout;
}

function extractChangelogSection(version: string): string {
  const changelogPath = resolve(root, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) return '';
  const content = readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];
  const versionHeaderRe = /^#+\s.*\d+\.\d+\.\d+/;

  for (const line of lines) {
    if (!inSection && /^#+\s/.test(line) && line.includes(version)) {
      inSection = true;
      continue;
    }
    if (inSection && versionHeaderRe.test(line)) break;
    if (inSection) sectionLines.push(line);
  }

  return sectionLines.join('\n').trim();
}

async function run(): Promise<void> {
  const { dryRun, isCI, bumpType: argBumpType } = parseArgs();

  if (dryRun) consola.warn('Running in dry-run mode — no files will be changed');

  if (!isCI && !dryRun) {
    await checkGitStatus();
  }

  const currentVersion = readCurrentVersion();
  consola.info(`Current version: ${currentVersion}`);

  let bumpType: BumpType;
  if (argBumpType) {
    bumpType = argBumpType;
  } else if (dryRun) {
    bumpType = 'patch';
    consola.info('[dry-run] No bump type specified — defaulting to patch');
  } else if (isCI) {
    bumpType = await inferBumpTypeFromCommits(currentVersion);
    consola.info(`[CI] Auto-detected bump type from commits: ${bumpType}`);
  } else {
    bumpType = await promptBumpType();
  }

  const newVersion = semver.inc(currentVersion, bumpType);
  if (!newVersion) {
    consola.error(`Failed to calculate new version from ${currentVersion} with bump "${bumpType}"`);
    process.exit(1);
  }
  consola.info(`New version: ${newVersion}`);

  // Update package.json
  updateJsonFile(
    resolve(root, 'package.json'),
    (obj) => {
      obj['version'] = newVersion;
    },
    dryRun,
    'package.json',
  );

  // Generate changelog
  await runCmd(
    'changelogen',
    ['--output', 'CHANGELOG.md', '--from', `v${currentVersion}`, '-r', newVersion],
    dryRun,
    `changelogen --output CHANGELOG.md --from v${currentVersion} -r ${newVersion}`,
  );
  if (!dryRun) consola.success('Changelog generated');

  // Sync versions across plugin.json files (only for plugins changed since the previous tag).
  // Always runs, even in --dry-run: sync-versions.ts detects changes for real and only skips writes,
  // which is how the per-plugin selective bump logic gets manually verified.
  const syncArgs = ['scripts/sync-versions.ts', newVersion, currentVersion, ...(dryRun ? ['--dry-run'] : [])];
  await x('jiti', syncArgs, { nodeOptions: { cwd: root }, throwOnError: true });
  if (!dryRun) consola.success('Versions synced');

  // Commit, tag and push
  const commitMsg = `chore(release): v${newVersion}`;
  if (dryRun) {
    consola.info(`[dry-run] Would run: git add -A && git commit -m "${commitMsg}"`);
    consola.info(
      `[dry-run] Would run: git tag -a v${newVersion} -m "Release v${newVersion}" && git push --follow-tags`,
    );
  } else {
    await x('git', ['add', '-A'], { nodeOptions: { cwd: root }, throwOnError: true });
    await x('git', ['commit', '-m', commitMsg], { nodeOptions: { cwd: root }, throwOnError: true });
    consola.success(`Committed: ${commitMsg}`);
    await x('git', ['tag', '-a', `v${newVersion}`, '-m', `Release v${newVersion}`], {
      nodeOptions: { cwd: root },
      throwOnError: true,
    });
    await x('git', ['push', '--follow-tags'], { nodeOptions: { cwd: root }, throwOnError: true });
    consola.success('Pushed tag to remote');
  }

  // Create GitHub Release
  if (dryRun) {
    consola.info(
      `[dry-run] Would run: gh release create v${newVersion} --title "v${newVersion}" --notes-file <changelog-section>`,
    );
  } else {
    const notes = extractChangelogSection(newVersion) || `Release v${newVersion}`;
    const tmpDir = mkdtempSync(join(tmpdir(), 'release-'));
    const notesFile = join(tmpDir, 'notes.md');
    try {
      writeFileSync(notesFile, notes, 'utf-8');
      await x('gh', ['release', 'create', `v${newVersion}`, '--title', `v${newVersion}`, '--notes-file', notesFile], {
        nodeOptions: { cwd: root },
        throwOnError: true,
      });
      consola.success(`GitHub Release v${newVersion} created`);
    } finally {
      rmSync(tmpDir, { recursive: true });
    }
  }

  consola.success(`\nRelease v${newVersion} complete!`);
}

run().catch((err: unknown) => {
  consola.error(err);
  process.exit(1);
});
