import { existsSync, renameSync, unlinkSync, writeFileSync } from 'fs';

export type JsonWrite = { filePath: string; obj: unknown };

export function writeJsonFilesAtomically(writes: JsonWrite[]): void {
  const staged = writes.map(({ filePath }) => `${filePath}.tmp`);

  try {
    writes.forEach(({ obj }, i) => {
      writeFileSync(staged[i], JSON.stringify(obj, null, 2) + '\n', 'utf-8');
    });
  } catch (err) {
    for (const tmpPath of staged) {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    }
    throw err;
  }

  writes.forEach(({ filePath }, i) => {
    renameSync(staged[i], filePath);
  });
}
