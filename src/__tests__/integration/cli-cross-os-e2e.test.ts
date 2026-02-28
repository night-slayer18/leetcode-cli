import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const CLI_PATH = join(process.cwd(), 'dist', 'index.js');
const TIMEOUT = 12000;

let tempRoot = '';
let isolatedHome = '';
let sharedWorkDir = '';
let workspaceWorkDir = '';

function runCLI(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const env = {
    ...process.env,
    NO_COLOR: '1',
    HOME: isolatedHome,
    USERPROFILE: isolatedHome,
  };

  try {
    const stdout = execFileSync('node', [CLI_PATH, ...args], {
      encoding: 'utf-8',
      timeout: TIMEOUT,
      env,
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      exitCode: execError.status ?? 1,
    };
  }
}

describe('CLI Cross-OS E2E', () => {
  beforeAll(() => {
    if (!existsSync(CLI_PATH)) {
      throw new Error('CLI not built. Run `npm run build` first.');
    }

    tempRoot = mkdtempSync(join(tmpdir(), 'leetcode-cli-e2e-'));
    isolatedHome = join(tempRoot, 'home');
    sharedWorkDir = join(tempRoot, 'shared workdir');
    workspaceWorkDir = join(tempRoot, 'workspace sql dir');

    mkdirSync(isolatedHome, { recursive: true });
    mkdirSync(sharedWorkDir, { recursive: true });
    mkdirSync(workspaceWorkDir, { recursive: true });
  });

  afterAll(() => {
    if (tempRoot) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('should set and read sql config with paths containing spaces', () => {
    const setConfig = runCLI([
      'config',
      '--lang',
      'sql',
      '--workdir',
      sharedWorkDir,
      '--editor',
      'code',
    ]);

    expect(setConfig.exitCode).toBe(0);

    const showConfig = runCLI(['config']);
    expect(showConfig.exitCode).toBe(0);
    expect(showConfig.stdout.toLowerCase()).toContain('language:');
    expect(showConfig.stdout.toLowerCase()).toContain('sql');
    expect(showConfig.stdout).toContain(sharedWorkDir);
  });

  it('should create/use/list workspace and preserve config isolation', () => {
    const createWs = runCLI(['workspace', 'create', 'sql-e2e', '-w', workspaceWorkDir]);
    expect(createWs.exitCode).toBe(0);

    const listWs = runCLI(['workspace', 'list']);
    expect(listWs.exitCode).toBe(0);
    expect(listWs.stdout).toContain('sql-e2e');

    const useWs = runCLI(['workspace', 'use', 'sql-e2e']);
    expect(useWs.exitCode).toBe(0);

    const currentWs = runCLI(['workspace', 'current']);
    expect(currentWs.exitCode).toBe(0);
    expect(currentWs.stdout).toContain('sql-e2e');
    expect(currentWs.stdout).toContain(workspaceWorkDir);
  });

  it('should run snapshot flow on sql solution file end-to-end', () => {
    const setSqlConfig = runCLI(['config', '--lang', 'sql', '--workdir', workspaceWorkDir]);
    expect(setSqlConfig.exitCode).toBe(0);

    const databaseDir = join(workspaceWorkDir, 'Easy', 'Database');
    mkdirSync(databaseDir, { recursive: true });
    const sqlFile = join(databaseDir, '175.combine-two-tables.sql');

    writeFileSync(sqlFile, 'SELECT p.firstName, p.lastName FROM Person p;', 'utf-8');
    const saveFirst = runCLI(['snapshot', 'save', '175', 'initial']);
    expect(saveFirst.exitCode).toBe(0);
    expect(saveFirst.stdout.toLowerCase()).toContain('snapshot saved');

    writeFileSync(sqlFile, 'SELECT p.firstName FROM Person p;', 'utf-8');
    const saveSecond = runCLI(['snapshot', 'save', '175', 'optimized']);
    expect(saveSecond.exitCode).toBe(0);

    const list = runCLI(['snapshot', 'list', '175']);
    expect(list.exitCode).toBe(0);
    expect(list.stdout).toContain('initial');
    expect(list.stdout).toContain('optimized');

    const diff = runCLI(['snapshot', 'diff', '175', '1', '2']);
    expect(diff.exitCode).toBe(0);
    expect(diff.stdout.toLowerCase()).toContain('diff');
  });

  it('should show sql in config help for built CLI', () => {
    const help = runCLI(['config', '--help']);
    expect(help.exitCode).toBe(0);
    expect(help.stdout.toLowerCase()).toContain('sql');
  });
});
