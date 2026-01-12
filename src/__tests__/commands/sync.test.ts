// Sync command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({ 
      language: 'typescript', 
      workDir: '/tmp/leetcode',
      repo: 'https://github.com/user/repo.git',
    })),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getRepo: vi.fn(() => 'https://github.com/user/repo.git'),
    setRepo: vi.fn(),
  },
}));

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue(Buffer.from('Success')),
  exec: vi.fn((cmd, opts, callback) => {
    if (callback) callback(null, 'Success', '');
    return { on: vi.fn() };
  }),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ 
      confirm: true,
      repoUrl: 'https://github.com/user/repo.git',
    }),
  },
}));

// Import after mocking
import { syncCommand } from '../../commands/sync.js';
import { config } from '../../storage/config.js';

describe('Sync Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncCommand', () => {
    it('should check for repo configuration', async () => {
      await syncCommand();

      expect(config.getRepo).toHaveBeenCalled();
    });

    it('should show message when no repo configured', async () => {
      vi.mocked(config.getRepo).mockReturnValue(undefined);

      await syncCommand();

      // Should prompt for repo or show info
      expect(config.getRepo).toHaveBeenCalled();
    });
  });

  describe('security', () => {
    it('should reject invalid git URL format (command injection attempt)', async () => {
      // Simulating a user entering a malicious URL via prompt
      vi.mocked(config.getRepo).mockReturnValue('; echo hello #');
      
      await syncCommand();
      
      // Security validation should kick in and show error about invalid URL
      expect(outputContains('Invalid repository URL format')).toBe(true);
    });

    it('should reject URLs with shell metacharacters', async () => {
      vi.mocked(config.getRepo).mockReturnValue('https://evil.com/$(id)/repo');
      
      await syncCommand();
      
      expect(outputContains('Invalid repository URL format')).toBe(true);
    });
  });
});
