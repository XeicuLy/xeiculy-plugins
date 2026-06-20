import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node scripts/sync-versions.ts <version>');
  process.exit(1);
}

function updateJson(filePath: string, updater: (obj: Record<string, unknown>) => void): void {
  const raw = readFileSync(filePath, 'utf-8');
  const obj = JSON.parse(raw) as Record<string, unknown>;
  updater(obj);
  writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

updateJson(resolve(root, '.claude-plugin/marketplace.json'), (obj) => {
  const metadata = obj.metadata as Record<string, unknown>;
  metadata.version = version;
  const plugins = obj.plugins as Array<Record<string, unknown>>;
  const source = plugins[0].source as Record<string, unknown>;
  source.ref = `v${version}`;
});

updateJson(resolve(root, 'task-planner/.claude-plugin/plugin.json'), (obj) => {
  obj.version = version;
});

console.log(`Synced version ${version} to marketplace.json and plugin.json`);
