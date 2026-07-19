import { describe, expect, it } from 'vitest';
import { parseArgs } from './sync-versions.ts';

describe('parseArgs', () => {
  it('新旧バージョンの2つの位置引数を受け取れる', () => {
    expect(parseArgs(['1.1.0', '1.0.0'], '/default/root')).toEqual({
      newVersion: '1.1.0',
      previousVersion: '1.0.0',
      dryRun: false,
      root: '/default/root',
    });
  });

  it('--dry-run フラグを認識する', () => {
    expect(parseArgs(['1.1.0', '1.0.0', '--dry-run'], '/default/root')).toMatchObject({ dryRun: true });
  });

  it('--root フラグで対象ディレクトリを差し替えられる', () => {
    expect(parseArgs(['1.1.0', '1.0.0', '--root', '/tmp/some-dir'], '/default/root')).toMatchObject({
      root: '/tmp/some-dir',
    });
  });

  it('未知のフラグを渡すとエラーになる', () => {
    expect(() => parseArgs(['1.1.0', '1.0.0', '--dryrun'], '/default/root')).toThrow();
  });

  it('位置引数が1つしかない場合エラーになる', () => {
    expect(() => parseArgs(['1.1.0'], '/default/root')).toThrow();
  });

  it('位置引数が3つ以上ある場合エラーになる', () => {
    expect(() => parseArgs(['1.1.0', '1.0.0', 'extra'], '/default/root')).toThrow();
  });

  it('--root に値がない場合エラーになる', () => {
    expect(() => parseArgs(['1.1.0', '1.0.0', '--root'], '/default/root')).toThrow();
  });

  it('先頭ゼロを含む不正なバージョン文字列はエラーになる', () => {
    expect(() => parseArgs(['01.2.3', '1.0.0'], '/default/root')).toThrow();
  });

  it('semver として不正な previousVersion もエラーになる', () => {
    expect(() => parseArgs(['1.2.3', 'not-a-version'], '/default/root')).toThrow();
  });

  it('プレリリース・ビルドメタデータ付きの正当な semver は許可される', () => {
    expect(parseArgs(['1.2.3-beta.1+build.1', '1.0.0'], '/default/root')).toMatchObject({
      newVersion: '1.2.3-beta.1+build.1',
    });
  });
});
