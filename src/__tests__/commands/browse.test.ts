// Problem browsing commands tests
// Tests all input variations and filter options
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({ language: 'typescript', workDir: '/tmp/leetcode' })),
    getLanguage: vi.fn(() => 'typescript'),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getEditor: vi.fn(() => 'code'),
  },
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getProblems: vi.fn().mockResolvedValue({
      total: 100,
      problems: [
        { questionId: '1', title: 'Two Sum', difficulty: 'Easy' },
        { questionId: '2', title: 'Add Two Numbers', difficulty: 'Medium' },
      ],
    }),
    getProblem: vi.fn().mockResolvedValue({
      questionId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      content: '<p>Given an array...</p>',
    }),
    getProblemById: vi.fn().mockResolvedValue({
      questionId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      content: '<p>Given an array...</p>',
    }),
    getDailyChallenge: vi.fn().mockResolvedValue({
      date: '2026-01-10',
      question: { questionId: '1', title: 'Two Sum', titleSlug: 'two-sum' },
    }),
    getRandomProblem: vi.fn().mockResolvedValue('two-sum'),
  },
}));

vi.mock('../../utils/display.js', () => ({
  displayProblemDetail: vi.fn(),
  displayProblemList: vi.fn(),
  displayDailyChallenge: vi.fn(),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Import after mocking
import { listCommand } from '../../commands/list.js';
import { showCommand } from '../../commands/show.js';
import { dailyCommand } from '../../commands/daily.js';
import { randomCommand } from '../../commands/random.js';
import { leetcodeClient } from '../../api/client.js';

describe('Problem Browsing Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCommand', () => {
    describe('basic usage', () => {
      it('should fetch and display problems', async () => {
        await listCommand({});

        expect(leetcodeClient.getProblems).toHaveBeenCalled();
      });
    });

    describe('difficulty filter', () => {
      it('should apply easy filter', async () => {
        await listCommand({ difficulty: 'easy' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'EASY' })
        );
      });

      it('should apply easy filter with alias "e"', async () => {
        await listCommand({ difficulty: 'e' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'EASY' })
        );
      });

      it('should apply medium filter', async () => {
        await listCommand({ difficulty: 'medium' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'MEDIUM' })
        );
      });

      it('should apply medium filter with alias "m"', async () => {
        await listCommand({ difficulty: 'm' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'MEDIUM' })
        );
      });

      it('should apply hard filter', async () => {
        await listCommand({ difficulty: 'hard' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'HARD' })
        );
      });

      it('should apply hard filter with alias "h"', async () => {
        await listCommand({ difficulty: 'h' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'HARD' })
        );
      });
    });

    describe('status filter', () => {
      it('should apply solved filter', async () => {
        await listCommand({ status: 'solved' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'AC' })
        );
      });

      it('should apply ac filter (alias)', async () => {
        await listCommand({ status: 'ac' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'AC' })
        );
      });

      it('should apply todo filter', async () => {
        await listCommand({ status: 'todo' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'NOT_STARTED' })
        );
      });

      it('should apply attempted filter', async () => {
        await listCommand({ status: 'attempted' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'TRIED' })
        );
      });

      it('should apply tried filter (alias)', async () => {
        await listCommand({ status: 'tried' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'TRIED' })
        );
      });
    });

    describe('other filters', () => {
      it('should apply tag filter', async () => {
        await listCommand({ tag: ['array', 'hash-table'] });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ tags: ['array', 'hash-table'] })
        );
      });

      it('should apply search filter', async () => {
        await listCommand({ search: 'two sum' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ searchKeywords: 'two sum' })
        );
      });

      it('should apply limit', async () => {
        await listCommand({ limit: '50' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 50 })
        );
      });

      it('should apply page (skip calculation)', async () => {
        await listCommand({ limit: '20', page: '2' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 20, skip: 20 })
        );
      });

      it('should apply page 3 with limit 50', async () => {
        await listCommand({ limit: '50', page: '3' });

        expect(leetcodeClient.getProblems).toHaveBeenCalledWith(
          expect.objectContaining({ limit: 50, skip: 100 })
        );
      });
    });
  });

  describe('showCommand', () => {
    describe('input variations', () => {
      it('should fetch problem by numeric ID', async () => {
        await showCommand('1');

        expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
      });

      it('should fetch problem by title slug', async () => {
        await showCommand('two-sum');

        expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
      });
    });

    describe('error cases', () => {
      it('should handle problem not found', async () => {
        vi.mocked(leetcodeClient.getProblemById).mockResolvedValueOnce(
          null as unknown as Awaited<ReturnType<typeof leetcodeClient.getProblemById>>
        );

        await showCommand('9999');

        expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('9999');
        // Command completes without throwing
      });
    });
  });

  describe('dailyCommand', () => {
    it('should fetch daily challenge', async () => {
      await dailyCommand();

      expect(leetcodeClient.getDailyChallenge).toHaveBeenCalled();
    });
  });

  describe('randomCommand', () => {
    describe('basic usage', () => {
      it('should fetch a random problem', async () => {
        await randomCommand({});

        expect(leetcodeClient.getRandomProblem).toHaveBeenCalled();
      });
    });

    describe('difficulty filter', () => {
      it('should apply easy filter', async () => {
        await randomCommand({ difficulty: 'easy' });

        expect(leetcodeClient.getRandomProblem).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'EASY' })
        );
      });

      it('should apply medium filter', async () => {
        await randomCommand({ difficulty: 'medium' });

        expect(leetcodeClient.getRandomProblem).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'MEDIUM' })
        );
      });

      it('should apply hard filter', async () => {
        await randomCommand({ difficulty: 'hard' });

        expect(leetcodeClient.getRandomProblem).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'HARD' })
        );
      });
    });

    describe('tag filter', () => {
      it('should apply tag filter', async () => {
        await randomCommand({ tag: 'array' });

        expect(leetcodeClient.getRandomProblem).toHaveBeenCalledWith(
          expect.objectContaining({ tags: ['array'] })
        );
      });
    });

    describe('pick option', () => {
      it('should work with --pick option', async () => {
        await randomCommand({ pick: true });

        expect(leetcodeClient.getRandomProblem).toHaveBeenCalled();
        // Test passes if no error thrown - forward to pick is mocked
      });
    });
  });
});
