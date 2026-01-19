// Hint command tests
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

const mockProblemWithHints = {
  questionId: '1',
  questionFrontendId: '1',
  title: 'Two Sum',
  titleSlug: 'two-sum',
  difficulty: 'Easy' as const,
  content: '<p>Given an array...</p>',
  hints: [
    'Think about using a hash map.',
    'A single pass solution exists with O(n) time complexity.',
    'Store each number and its index, then check if the complement exists.',
  ],
  isPaidOnly: false,
  acRate: 50.5,
  topicTags: [],
  status: null,
  codeSnippets: [],
  sampleTestCase: '',
  exampleTestcases: '',
  companyTags: null,
  stats: '{}',
};

const mockProblemWithoutHints = {
  questionId: '4',
  questionFrontendId: '4',
  title: 'Median of Two Sorted Arrays',
  titleSlug: 'median-of-two-sorted-arrays',
  difficulty: 'Hard' as const,
  content: '<p>Given two sorted arrays...</p>',
  hints: [],
  isPaidOnly: false,
  acRate: 35.2,
  topicTags: [],
  status: null,
  codeSnippets: [],
  sampleTestCase: '',
  exampleTestcases: '',
  companyTags: null,
  stats: '{}',
};

const mockProblemWithHtmlHints = {
  questionId: '100',
  questionFrontendId: '100',
  title: 'Same Tree',
  titleSlug: 'same-tree',
  difficulty: 'Easy' as const,
  content: '<p>Given two binary trees...</p>',
  hints: [
    '<p>Use <code>recursion</code> to compare nodes.</p>',
    '<b>Both</b> trees must have identical structure &amp; values.',
  ],
  isPaidOnly: false,
  acRate: 60.1,
  topicTags: [],
  status: null,
  codeSnippets: [],
  sampleTestCase: '',
  exampleTestcases: '',
  companyTags: null,
  stats: '{}',
};

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getProblem: vi.fn(),
    getProblemById: vi.fn(),
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Mock readline for interactive prompts
vi.mock('readline', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn((_, callback) => callback('q')), // Auto-quit for tests
    close: vi.fn(),
  })),
}));

// Import after mocking
import { hintCommand } from '../../commands/hint.js';
import { leetcodeClient } from '../../api/client.js';
import { mockConsole, outputContains } from '../setup.js';

describe('hintCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsole.clear();
  });

  describe('input variations', () => {
    it('should fetch problem by numeric ID', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHints);

      await hintCommand('1', {});

      expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
    });

    it('should fetch problem by title slug', async () => {
      vi.mocked(leetcodeClient.getProblem).mockResolvedValue(mockProblemWithHints);

      await hintCommand('two-sum', {});

      expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
    });
  });

  describe('hint display', () => {
    it('should display problem title', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHints);

      await hintCommand('1', { all: true });

      expect(outputContains('1. Two Sum')).toBe(true);
    });

    it('should display hints when available', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHints);

      await hintCommand('1', { all: true });

      expect(outputContains('Hint 1/3')).toBe(true);
      expect(outputContains('hash map')).toBe(true);
      expect(outputContains('Hint 2/3')).toBe(true);
      expect(outputContains('Hint 3/3')).toBe(true);
    });

    it('should show message when no hints available', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithoutHints);

      await hintCommand('4', { all: true });

      expect(outputContains('No hints available')).toBe(true);
    });

    it('should clean HTML from hints', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHtmlHints);

      await hintCommand('100', { all: true });

      // Should not contain raw HTML tags
      const output = mockConsole.logs.join('\n');
      expect(output.includes('<p>')).toBe(false);
      expect(output.includes('<code>')).toBe(false);
      expect(output.includes('<b>')).toBe(false);
      // Should have cleaned content
      expect(outputContains('recursion')).toBe(true);
    });

    it('should decode HTML entities', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHtmlHints);

      await hintCommand('100', { all: true });

      // &amp; should be converted to &
      expect(outputContains('&')).toBe(true);
      expect(outputContains('&amp;')).toBe(false);
    });
  });

  describe('--all flag', () => {
    it('should show all hints at once with --all flag', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHints);

      await hintCommand('1', { all: true });

      // All three hints should be displayed
      expect(outputContains('Hint 1/3')).toBe(true);
      expect(outputContains('Hint 2/3')).toBe(true);
      expect(outputContains('Hint 3/3')).toBe(true);
    });
  });

  describe('progressive mode', () => {
    it('should display first hint in progressive mode', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblemWithHints);

      await hintCommand('1', {});

      // First hint should be displayed
      expect(outputContains('Hint 1/3')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle problem not found', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(
        null as unknown as Awaited<ReturnType<typeof leetcodeClient.getProblemById>>
      );

      await hintCommand('9999', {});

      // Command should complete without throwing
      expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('9999');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(leetcodeClient.getProblemById).mockRejectedValue(new Error('Network error'));

      await hintCommand('1', {});

      // Command should complete without throwing - the error is caught internally
    });
  });

  describe('single hint problems', () => {
    it('should handle problems with exactly one hint', async () => {
      const singleHintProblem = {
        ...mockProblemWithHints,
        hints: ['This is the only hint.'],
      };
      vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(singleHintProblem);

      await hintCommand('1', { all: true });

      expect(outputContains('Hint 1/1')).toBe(true);
      expect(outputContains('only hint')).toBe(true);
    });
  });
});
