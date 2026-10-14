import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { findSolutionFile } from '../../utils/fileUtils.js';

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'leetcode-cli-file-utils-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'Easy', 'Array'), { recursive: true });
  writeFileSync(join(dir, 'Easy', 'Array', '1.two-sum.ts'), '// typescript');
  writeFileSync(join(dir, 'Easy', 'Array', '1.two-sum.py'), '# python');
  writeFileSync(join(dir, 'Easy', 'Array', '1.two-sum.java'), '// java');
  writeFileSync(join(dir, 'Easy', 'Array', '1.two-sum.md'), '# notes');
  return dir;
}

describe('findSolutionFile', () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('finds a solution file without a language filter', async () => {
    const dir = createTempWorkspace();

    const found = await findSolutionFile(dir, '1');

    expect(found).not.toBeNull();
    expect(found!.endsWith('.md')).toBe(false);
  });

  it('only matches files of the requested language', async () => {
    const dir = createTempWorkspace();

    const found = await findSolutionFile(dir, '1', 'python3');

    expect(found).not.toBeNull();
    expect(found!.endsWith('.py')).toBe(true);
  });

  it('finds files of the requested language in nested directories', async () => {
    const dir = createTempWorkspace();

    const found = await findSolutionFile(dir, '1', 'java');

    expect(found).not.toBeNull();
    expect(found!.endsWith('.java')).toBe(true);
  });

  it('returns null when no file matches the requested language', async () => {
    const dir = createTempWorkspace();

    const found = await findSolutionFile(dir, '1', 'cpp');

    expect(found).toBeNull();
  });

  it('skips non-code files such as markdown', async () => {
    const dir = createTempWorkspace();

    const found = await findSolutionFile(dir, '1', 'cpp');

    expect(found).toBeNull();
  });

  it('returns null for unknown problems', async () => {
    const dir = createTempWorkspace();

    const found = await findSolutionFile(dir, '999');

    expect(found).toBeNull();
  });
});
