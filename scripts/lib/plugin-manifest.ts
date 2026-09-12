import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import semver from 'semver';

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const IGNORED_DIRS = new Set(['node_modules', '.git']);

export type PluginManifest = Record<string, unknown>;

export function findPluginManifestPaths(root: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        if (entry.name === '.claude-plugin') {
          const manifestPath = join(dir, entry.name, 'plugin.json');
          if (existsSync(manifestPath)) results.push(manifestPath);
          continue;
        }
        walk(join(dir, entry.name));
      }
    }
  }

  walk(root);
  return results;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function validatePluginManifest(manifest: PluginManifest): string[] {
  const errors: string[] = [];

  if (!isString(manifest.name) || !KEBAB_CASE.test(manifest.name)) {
    errors.push('name is required and must be a kebab-case string');
  }

  if (manifest.version !== undefined && (!isString(manifest.version) || !semver.valid(manifest.version))) {
    errors.push('version must be a valid semver string');
  }

  for (const field of ['description', 'homepage', 'repository', 'license'] as const) {
    if (manifest[field] !== undefined && !isString(manifest[field])) {
      errors.push(`${field} must be a string`);
    }
  }

  if (manifest.author !== undefined) {
    const author = manifest.author as Record<string, unknown>;
    if (author.name !== undefined && !isString(author.name)) {
      errors.push('author.name must be a string');
    }
  }

  if (manifest.keywords !== undefined) {
    const keywords = manifest.keywords;
    if (!Array.isArray(keywords) || !keywords.every(isString)) {
      errors.push('keywords must be an array of strings');
    }
  }

  return errors;
}
