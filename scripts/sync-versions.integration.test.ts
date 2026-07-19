import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { x } from 'tinyexec';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const jitiBin = resolve(repoRoot, 'node_modules/.bin/jiti');
const scriptPath = resolve(repoRoot, 'scripts/sync-versions.ts');

async function git(args: string[], cwd: string): Promise<void> {
  await x('git', args, { nodeOptions: { cwd }, throwOnError: true });
}

async function runSync(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await x(jitiBin, [scriptPath, ...args], { nodeOptions: { cwd } });
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode ?? 0 };
}

function writeJson(filePath: string, obj: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
}

async function initFixtureRepo(dir: string): Promise<void> {
  await git(['init', '-q'], dir);
  await git(['config', 'user.email', 'test@example.com'], dir);
  await git(['config', 'user.name', 'Test'], dir);

  writeJson(join(dir, '.claude-plugin/marketplace.json'), {
    metadata: { version: '1.0.0' },
    plugins: [
      { name: 'plugin-a', source: { path: 'plugins/plugin-a', ref: 'v1.0.0' } },
      { name: 'plugin-b', source: { path: 'plugins/plugin-b', ref: 'v1.0.0' } },
    ],
  });
  writeJson(join(dir, 'plugins/plugin-a/.claude-plugin/plugin.json'), { name: 'plugin-a', version: '1.0.0' });
  writeJson(join(dir, 'plugins/plugin-b/.claude-plugin/plugin.json'), { name: 'plugin-b', version: '1.0.0' });
  writeFileSync(join(dir, 'README.md'), '# fixture\n', 'utf-8');

  await git(['add', '-A'], dir);
  await git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'chore: initial fixture'], dir);
  await git(['tag', 'v1.0.0'], dir);
}

describe('sync-versions.ts (integration)', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'sync-versions-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('変更のあったプラグインのみ version と marketplace.json の source.ref が実際に更新される', async () => {
    await initFixtureRepo(dir);
    writeFileSync(join(dir, 'plugins/plugin-a/SKILL.md'), '# plugin-a skill\n', 'utf-8');
    await git(['add', '-A'], dir);
    await git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'feat(plugin-a): add skill'], dir);

    const { exitCode } = await runSync(['1.1.0', '1.0.0', '--root', dir], dir);
    expect(exitCode).toBe(0);

    const pluginA = readJson(join(dir, 'plugins/plugin-a/.claude-plugin/plugin.json'));
    const pluginB = readJson(join(dir, 'plugins/plugin-b/.claude-plugin/plugin.json'));
    expect(pluginA.version).toBe('1.1.0');
    expect(pluginB.version).toBe('1.0.0');

    const marketplace = readJson(join(dir, '.claude-plugin/marketplace.json'));
    const plugins = marketplace.plugins as Array<{ name: string; source: { ref: string } }>;
    expect(plugins.find((p) => p.name === 'plugin-a')?.source.ref).toBe('v1.1.0');
    expect(plugins.find((p) => p.name === 'plugin-b')?.source.ref).toBe('v1.0.0');
  });

  it('共通ファイルのみの変更では全プラグインがスキップされ、書き込みも行われない', async () => {
    await initFixtureRepo(dir);
    writeFileSync(join(dir, 'README.md'), '# fixture updated\n', 'utf-8');
    await git(['add', '-A'], dir);
    await git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'docs: update readme'], dir);

    const { stdout, exitCode } = await runSync(['1.0.1', '1.0.0', '--root', dir], dir);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Skip plugin-a');
    expect(stdout).toContain('Skip plugin-b');
    expect(stdout).toContain('Synced version 1.0.1: 0/2 plugin(s) updated');

    const pluginA = readJson(join(dir, 'plugins/plugin-a/.claude-plugin/plugin.json'));
    const marketplace = readJson(join(dir, '.claude-plugin/marketplace.json'));
    expect(pluginA.version).toBe('1.0.0');
    expect((marketplace.metadata as { version: string }).version).toBe('1.0.1');
    const plugins = marketplace.plugins as Array<{ name: string; source: { ref: string } }>;
    expect(plugins.find((p) => p.name === 'plugin-a')?.source.ref).toBe('v1.0.0');
    expect(plugins.find((p) => p.name === 'plugin-b')?.source.ref).toBe('v1.0.0');
  });

  it('前回タグが存在しない場合は全プラグインを変更ありとして扱う（初回リリースフォールバック）', async () => {
    await initFixtureRepo(dir);
    await git(['tag', '-d', 'v1.0.0'], dir);

    const { stdout, stderr, exitCode } = await runSync(['1.0.0', '0.9.0', '--root', dir, '--dry-run'], dir);
    expect(exitCode).toBe(0);
    expect(stderr).toContain('Tag v0.9.0 not found');
    expect(stdout).toContain('[dry-run] Would update plugin-a');
    expect(stdout).toContain('[dry-run] Would update plugin-b');
  });

  it('--dry-run 指定時は実ファイルを変更せず、更新予定のみ出力する', async () => {
    await initFixtureRepo(dir);
    writeFileSync(join(dir, 'plugins/plugin-a/SKILL.md'), '# plugin-a skill\n', 'utf-8');
    await git(['add', '-A'], dir);
    await git(['-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'feat(plugin-a): add skill'], dir);

    const { stdout, exitCode } = await runSync(['1.1.0', '1.0.0', '--root', dir, '--dry-run'], dir);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('[dry-run] Would update plugin-a: 1.0.0 -> 1.1.0 (minor)');

    const pluginA = readJson(join(dir, 'plugins/plugin-a/.claude-plugin/plugin.json'));
    const marketplace = readJson(join(dir, '.claude-plugin/marketplace.json'));
    expect(pluginA.version).toBe('1.0.0');
    expect((marketplace.metadata as { version: string }).version).toBe('1.0.0');
    expect(existsSync(join(dir, 'plugins/plugin-a/.claude-plugin/plugin.json.tmp'))).toBe(false);
  });
});
