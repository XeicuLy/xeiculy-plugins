import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { findPluginManifestPaths, validatePluginManifest } from './lib/plugin-manifest.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

describe('plugin.json manifest contract (integration)', () => {
  const manifestPaths = findPluginManifestPaths(repoRoot);

  it('リポジトリ内の全プラグインの plugin.json を検出できる', () => {
    expect(manifestPaths.length).toBeGreaterThan(0);
  });

  it.each(manifestPaths)('%s がマニフェスト契約を満たす', (manifestPath) => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(validatePluginManifest(manifest)).toEqual([]);
  });
});
