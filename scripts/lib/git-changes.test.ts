import { describe, expect, it } from 'vitest';
import { inferBumpType } from './git-changes.ts';

describe('inferBumpType', () => {
  it('feat: コミットのみの場合は minor を返す', () => {
    expect(inferBumpType(['feat: add new command'])).toBe('minor');
  });

  it('feat!: (破壊的変更マーカー) を含む場合は major を返す', () => {
    expect(inferBumpType(['feat!: change API signature'])).toBe('major');
  });

  it('BREAKING CHANGE を含む場合は major を返す', () => {
    expect(inferBumpType(['fix: patch something', 'BREAKING CHANGE: removed old API'])).toBe('major');
  });

  it('1コミットの本文フッターに BREAKING CHANGE を含む場合は major を返す', () => {
    expect(inferBumpType(['fix: correct bug\n\nBREAKING CHANGE: old behavior removed'])).toBe('major');
  });

  it('feat(scope): のようにスコープ付き feat は minor を返す', () => {
    expect(inferBumpType(['feat(core): add feature'])).toBe('minor');
  });

  it.each(['feat!: break', 'fix!: break', 'feat(scope)!: break'])(
    '%s のように ! マーカーを含む場合は major を返す',
    (subject) => {
      expect(inferBumpType([subject])).toBe('major');
    },
  );

  it.each(['fix: correct bug', 'refactor: simplify logic', 'docs: update readme'])(
    '%s のような feat/破壊的変更以外のコミットは patch を返す',
    (subject) => {
      expect(inferBumpType([subject])).toBe('patch');
    },
  );

  it('該当するコミットがない場合は patch を返す', () => {
    expect(inferBumpType([])).toBe('patch');
  });
});
