import { x } from 'tinyexec';

export type BumpType = 'patch' | 'minor' | 'major';

export async function getCommitSubjects(range: string, pathspec: string): Promise<string[]> {
  const result = await x('git', ['log', range, '--format=%s', '--', pathspec]);
  return result.stdout.trim().split('\n').filter(Boolean);
}

export async function hasChangedSince(range: string, pathspec: string): Promise<boolean> {
  const result = await x('git', ['diff', '--name-only', range, '--', pathspec]);
  return result.stdout.trim().length > 0;
}

export function inferBumpType(subjects: string[]): BumpType {
  if (subjects.some((s) => /^[a-z]+(\(.+\))?!:/.test(s) || s.includes('BREAKING CHANGE'))) return 'major';
  if (subjects.some((s) => /^feat(\(.+\))?:/.test(s))) return 'minor';
  return 'patch';
}
