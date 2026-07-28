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

vi.mock('../../storage/snapshots.js', () => ({
  snapshotStorage: {
    save: vi.fn(() => ({
      id: 1,
      name: 'backup-before-reset-123',
      fileName: '1_backup-before-reset-123.ts',
      language: 'typescript',
      lines: 3,
      createdAt: '2026-07-28T00:00:00.000Z',
    })),
  },
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('existing solution'),
  realpath: vi.fn(async (path: string) => path),
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
import { snapshotStorage } from '../../storage/snapshots.js';
import { readFile, realpath, writeFile } from 'fs/promises';
import ora from 'ora';

function latestSpinner(): { fail: ReturnType<typeof vi.fn> } {
  const result = vi.mocked(ora).mock.results.at(-1);
  return result?.value as { fail: ReturnType<typeof vi.fn> };
}

describe('resetCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(leetcodeClient.getProblemById).mockResolvedValue(mockProblem);
    vi.mocked(leetcodeClient.getProblem).mockResolvedValue(mockProblem);
    vi.mocked(findSolutionFile).mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts');
    vi.mocked(detectLanguageFromFile).mockReturnValue('typescript');
    vi.mocked(readFile).mockResolvedValue('existing solution');
    vi.mocked(realpath).mockImplementation(async (path) => String(path));
    vi.mocked(snapshotStorage.save).mockReturnValue({
      id: 1,
      name: 'backup-before-reset-123',
      fileName: '1_backup-before-reset-123.ts',
      language: 'typescript',
      lines: 3,
      createdAt: '2026-07-28T00:00:00.000Z',
    });
  });

  it('overwrites an existing solution file with the original stub', async () => {
    const result = await resetCommand('1');

    expect(result).toBe(true);
    expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
    expect(findSolutionFile).toHaveBeenCalledWith('/tmp/leetcode', '1');
    expect(snapshotStorage.save).toHaveBeenCalledWith(
      '1',
      'Two Sum',
      'existing solution',
      'typescript',
      expect.stringMatching(/^backup-before-reset-\d+$/)
    );
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

  it('does not write when the resolved file target is outside the workspace', async () => {
    vi.mocked(realpath).mockImplementation(async (path) => {
      if (path === '/tmp/leetcode/Easy/Array/1.two-sum.ts') {
        return '/tmp/outside/1.two-sum.ts';
      }
      return String(path);
    });

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(readFile).not.toHaveBeenCalled();
    expect(snapshotStorage.save).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(latestSpinner().fail).toHaveBeenCalledWith(
      'Security Error: File path is outside the configured workspace'
    );
  });

  it('does not write when the existing file language is unsupported', async () => {
    vi.mocked(detectLanguageFromFile).mockReturnValueOnce(null);

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(latestSpinner().fail).toHaveBeenCalledWith('Unsupported file extension: .ts');
  });

  it('does not write when no matching template is available', async () => {
    vi.mocked(detectLanguageFromFile).mockReturnValueOnce('python3');

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(outputContains('Available languages')).toBe(true);
  });

  it('does not overwrite when backup creation fails', async () => {
    vi.mocked(snapshotStorage.save).mockReturnValueOnce({ error: 'Snapshot failed' });

    const result = await resetCommand('1');

    expect(result).toBe(false);
    expect(writeFile).not.toHaveBeenCalled();
    expect(outputContains('Snapshot failed')).toBe(true);
  });

  it('prints a friendly message when the problem is not found', async () => {
    vi.mocked(leetcodeClient.getProblemById).mockRejectedValueOnce(
      new Error('expected object, received null')
    );

    const result = await resetCommand('9999');

    expect(result).toBe(false);
    expect(latestSpinner().fail).toHaveBeenCalledWith('Problem "9999" not found');
  });
});
