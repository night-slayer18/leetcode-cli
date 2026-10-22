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
      site: 'leetcode.com',
      noOpen: false,
    })),
    getLanguage: vi.fn(() => 'typescript'),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getEditor: vi.fn(() => 'code'),
    getRepo: vi.fn(() => undefined),
    getSite: vi.fn(() => 'leetcode.com'),
    getNoOpen: vi.fn(() => false),
    setLanguage: vi.fn(),
    setWorkDir: vi.fn(),
    setEditor: vi.fn(),
    setRepo: vi.fn(),
    setSite: vi.fn(),
    setNoOpen: vi.fn(),
    getPath: vi.fn(() => '/tmp/.leetcode/config.json'),
    getActiveWorkspace: vi.fn(() => 'default'),
  },
}));

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
    clear: vi.fn(() => Promise.resolve({ ok: true })),
  },
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({
      language: 'java',
      editor: 'vim',
      workDir: '/home/user/leetcode',
      proceed: true,
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

    it('should set site', async () => {
      await configCommand({ site: 'leetcode.cn' });
      expect(config.setSite).toHaveBeenCalledWith('leetcode.cn');
    });

    it('should disable auto-open (--no-open)', async () => {
      await configCommand({ noOpen: true });

      expect(config.setNoOpen).toHaveBeenCalledWith(true);
    });

    it('should re-enable auto-open (--open)', async () => {
      await configCommand({ noOpen: false });

      expect(config.setNoOpen).toHaveBeenCalledWith(false);
    });

    it('should show auto-open status in config display', async () => {
      await configCommand({});

      expect(outputContains('Auto-open:')).toBe(true);
    });
  });
});
