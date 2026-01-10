// CLI Integration Tests
// These tests run the actual CLI binary to ensure it works end-to-end
// This catches issues like: missing shebang, broken imports, build errors

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const CLI_PATH = join(process.cwd(), 'dist', 'index.js');
const TIMEOUT = 10000; // 10 seconds

// Helper to run CLI and get output
function runCLI(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args.join(' ')}`, {
      encoding: 'utf-8',
      timeout: TIMEOUT,
      env: { ...process.env, NO_COLOR: '1' }, // Disable chalk colors
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

describe('CLI Integration Tests', () => {
  beforeAll(() => {
    // Ensure CLI is built
    if (!existsSync(CLI_PATH)) {
      throw new Error('CLI not built. Run `npm run build` first.');
    }
  });

  describe('Build Verification', () => {
    it('should have dist/index.js file', () => {
      expect(existsSync(CLI_PATH)).toBe(true);
    });

    it('should have shebang in dist/index.js', () => {
      const content = readFileSync(CLI_PATH, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should export valid JavaScript', () => {
      const content = readFileSync(CLI_PATH, 'utf-8');
      // Check it's not empty and has basic structure
      expect(content.length).toBeGreaterThan(1000);
      expect(content).toContain('commander');
    });
  });

  describe('Basic Commands (Smoke Tests)', () => {
    it('should show version with --version', () => {
      const { stdout, exitCode } = runCLI(['--version']);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/); // Semver format
    });

    it('should show version with -v', () => {
      const { stdout, exitCode } = runCLI(['-v']);
      expect(exitCode).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should show help with --help', () => {
      const { stdout, exitCode } = runCLI(['--help']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('leetcode');
    });

    it('should show help with -h', () => {
      const { stdout, exitCode } = runCLI(['-h']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage:');
    });

    it('should show help when no args provided', () => {
      const { stdout, stderr } = runCLI([]);
      // Output might go to stdout or stderr
      const output = stdout + stderr;
      expect(output).toContain('leetcode');
    });
  });

  describe('Command Registration', () => {
    // Verify all commands are registered and show help

    it('should have login command', () => {
      const { stdout } = runCLI(['login', '--help']);
      expect(stdout).toContain('login');
    });

    it('should have logout command', () => {
      const { stdout } = runCLI(['logout', '--help']);
      expect(stdout).toContain('logout');
    });

    it('should have whoami command', () => {
      const { stdout } = runCLI(['whoami', '--help']);
      expect(stdout).toContain('whoami');
    });

    it('should have list command', () => {
      const { stdout } = runCLI(['list', '--help']);
      expect(stdout).toContain('list');
      expect(stdout).toContain('--difficulty');
      expect(stdout).toContain('--status');
    });

    it('should have show command', () => {
      const { stdout } = runCLI(['show', '--help']);
      expect(stdout).toContain('show');
    });

    it('should have pick command', () => {
      const { stdout } = runCLI(['pick', '--help']);
      expect(stdout).toContain('pick');
      expect(stdout).toContain('--lang');
    });

    it('should have test command', () => {
      const { stdout } = runCLI(['test', '--help']);
      expect(stdout).toContain('test');
    });

    it('should have submit command', () => {
      const { stdout } = runCLI(['submit', '--help']);
      expect(stdout).toContain('submit');
    });

    it('should have daily command', () => {
      const { stdout } = runCLI(['daily', '--help']);
      expect(stdout).toContain('daily');
    });

    it('should have random command', () => {
      const { stdout } = runCLI(['random', '--help']);
      expect(stdout).toContain('random');
      expect(stdout).toContain('--difficulty');
    });

    it('should have stat command', () => {
      const { stdout } = runCLI(['stat', '--help']);
      expect(stdout).toContain('stat');
    });

    it('should have submissions command', () => {
      const { stdout } = runCLI(['submissions', '--help']);
      expect(stdout).toContain('submissions');
    });

    it('should have timer command', () => {
      const { stdout } = runCLI(['timer', '--help']);
      expect(stdout).toContain('timer');
      expect(stdout).toContain('--minutes');
    });

    it('should have config command', () => {
      const { stdout } = runCLI(['config', '--help']);
      expect(stdout).toContain('config');
      expect(stdout).toContain('--lang');
      expect(stdout).toContain('--editor');
    });

    it('should have sync command', () => {
      const { stdout } = runCLI(['sync', '--help']);
      expect(stdout).toContain('sync');
    });

    it('should have bookmark command', () => {
      const { stdout } = runCLI(['bookmark', '--help']);
      expect(stdout).toContain('bookmark');
    });

    it('should have note command', () => {
      const { stdout } = runCLI(['note', '--help']);
      expect(stdout).toContain('note');
    });

    it('should have today command', () => {
      const { stdout } = runCLI(['today', '--help']);
      expect(stdout).toContain('today');
    });

    it('should have collab command', () => {
      const { stdout } = runCLI(['collab', '--help']);
      expect(stdout).toContain('collab');
      expect(stdout).toContain('host');
      expect(stdout).toContain('join');
      expect(stdout).toContain('sync');
      expect(stdout).toContain('compare');
    });

    it('should have snapshot command', () => {
      const { stdout } = runCLI(['snapshot', '--help']);
      expect(stdout).toContain('snapshot');
      expect(stdout).toContain('save');
      expect(stdout).toContain('list');
      expect(stdout).toContain('restore');
      expect(stdout).toContain('diff');
      expect(stdout).toContain('delete');
    });
  });

  describe('Collab Subcommands', () => {
    it('should have collab host subcommand', () => {
      const { stdout } = runCLI(['collab', 'host', '--help']);
      expect(stdout).toContain('host');
    });

    it('should have collab join subcommand', () => {
      const { stdout } = runCLI(['collab', 'join', '--help']);
      expect(stdout).toContain('join');
    });

    it('should have collab sync subcommand', () => {
      const { stdout } = runCLI(['collab', 'sync', '--help']);
      expect(stdout).toContain('sync');
    });

    it('should have collab compare subcommand', () => {
      const { stdout } = runCLI(['collab', 'compare', '--help']);
      expect(stdout).toContain('compare');
    });

    it('should have collab status subcommand', () => {
      const { stdout } = runCLI(['collab', 'status', '--help']);
      expect(stdout).toContain('status');
    });

    it('should have collab leave subcommand', () => {
      const { stdout } = runCLI(['collab', 'leave', '--help']);
      expect(stdout).toContain('leave');
    });
  });

  describe('Error Handling', () => {
    it('should show error for unknown command', () => {
      const { stderr, exitCode } = runCLI(['unknowncommand']);
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('error');
    });

    it('should suggest help on error', () => {
      const { stderr } = runCLI(['unknowncommand']);
      expect(stderr).toContain('--help');
    });
  });

  describe('Aliases', () => {
    it('should support list alias "l"', () => {
      const { stdout } = runCLI(['l', '--help']);
      expect(stdout).toContain('list');
    });

    it('should support show alias "s"', () => {
      const { stdout } = runCLI(['s', '--help']);
      expect(stdout).toContain('show');
    });

    it('should support daily alias "d"', () => {
      const { stdout } = runCLI(['d', '--help']);
      expect(stdout).toContain('daily');
    });

    it('should support random alias "r"', () => {
      const { stdout } = runCLI(['r', '--help']);
      expect(stdout).toContain('random');
    });

    it('should support pick alias "p"', () => {
      const { stdout } = runCLI(['p', '--help']);
      expect(stdout).toContain('pick');
    });

    it('should support test alias "t"', () => {
      const { stdout } = runCLI(['t', '--help']);
      expect(stdout).toContain('test');
    });

    it('should support submit alias "x"', () => {
      const { stdout } = runCLI(['x', '--help']);
      expect(stdout).toContain('submit');
    });
  });
});
