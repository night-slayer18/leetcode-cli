// Diff command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock dependencies
vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    getProblemById: vi.fn().mockResolvedValue({
      questionFrontendId: '1',
      titleSlug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy',
    }),
    getSubmissionList: vi.fn().mockResolvedValue([
      { id: '12345', statusDisplay: 'Accepted', lang: 'typescript', runtime: '80 ms', timestamp: '1234567890', memory: '42.1 MB' },
      { id: '12344', statusDisplay: 'Wrong Answer', lang: 'typescript', runtime: 'N/A', timestamp: '1234567889', memory: 'N/A' },
    ]),
    getSubmissionDetails: vi.fn().mockResolvedValue({
      code: 'function twoSum(nums, target) { return [0, 1]; }',
      lang: { name: 'TypeScript' },
    }),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
  },
}));

vi.mock('../../utils/fileUtils.js', () => ({
  findSolutionFile: vi.fn().mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts'),
}));

vi.mock('../../utils/auth.js', () => ({
  requireAuth: vi.fn().mockResolvedValue({ authorized: true }),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('function twoSum(nums, target) {\n  // brute force\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = i + 1; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n}'),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('diff', () => ({
  diffLines: vi.fn(() => [
    { value: 'function twoSum(nums, target) {\n', added: false, removed: false },
    { value: '  // brute force\n', removed: true },
    { value: '  return [0, 1];\n', added: true },
    { value: '}\n', added: false, removed: false },
  ]),
}));

// Import after mocking
import { diffCommand } from '../../commands/diff.js';
import { leetcodeClient } from '../../api/client.js';
import { findSolutionFile } from '../../utils/fileUtils.js';
import { requireAuth } from '../../utils/auth.js';

describe('Diff Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('diffCommand', () => {
    it('should compare with last accepted submission by default', async () => {
      await diffCommand('1', {});

      expect(findSolutionFile).toHaveBeenCalled();
      expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
      expect(leetcodeClient.getSubmissionList).toHaveBeenCalled();
      expect(leetcodeClient.getSubmissionDetails).toHaveBeenCalledWith(12345);
      expect(outputContains('Summary')).toBe(true);
    });

    it('should compare with specific submission', async () => {
      await diffCommand('1', { submission: '99999' });

      expect(leetcodeClient.getSubmissionDetails).toHaveBeenCalledWith(99999);
      expect(outputContains('Summary')).toBe(true);
    });

    it('should compare with local file', async () => {
      await diffCommand('1', { file: 'other-solution.ts' });

      expect(outputContains('Summary')).toBe(true);
    });

    it('should handle missing solution file', async () => {
      vi.mocked(findSolutionFile).mockResolvedValueOnce(null);

      await diffCommand('1', {});

      expect(findSolutionFile).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({ authorized: false, username: '' });

      await diffCommand('1', {});

      expect(requireAuth).toHaveBeenCalled();
    });

    it('should handle no accepted submissions', async () => {
      vi.mocked(leetcodeClient.getSubmissionList).mockResolvedValueOnce([
        { id: '12344', statusDisplay: 'Wrong Answer', lang: 'typescript', runtime: 'N/A', timestamp: '1234567889', memory: 'N/A' },
      ]);

      await diffCommand('1', {});

      expect(leetcodeClient.getSubmissionList).toHaveBeenCalled();
      // Spinner.fail is called when no accepted found
    });
  });
});
