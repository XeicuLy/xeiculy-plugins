import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const version = process.argv[2];
const semverLike = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

if (!version) {
  console.error('Usage: node scripts/sync-versions.ts <version>');
  process.exit(1);
}

if (!semverLike.test(version)) {
  console.error(`Invalid version: ${version}`);
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
  for (const plugin of plugins) {
    const source = plugin.source as Record<string, unknown>;
    source.ref = `v${version}`;
  }
});

const pluginDirs = ['task-planner', 'dev-workflow'];
for (const dir of pluginDirs) {
  updateJson(resolve(root, `${dir}/.claude-plugin/plugin.json`), (obj) => {
    obj.version = version;
  });
}

console.log(`Synced version ${version} to marketplace.json and ${pluginDirs.length} plugin.json files`);
