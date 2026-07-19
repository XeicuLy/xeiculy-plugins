import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeJsonFilesAtomically } from './atomic-write.ts';

describe('writeJsonFilesAtomically', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'atomic-write-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('すべての書き込みが成功した場合、全ファイルが新しい内容で更新される', () => {
    const fileA = join(dir, 'a.json');
    const fileB = join(dir, 'b.json');
    writeFileSync(fileA, '{"version":"1.0.0"}\n', 'utf-8');
    writeFileSync(fileB, '{"version":"1.0.0"}\n', 'utf-8');

    writeJsonFilesAtomically([
      { filePath: fileA, obj: { version: '1.1.0' } },
      { filePath: fileB, obj: { version: '1.1.0' } },
    ]);

    expect(JSON.parse(readFileSync(fileA, 'utf-8'))).toEqual({ version: '1.1.0' });
    expect(JSON.parse(readFileSync(fileB, 'utf-8'))).toEqual({ version: '1.1.0' });
    expect(existsSync(`${fileA}.tmp`)).toBe(false);
    expect(existsSync(`${fileB}.tmp`)).toBe(false);
  });

  it('一部の書き込みが失敗した場合、既存ファイルは変更されず一時ファイルも残らない', () => {
    const fileA = join(dir, 'a.json');
    const fileB = join(dir, 'nonexistent-subdir', 'b.json');
    writeFileSync(fileA, '{"version":"1.0.0"}\n', 'utf-8');

    expect(() =>
      writeJsonFilesAtomically([
        { filePath: fileA, obj: { version: '1.1.0' } },
        { filePath: fileB, obj: { version: '1.1.0' } },
      ]),
    ).toThrow();

    expect(readFileSync(fileA, 'utf-8')).toBe('{"version":"1.0.0"}\n');
    expect(existsSync(`${fileA}.tmp`)).toBe(false);
    expect(existsSync(fileB)).toBe(false);
  });
});
