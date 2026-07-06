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

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    getSubmissionList: vi.fn().mockResolvedValue([
      { id: '12345', statusDisplay: 'Accepted' },
    ]),
    getSubmissionDetails: vi.fn().mockResolvedValue({
      code: 'class Solution {}',
      runtimeDisplay: '56ms',
      runtimePercentile: 84.5,
      memoryDisplay: '42.1MB',
      memoryPercentile: 76.2,
      lang: { name: 'typescript' },
    }),
  },
}));

vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue(Buffer.from('')),
  execFileSync: vi.fn(),
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
import { leetcodeClient } from '../../api/client.js';
import { execSync, execFileSync } from 'child_process';
import { existsSync } from 'fs';

describe('Sync Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore defaults after clearAllMocks
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(config.getWorkDir).mockReturnValue('/tmp/leetcode');
    vi.mocked(config.getRepo).mockReturnValue('https://github.com/user/repo.git');
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));
    vi.mocked(leetcodeClient.getSubmissionList).mockResolvedValue([
      { id: '12345', statusDisplay: 'Accepted' },
    ]);
    vi.mocked(leetcodeClient.getSubmissionDetails).mockResolvedValue({
      code: 'class Solution {}',
      runtimeDisplay: '56ms',
      runtimePercentile: 84.5,
      memoryDisplay: '42.1MB',
      memoryPercentile: 76.2,
      lang: { name: 'typescript' },
    });
  });

  // ─── Early exit guards ────────────────────────────────────────────────────

  describe('early exit guards', () => {
    it('should bail if work directory does not exist', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      await syncCommand();

      expect(execFileSync).not.toHaveBeenCalled();
      expect(outputContains('does not exist')).toBe(true);
    });

    it('should bail if git is not installed', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd.includes('git --version')) {
          throw new Error('git not found');
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(execFileSync).not.toHaveBeenCalled();
      expect(outputContains('Git is not installed')).toBe(true);
    });
  });

  // ─── No changes ───────────────────────────────────────────────────────────

  describe('no changes', () => {
    it('should show "No changes to sync" and skip commit when git status is empty', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return '';
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(execFileSync).not.toHaveBeenCalledWith('git', expect.arrayContaining(['commit']), expect.any(Object));
      expect(leetcodeClient.getSubmissionList).not.toHaveBeenCalled();
    });
  });

  // ─── Config / repo checks ─────────────────────────────────────────────────

  describe('config checks', () => {
    it('should call config.getRepo during setup', async () => {
      await syncCommand();
      expect(config.getRepo).toHaveBeenCalled();
    });

    it('should reject invalid git URL format (command injection attempt)', async () => {
      vi.mocked(config.getRepo).mockReturnValue('; echo hello #');

      await syncCommand();

      expect(outputContains('Invalid repository URL format')).toBe(true);
      expect(execFileSync).not.toHaveBeenCalled();
    });

    it('should reject URLs with shell metacharacters', async () => {
      vi.mocked(config.getRepo).mockReturnValue('https://evil.com/$(id)/repo');

      await syncCommand();

      expect(outputContains('Invalid repository URL format')).toBe(true);
    });
  });

  // ─── Happy path: solution files ───────────────────────────────────────────

  describe('commit with solution stats', () => {
    it('should fetch stats and build detailed commit body for a single solution', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M Easy/Array/1.two-sum.ts\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledWith('two-sum', 5);
      expect(leetcodeClient.getSubmissionDetails).toHaveBeenCalledWith(12345);
      expect(execFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([
          'commit',
          '-m',
          expect.stringContaining('Sync: 1 solutions'),
          '-m',
          expect.stringContaining('- [1. two-sum] Runtime: 56ms (beats 84.50%), Memory: 42.1MB (beats 76.20%)'),
        ]),
        expect.any(Object)
      );
    });

    it('should commit multiple solutions in a single commit with all stats in the body', async () => {
      vi.mocked(leetcodeClient.getSubmissionList).mockResolvedValue([
        { id: '12345', statusDisplay: 'Accepted' },
      ]);
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M Easy/Array/1.two-sum.ts\n M Medium/Tree/102.binary-tree-level-order-traversal.ts\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledTimes(2);
      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledWith('two-sum', 5);
      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledWith('binary-tree-level-order-traversal', 5);

      expect(execFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([
          'commit',
          '-m',
          expect.stringContaining('Sync: 2 solutions'),
          '-m',
          expect.stringContaining('two-sum'),
        ]),
        expect.any(Object)
      );
    });

    it('should deduplicate stats queries when the same slug appears more than once', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          // Same title slug in two different file types
          return ' M Easy/Array/1.two-sum.ts\n M Easy/Array/1.two-sum.py\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      // Should only query the API once for "two-sum"
      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Non-solution files ───────────────────────────────────────────────────

  describe('non-solution files', () => {
    it('should commit without fetching stats when only non-solution files change', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M README.md\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(leetcodeClient.getSubmissionList).not.toHaveBeenCalled();
      // Still commits, just without the stats body
      expect(execFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['commit', '-m', expect.stringContaining('Sync: 1 solutions')]),
        expect.any(Object)
      );
    });

    it('should only fetch stats for solution files in a mixed-file commit', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M README.md\n M Easy/Array/1.two-sum.ts\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      // Only fetches stats for the solution file, ignores README
      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledTimes(1);
      expect(leetcodeClient.getSubmissionList).toHaveBeenCalledWith('two-sum', 5);
    });
  });

  // ─── API fallbacks ────────────────────────────────────────────────────────

  describe('API fallbacks', () => {
    it('should fall back to "Stats unavailable" when API throws an error', async () => {
      vi.mocked(leetcodeClient.getSubmissionList).mockRejectedValue(new Error('Network error'));
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M Easy/Array/1.two-sum.ts\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(execFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([
          'commit',
          '-m',
          expect.stringContaining('Sync:'),
          '-m',
          expect.stringContaining('Stats unavailable'),
        ]),
        expect.any(Object)
      );
    });

    it('should fall back to "No accepted submission stats found" when no AC submission exists', async () => {
      vi.mocked(leetcodeClient.getSubmissionList).mockResolvedValue([
        { id: '9999', statusDisplay: 'Wrong Answer' },
        { id: '8888', statusDisplay: 'Time Limit Exceeded' },
      ]);
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M Easy/Array/1.two-sum.ts\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      expect(execFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([
          'commit',
          '-m',
          expect.stringContaining('Sync:'),
          '-m',
          expect.stringContaining('No accepted submission stats found'),
        ]),
        expect.any(Object)
      );
    });

    it('should show runtime and memory without beats text when percentiles are not returned', async () => {
      vi.mocked(leetcodeClient.getSubmissionDetails).mockResolvedValue({
        code: 'class Solution {}',
        runtimeDisplay: '10ms',
        runtimePercentile: null,
        memoryDisplay: '20MB',
        memoryPercentile: null,
        lang: { name: 'typescript' },
      });
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M Easy/Array/1.two-sum.ts\n';
        }
        return Buffer.from('');
      });

      await syncCommand();

      const commitCall = vi.mocked(execFileSync).mock.calls.find(
        (call) => call[0] === 'git' && Array.isArray(call[1]) && (call[1] as string[]).includes('commit')
      );
      const args = commitCall?.[1] as string[];
      const bodyIdx = args.lastIndexOf('-m');
      const body = args[bodyIdx + 1];

      expect(body).toContain('Runtime: 10ms');
      expect(body).toContain('Memory: 20MB');
      expect(body).not.toContain('beats');
    });
  });

  // ─── Push failures ────────────────────────────────────────────────────────

  describe('push failures', () => {
    it('should report failure when push to both main and master branches fail', async () => {
      vi.mocked(execSync).mockImplementation((cmd) => {
        if (typeof cmd === 'string' && cmd === 'git status --porcelain') {
          return ' M Easy/Array/1.two-sum.ts\n';
        }
        if (typeof cmd === 'string' && cmd.includes('git push')) {
          throw new Error('Push rejected');
        }
        return Buffer.from('');
      });

      await syncCommand();

      // ora spinner.fail() doesn't go through console.log, so we assert on the
      // chalk.red(error.message) line that sync.ts logs after the spinner fails.
      expect(outputContains('Failed to push to remote')).toBe(true);
    });
  });
});
