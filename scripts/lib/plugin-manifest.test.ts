import { describe, expect, it } from 'vitest';
import { validatePluginManifest } from './plugin-manifest.ts';

const validManifest = {
  name: 'stack-pr',
  version: '1.0.0',
  description: 'A plugin',
  author: { name: 'XeicuLy', url: 'https://github.com/XeicuLy' },
  homepage: 'https://github.com/XeicuLy/xeiculy-plugins',
  repository: 'https://github.com/XeicuLy/xeiculy-plugins',
  license: 'MIT',
  keywords: ['github', 'stacked-prs'],
};

describe('validatePluginManifest', () => {
  it('全フィールドが正しい形式のマニフェストはエラーなしを返す', () => {
    expect(validatePluginManifest(validManifest)).toEqual([]);
  });

  it('name が欠落している場合エラーを返す', () => {
    const { name: _name, ...rest } = validManifest;
    expect(validatePluginManifest(rest)).toContain('name is required and must be a kebab-case string');
  });

  it('name が kebab-case でない場合エラーを返す', () => {
    expect(validatePluginManifest({ ...validManifest, name: 'Stack_PR' })).toContain(
      'name is required and must be a kebab-case string',
    );
  });

  it('version が semver として不正な場合エラーを返す', () => {
    expect(validatePluginManifest({ ...validManifest, version: 'not-a-version' })).toContain(
      'version must be a valid semver string',
    );
  });

  it('version が未指定の場合はエラーにならない', () => {
    const { version: _version, ...rest } = validManifest;
    expect(validatePluginManifest(rest)).toEqual([]);
  });

  it('description が文字列でない場合エラーを返す', () => {
    expect(validatePluginManifest({ ...validManifest, description: 123 })).toContain('description must be a string');
  });

  it('author.name が文字列でない場合エラーを返す', () => {
    expect(validatePluginManifest({ ...validManifest, author: { name: 123 } })).toContain(
      'author.name must be a string',
    );
  });

  it('keywords が文字列配列でない場合エラーを返す', () => {
    expect(validatePluginManifest({ ...validManifest, keywords: ['ok', 123] })).toContain(
      'keywords must be an array of strings',
    );
  });

  it('keywords が配列でない場合エラーを返す', () => {
    expect(validatePluginManifest({ ...validManifest, keywords: 'not-an-array' })).toContain(
      'keywords must be an array of strings',
    );
  });
});
