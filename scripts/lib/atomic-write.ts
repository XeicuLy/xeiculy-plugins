import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';

export type JsonWrite = { filePath: string; obj: unknown };

function cleanupStaged(staged: string[]): void {
  for (const tmpPath of staged) {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  }
}

export function writeJsonFilesAtomically(writes: JsonWrite[]): void {
  const staged = writes.map(({ filePath }) => `${filePath}.tmp`);
  const originals = writes.map(({ filePath }) => (existsSync(filePath) ? readFileSync(filePath, 'utf-8') : null));

  try {
    writes.forEach(({ obj }, i) => {
      writeFileSync(staged[i], JSON.stringify(obj, null, 2) + '\n', 'utf-8');
    });
  } catch (err) {
    cleanupStaged(staged);
    throw err;
  }

  const renamed: number[] = [];
  try {
    writes.forEach(({ filePath }, i) => {
      renameSync(staged[i], filePath);
      renamed.push(i);
    });
  } catch (err) {
    for (const i of renamed) {
      const original = originals[i];
      if (original === null) {
        unlinkSync(writes[i].filePath);
      } else {
        writeFileSync(writes[i].filePath, original, 'utf-8');
      }
    }
    cleanupStaged(staged);
    throw err;
  }
}
