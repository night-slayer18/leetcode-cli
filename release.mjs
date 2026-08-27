#!/usr/bin/env node
/**
 * release.mjs — prepares a release:
 *
 *   1. Bumps version in package.json and src/index.ts
 *   2. Runs npm install (updates package-lock.json)
 *   3. Typecheck → lint → build → tests
 *
 * Usage:
 *   npm run release patch   # 3.5.1 → 3.5.2
 *   npm run release minor   # 3.5.1 → 3.6.0
 *   npm run release major   # 3.5.1 → 4.0.0
 *   npm run release 3.6.0   # explicit version
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;

// ── helpers ───────────────────────────────────────────────────────────────────

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function bump(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  if (type === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (/^\d+\.\d+\.\d+$/.test(type)) return type;
  throw new Error(`Unknown bump type: "${type}". Use patch / minor / major / x.y.z`);
}

function readJson(file) {
  return JSON.parse(readFileSync(resolve(ROOT, file), 'utf-8'));
}

function writeJson(file, data) {
  writeFileSync(resolve(ROOT, file), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function readText(file) {
  return readFileSync(resolve(ROOT, file), 'utf-8');
}

function writeText(file, content) {
  writeFileSync(resolve(ROOT, file), content, 'utf-8');
}

// ── main ──────────────────────────────────────────────────────────────────────

const bumpType = process.argv[2];
if (!bumpType) {
  console.error('Usage: npm run release <patch|minor|major|x.y.z>');
  process.exit(1);
}

// 1. Determine new version
const pkg = readJson('package.json');
const currentVersion = pkg.version;
const newVersion = bump(currentVersion, bumpType);

if (newVersion === currentVersion) {
  console.error(`❌  New version (${newVersion}) is the same as current (${currentVersion})`);
  process.exit(1);
}

console.log(`\n🔖  ${currentVersion} → ${newVersion}\n`);

// 1a. package.json
pkg.version = newVersion;
writeJson('package.json', pkg);
console.log('   ✓ package.json');

// 1b. src/index.ts
const indexPath = 'src/index.ts';
const indexContent = readText(indexPath);
const updatedIndex = indexContent.replace(/\.version\('[\d.]+',/, `.version('${newVersion}',`);
if (updatedIndex === indexContent) {
  console.error('❌  Could not find .version(...) in src/index.ts — update it manually.');
  process.exit(1);
}
writeText(indexPath, updatedIndex);
console.log('   ✓ src/index.ts');

// 2. npm install → refreshes package-lock.json
console.log('\n📦  npm install…');
run('npm install');

// 3. Quality gates
console.log('\n🔎  typecheck…');
run('npm run typecheck');

console.log('\n🔍  lint…');
run('npm run lint');

console.log('\n🏗️   build…');
run('npm run build');

console.log('\n🧪  tests…');
run('npm test');

console.log(`\n✅  v${newVersion} is ready to release!\n`);
console.log('Remaining steps:');
console.log(`  1. Update docs/releases.md with the v${newVersion} changelog`);
console.log(`  2. git add -A && git commit -s -m "chore(release): bump version to ${newVersion}"`);
console.log(`  3. git tag v${newVersion} && git push && git push --tags`);
