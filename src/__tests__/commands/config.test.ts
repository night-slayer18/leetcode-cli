// Config command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock storage
vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({
      language: 'typescript',
      workDir: '/tmp/leetcode',
      editor: 'code',
      repo: undefined,
    })),
    getLanguage: vi.fn(() => 'typescript'),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getEditor: vi.fn(() => 'code'),
    getRepo: vi.fn(() => undefined),
    setLanguage: vi.fn(),
    setWorkDir: vi.fn(),
    setEditor: vi.fn(),
    setRepo: vi.fn(),
    getPath: vi.fn(() => '/tmp/.leetcode/config.json'),
    getActiveWorkspace: vi.fn(() => 'default'),
  },
}));

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
  },
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({
      language: 'java',
      editor: 'vim',
      workDir: '/home/user/leetcode',
    }),
  },
}));

// Import after mocking
import { configCommand } from '../../commands/config.js';
import { config } from '../../storage/config.js';

describe('Config Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('view config', () => {
    it('should display current config', async () => {
      await configCommand({});

      expect(config.getConfig).toHaveBeenCalled();
      expect(outputContains('Config file:')).toBe(true);
    });
  });

  describe('set options', () => {
    it('should set language', async () => {
      await configCommand({ lang: 'java' });

      expect(config.setLanguage).toHaveBeenCalledWith('java');
    });

    it('should set sql as default language', async () => {
      await configCommand({ lang: 'sql' });

      expect(config.setLanguage).toHaveBeenCalledWith('sql');
    });

    it('should set editor', async () => {
      await configCommand({ editor: 'vim' });

      expect(config.setEditor).toHaveBeenCalledWith('vim');
    });

    it('should set workdir', async () => {
      await configCommand({ workdir: '/home/user/leetcode' });

      expect(config.setWorkDir).toHaveBeenCalledWith('/home/user/leetcode');
    });

    it('should set repo when lang is also provided', async () => {
      // The config command requires lang|editor|workdir to be set to not just show config
      await configCommand({ lang: 'typescript', repo: 'https://github.com/user/repo.git' });

      expect(config.setRepo).toHaveBeenCalledWith('https://github.com/user/repo.git');
    });
  });
});
