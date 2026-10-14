import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isProblemNotFoundError,
  resolveProblem,
  resolveProblemIdentifier,
  type ResolveProblemOptions,
} from '../../utils/problem-resolver.js';
import { leetcodeClient } from '../../api/client.js';
import { requireAuth } from '../../utils/auth.js';
import { mockConsole, outputContains } from '../setup.js';
import type { ProblemDetail } from '../../types.js';

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    getProblem: vi.fn(),
    getProblemById: vi.fn(),
  },
}));

vi.mock('../../utils/auth.js', () => ({
  requireAuth: vi.fn().mockResolvedValue({ authorized: true }),
}));

vi.mock('ora', () => {
  const spinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  };
  return {
    default: vi.fn(() => spinner),
  };
});

const mockProblemDetail: ProblemDetail = {
  questionId: '1',
  questionFrontendId: '1',
  title: 'Two Sum',
  titleSlug: 'two-sum',
  difficulty: 'Easy',
  content: '<p>Two Sum</p>',
  hints: [],
  isPaidOnly: false,
  acRate: 50.1,
  topicTags: [{ name: 'Array', slug: 'array' }],
  status: null,
  codeSnippets: [],
  sampleTestCase: '',
  exampleTestcases: '',
  companyTags: null,
  stats: '{}',
};

describe('problem-resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsole.clear();
  });

  describe('isProblemNotFoundError', () => {
    it('returns true for Zod expected object, received null message', () => {
      expect(
        isProblemNotFoundError(new Error('Invalid input: expected object, received null'))
      ).toBe(true);
    });

    it('returns true for Problem #X not found message', () => {
      expect(isProblemNotFoundError(new Error('Problem #42 not found'))).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isProblemNotFoundError(new Error('Network error'))).toBe(false);
      expect(isProblemNotFoundError(new Error('Unauthorized'))).toBe(false);
    });

    it('returns false for non-errors', () => {
      expect(isProblemNotFoundError('string')).toBe(false);
      expect(isProblemNotFoundError(null)).toBe(false);
      expect(isProblemNotFoundError(undefined)).toBe(false);
    });
  });

  describe('resolveProblem', () => {
    it('rejects invalid problem IDs or slugs without calling API', async () => {
      const mockSpinner = {
        fail: vi.fn(),
      } as unknown as NonNullable<ResolveProblemOptions['spinner']>;

      const result = await resolveProblem('Invalid Problem Name!', { spinner: mockSpinner });

      expect(result).toBeNull();
      expect(leetcodeClient.getProblemById).not.toHaveBeenCalled();
      expect(leetcodeClient.getProblem).not.toHaveBeenCalled();
      expect(mockSpinner.fail).toHaveBeenCalledWith(
        'Invalid problem ID or name: Invalid Problem Name!'
      );
    });

    it('fetches problem by numeric ID', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValueOnce(mockProblemDetail);

      const result = await resolveProblem('1');

      expect(result).toEqual(mockProblemDetail);
      expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
      expect(leetcodeClient.getProblem).not.toHaveBeenCalled();
    });

    it('fetches problem by title slug', async () => {
      vi.mocked(leetcodeClient.getProblem).mockResolvedValueOnce(mockProblemDetail);

      const result = await resolveProblem('two-sum');

      expect(result).toEqual(mockProblemDetail);
      expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
      expect(leetcodeClient.getProblemById).not.toHaveBeenCalled();
    });

    it('handles problem not found when API returns null', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValueOnce(
        null as unknown as Awaited<ReturnType<typeof leetcodeClient.getProblemById>>
      );
      const mockSpinner = {
        fail: vi.fn(),
      } as unknown as NonNullable<ResolveProblemOptions['spinner']>;

      const result = await resolveProblem('9999', { spinner: mockSpinner });

      expect(result).toBeNull();
      expect(mockSpinner.fail).toHaveBeenCalledWith('Problem "9999" not found');
    });

    it('handles unknown slug cleanly without dumping raw Zod error', async () => {
      vi.mocked(leetcodeClient.getProblem).mockRejectedValueOnce(
        new Error('Invalid input: expected object, received null')
      );
      const mockSpinner = {
        fail: vi.fn(),
      } as unknown as NonNullable<ResolveProblemOptions['spinner']>;

      const result = await resolveProblem('unknown-slug', { spinner: mockSpinner });

      expect(result).toBeNull();
      expect(mockSpinner.fail).toHaveBeenCalledWith('Problem "unknown-slug" not found');
      expect(outputContains('Check the problem name')).toBe(true);
      expect(outputContains('expected object, received null')).toBe(false);
    });

    it('handles unexpected API errors with failMessage or default', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockRejectedValueOnce(new Error('ETIMEDOUT'));
      const mockSpinner = {
        fail: vi.fn(),
      } as unknown as NonNullable<ResolveProblemOptions['spinner']>;

      const result = await resolveProblem('1', {
        spinner: mockSpinner,
        failMessage: 'Failed to fetch problem hints',
      });

      expect(result).toBeNull();
      expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to fetch problem hints');
      expect(outputContains('ETIMEDOUT')).toBe(true);
    });

    it('supports silent option to suppress console messages', async () => {
      vi.mocked(leetcodeClient.getProblem).mockRejectedValueOnce(
        new Error('Invalid input: expected object, received null')
      );

      const result = await resolveProblem('unknown-slug', { silent: true });

      expect(result).toBeNull();
      expect(outputContains('Check the problem name')).toBe(false);
    });
  });

  describe('resolveProblemIdentifier', () => {
    it('returns problemId immediately for numeric ID without calling getProblem', async () => {
      const result = await resolveProblemIdentifier('1');

      expect(result).toEqual({ problemId: '1', problem: null });
      expect(leetcodeClient.getProblem).not.toHaveBeenCalled();
      expect(leetcodeClient.getProblemById).not.toHaveBeenCalled();
    });

    it('rejects invalid inputs without calling API', async () => {
      const result = await resolveProblemIdentifier('invalid problem name!');

      expect(result).toBeNull();
      expect(outputContains('Invalid problem ID or name')).toBe(true);
      expect(leetcodeClient.getProblem).not.toHaveBeenCalled();
    });

    it('stops if not authorized', async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({ authorized: false });

      const result = await resolveProblemIdentifier('two-sum');

      expect(result).toBeNull();
      expect(leetcodeClient.getProblem).not.toHaveBeenCalled();
    });

    it('resolves slug and returns problemId and problem detail', async () => {
      vi.mocked(leetcodeClient.getProblem).mockResolvedValueOnce(mockProblemDetail);

      const result = await resolveProblemIdentifier('two-sum');

      expect(result).toEqual({ problemId: '1', problem: mockProblemDetail });
      expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
    });

    it('reports not found when slug does not exist', async () => {
      vi.mocked(leetcodeClient.getProblem).mockRejectedValueOnce(
        new Error('Invalid input: expected object, received null')
      );

      const result = await resolveProblemIdentifier('non-existent-problem');

      expect(result).toBeNull();
      expect(outputContains('Check the problem name')).toBe(true);
    });

    it('reports unexpected lookup failure', async () => {
      vi.mocked(leetcodeClient.getProblem).mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

      const result = await resolveProblemIdentifier('two-sum');

      expect(result).toBeNull();
      expect(outputContains('connect ECONNREFUSED')).toBe(true);
    });
  });
});
