import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

type MarketplacePlugin = {
  name: string;
  source: { source: string; url: string; path: string; ref: string };
  description: string;
  homepage: string;
  strict: boolean;
};

describe('marketplace.json プラグイン登録 (integration)', () => {
  const marketplace = JSON.parse(readFileSync(resolve(repoRoot, '.claude-plugin/marketplace.json'), 'utf-8')) as {
    plugins: MarketplacePlugin[];
  };

  const stackPr = marketplace.plugins.find((plugin) => plugin.name === 'stack-pr');
  const techAdr = marketplace.plugins.find((plugin) => plugin.name === 'tech-adr');

  it('stack-pr が marketplace.json の plugins[] に登録されている', () => {
    expect(stackPr).toBeDefined();
  });

  it('stack-pr のエントリが既存プラグインと同じ source 形式を持つ', () => {
    expect(stackPr?.source).toMatchObject({
      source: 'git-subdir',
      url: 'https://github.com/XeicuLy/xeiculy-plugins.git',
      path: 'stack-pr',
    });
    expect(stackPr?.source.ref).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('stack-pr のエントリが homepage と strict を既存プラグインと揃えている', () => {
    expect(stackPr?.homepage).toBe('https://github.com/XeicuLy/xeiculy-plugins/tree/main/stack-pr');
    expect(stackPr?.strict).toBe(true);
  });

  it('tech-adr が marketplace.json の plugins[] に登録されている', () => {
    expect(techAdr).toBeDefined();
  });

  it('tech-adr のエントリが既存プラグインと同じ source 形式を持つ', () => {
    expect(techAdr?.source).toMatchObject({
      source: 'git-subdir',
      url: 'https://github.com/XeicuLy/xeiculy-plugins.git',
      path: 'tech-adr',
    });
    expect(techAdr?.source.ref).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('tech-adr のエントリが homepage と strict を既存プラグインと揃えている', () => {
    expect(techAdr?.homepage).toBe('https://github.com/XeicuLy/xeiculy-plugins/tree/main/tech-adr');
    expect(techAdr?.strict).toBe(true);
  });
});
