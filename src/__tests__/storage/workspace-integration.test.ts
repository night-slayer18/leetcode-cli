// Workspace Storage Integration Tests
// Tests that verify workspace isolation actually works across all storage modules
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Create test directory path
const TEST_BASE = tmpdir();
const TEST_RUN_ID = `leetcode-test-${process.pid}`;
const TEST_DIR = join(TEST_BASE, TEST_RUN_ID);
const MOCK_LEETCODE_DIR = join(TEST_DIR, '.leetcode');

// Mock homedir BEFORE importing storage modules
vi.mock('os', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('os');
  const testDir = join(actual.tmpdir(), `leetcode-test-${process.pid}`);
  return {
    ...actual,
    homedir: () => testDir,
  };
});

// Import storage modules after mocking
import { workspaceStorage } from '../../storage/workspaces.js';
import { config } from '../../storage/config.js';
import { timerStorage } from '../../storage/timer.js';
import { collabStorage } from '../../storage/collab.js';

describe('Workspace Storage Integration', () => {
  beforeEach(() => {
    // Clean start for each test
    if (existsSync(MOCK_LEETCODE_DIR)) {
      rmSync(MOCK_LEETCODE_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Cleanup after tests
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Workspace Initialization', () => {
    it('should create default workspace on first access', () => {
      const active = workspaceStorage.getActive();

      expect(active).toBe('default');
      expect(workspaceStorage.exists('default')).toBe(true);
    });

    it('should create workspace directory structure', () => {
      workspaceStorage.getActive(); // Triggers initialization

      const wsDir = join(MOCK_LEETCODE_DIR, 'workspaces', 'default');
      expect(existsSync(wsDir)).toBe(true);
      expect(existsSync(join(wsDir, 'config.json'))).toBe(true);
      expect(existsSync(join(wsDir, 'timer.json'))).toBe(true);
      expect(existsSync(join(wsDir, 'collab.json'))).toBe(true);
      expect(existsSync(join(wsDir, 'snapshots'))).toBe(true);
    });
  });

  describe('Config Isolation', () => {
    it('should isolate config between workspaces', () => {
      // Create two workspaces with different configs
      workspaceStorage.create('ws-python', { workDir: '/python', lang: 'python3' });
      workspaceStorage.create('ws-java', { workDir: '/java', lang: 'java' });

      // Switch to python workspace and verify config
      workspaceStorage.setActive('ws-python');
      expect(config.getLanguage()).toBe('python3');
      expect(config.getWorkDir()).toBe('/python');

      // Switch to java workspace and verify config
      workspaceStorage.setActive('ws-java');
      expect(config.getLanguage()).toBe('java');
      expect(config.getWorkDir()).toBe('/java');

      // Switch back to python, should still have python config
      workspaceStorage.setActive('ws-python');
      expect(config.getLanguage()).toBe('python3');
    });

    it('should save config changes to active workspace only', () => {
      workspaceStorage.create('ws-a', { workDir: '/a', lang: 'typescript' });
      workspaceStorage.create('ws-b', { workDir: '/b', lang: 'typescript' });

      // Switch to ws-a and change language
      workspaceStorage.setActive('ws-a');
      config.setLanguage('python3');

      // ws-b should still have typescript
      workspaceStorage.setActive('ws-b');
      expect(config.getLanguage()).toBe('typescript');

      // ws-a should have python3
      workspaceStorage.setActive('ws-a');
      expect(config.getLanguage()).toBe('python3');
    });
  });

  describe('Timer Isolation', () => {
    it('should isolate timer data between workspaces', () => {
      workspaceStorage.create('ws-timer-1', { workDir: '/t1', lang: 'typescript' });
      workspaceStorage.create('ws-timer-2', { workDir: '/t2', lang: 'typescript' });

      // Record solve time in ws-timer-1
      workspaceStorage.setActive('ws-timer-1');
      timerStorage.recordSolveTime('1', 'Two Sum', 'Easy', 300, 20);

      // ws-timer-2 should have no solve times
      workspaceStorage.setActive('ws-timer-2');
      expect(timerStorage.getSolveTimes('1')).toHaveLength(0);
      expect(timerStorage.getStats().totalProblems).toBe(0);

      // ws-timer-1 should still have the solve time
      workspaceStorage.setActive('ws-timer-1');
      expect(timerStorage.getSolveTimes('1')).toHaveLength(1);
      expect(timerStorage.getStats().totalProblems).toBe(1);
    });

    it('should isolate active timer between workspaces', () => {
      workspaceStorage.create('ws-active-1', { workDir: '/a1', lang: 'typescript' });
      workspaceStorage.create('ws-active-2', { workDir: '/a2', lang: 'typescript' });

      // Start timer in ws-active-1
      workspaceStorage.setActive('ws-active-1');
      timerStorage.startTimer('1', 'Two Sum', 'Easy', 20);
      expect(timerStorage.getActiveTimer()).not.toBeNull();

      // ws-active-2 should have no active timer
      workspaceStorage.setActive('ws-active-2');
      expect(timerStorage.getActiveTimer()).toBeNull();

      // ws-active-1 should still have active timer
      workspaceStorage.setActive('ws-active-1');
      expect(timerStorage.getActiveTimer()).not.toBeNull();
      expect(timerStorage.getActiveTimer()?.problemId).toBe('1');
    });
  });

  describe('Collab Isolation', () => {
    it('should isolate collab sessions between workspaces', () => {
      workspaceStorage.create('ws-collab-1', { workDir: '/c1', lang: 'typescript' });
      workspaceStorage.create('ws-collab-2', { workDir: '/c2', lang: 'typescript' });

      // Set session in ws-collab-1
      workspaceStorage.setActive('ws-collab-1');
      collabStorage.setSession({
        roomCode: 'ABC123',
        problemId: '1',
        isHost: true,
        username: 'user1',
      });
      expect(collabStorage.getSession()).not.toBeNull();

      // ws-collab-2 should have no session
      workspaceStorage.setActive('ws-collab-2');
      expect(collabStorage.getSession()).toBeNull();

      // ws-collab-1 should still have session
      workspaceStorage.setActive('ws-collab-1');
      expect(collabStorage.getSession()?.roomCode).toBe('ABC123');
    });
  });

  describe('Workspace Switching', () => {
    it('should correctly switch between multiple workspaces', () => {
      // Create 3 workspaces
      workspaceStorage.create('work', { workDir: '/work', lang: 'go' });
      workspaceStorage.create('study', { workDir: '/study', lang: 'python3' });
      workspaceStorage.create('interview', { workDir: '/interview', lang: 'java' });

      // Verify each workspace has correct config
      workspaceStorage.setActive('work');
      expect(config.getLanguage()).toBe('go');

      workspaceStorage.setActive('study');
      expect(config.getLanguage()).toBe('python3');

      workspaceStorage.setActive('interview');
      expect(config.getLanguage()).toBe('java');

      // Circle back and verify consistency
      workspaceStorage.setActive('work');
      expect(config.getLanguage()).toBe('go');
    });

    it('should list all workspaces correctly', () => {
      // Ensure default is initialized first
      workspaceStorage.getActive();

      workspaceStorage.create('a', { workDir: '/a', lang: 'typescript' });
      workspaceStorage.create('b', { workDir: '/b', lang: 'typescript' });
      workspaceStorage.create('c', { workDir: '/c', lang: 'typescript' });

      const list = workspaceStorage.list();
      expect(list).toContain('default');
      expect(list).toContain('a');
      expect(list).toContain('b');
      expect(list).toContain('c');
      expect(list).toHaveLength(4);
    });
  });

  describe('Workspace Deletion', () => {
    it('should not allow deleting default workspace', () => {
      const result = workspaceStorage.delete('default');
      expect(result).toBe(false);
      expect(workspaceStorage.exists('default')).toBe(true);
    });

    it('should switch to default when active workspace is deleted', () => {
      workspaceStorage.create('temp', { workDir: '/temp', lang: 'typescript' });
      workspaceStorage.setActive('temp');
      expect(workspaceStorage.getActive()).toBe('temp');

      workspaceStorage.delete('temp');
      expect(workspaceStorage.getActive()).toBe('default');
    });

    it('should remove workspace from list after deletion', () => {
      workspaceStorage.create('toDelete', { workDir: '/del', lang: 'typescript' });
      expect(workspaceStorage.exists('toDelete')).toBe(true);

      workspaceStorage.delete('toDelete');
      expect(workspaceStorage.exists('toDelete')).toBe(false);
      expect(workspaceStorage.list()).not.toContain('toDelete');
    });
  });
});
