import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

const { mockProblem } = vi.hoisted(() => ({
  mockProblem: {
    questionId: '1',
    questionFrontendId: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy' as const,
    content: '<p>Given an array...</p>',
    topicTags: [{ name: 'Array', slug: 'array' }],
    codeSnippets: [
      {
        lang: 'TypeScript',
        langSlug: 'typescript',
        code: 'function twoSum(nums: number[], target: number): number[] {\n\n}',
      },
      {
        lang: 'Java',
        langSlug: 'java',
        code: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n\n    }\n}',
      },
    ],
    exampleTestcases: '[2,7,11,15]\n9',
    sampleTestCase: '[2,7,11,15]\n9',
    hints: [],
    companyTags: [],
    stats: '{}',
    isPaidOnly: false,
    acRate: 0,
    status: null,
  },
}));

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
    status: vi.fn(),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({
      language: 'typescript',
      workDir: '/tmp/leetcode',
      site: 'leetcode.com',
    })),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getSite: vi.fn(() => 'leetcode.com'),
  },
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setSite: vi.fn(),
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getProblemById: vi.fn().mockResolvedValue(mockProblem),
    getProblem: vi.fn().mockResolvedValue(mockProblem),
  },
}));

vi.mock('../../utils/fileUtils.js', () => ({
  findSolutionFile: vi.fn().mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts'),
  detectLanguageFromFile: vi.fn().mockReturnValue('typescript'),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

import { resetCommand } from '../../commands/reset.js';
import { leetcodeClient } from '../../api/client.js';
import { findSolutionFile, detectLanguageFromFile } from '../../utils/fileUtils.js';
import { writeFile } from 'fs/promises';

describe('resetCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblem);
    vi.mocked(leetcodeClient.getProblem).mockResolvedValue(mockProblem);
    vi.mocked(findSolutionFile).mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts');
    vi.mocked(detectLanguageFromFile).mockReturnValue('typescript');
  });

  it('overwrites an existing solution file with the original stub', async () => {
    const result = await resetCommand('1');

    expect(result).toBe(true);
    expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
    expect(findSolutionFile).toHaveBeenCalledWith('/tmp/leetcode', '1');
    expect(writeFile).toHaveBeenCalledWith(
      '/tmp/leetcode/Easy/Array/1.two-sum.ts',
      expect.stringContaining('function twoSum(nums: number[], target: number): number[]'),
      'utf-8'
    );
  });

  it('supports problem slugs', async () => {
    await resetCommand('two-sum');

    expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
    expect(writeFile).toHaveBeenCalled();
  });

  it('does not write when no existing solution file is found', async () => {
    vi.mocked(findSolutionFile).mockResolvedValueOnce(null);

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(outputContains('Run "leetcode pick 1" first')).toBe(true);
  });

  it('does not write when the existing file language is unsupported', async () => {
    vi.mocked(detectLanguageFromFile).mockReturnValueOnce(null);

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('does not write when no matching template is available', async () => {
    vi.mocked(detectLanguageFromFile).mockReturnValueOnce('python3');

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(outputContains('Available languages')).toBe(true);
  });
});
