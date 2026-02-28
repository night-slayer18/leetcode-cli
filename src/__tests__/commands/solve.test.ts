// Solve commands tests (pick, test, submit)
// Tests all input variations: problem ID, filename, full path
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
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

vi.mock('../../storage/timer.js', () => ({
  timerStorage: {
    getActiveTimer: vi.fn(() => null),
    stopTimer: vi.fn(() => null),
    recordSolveTime: vi.fn(),
  },
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getProblemById: vi.fn().mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      content: '<p>Given an array...</p>',
      topicTags: [{ name: 'Array' }],
      codeSnippets: [{ lang: 'TypeScript', langSlug: 'typescript', code: 'function twoSum() {}' }],
      exampleTestcases: '[2,7,11,15]\n9',
    }),
    getProblem: vi.fn().mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      exampleTestcases: '[2,7,11,15]\n9',
    }),
    testSolution: vi.fn().mockResolvedValue({
      status_code: 10,
      status_msg: 'Accepted',
    }),
    submitSolution: vi.fn().mockResolvedValue({
      status_code: 10,
      status_msg: 'Accepted',
    }),
  },
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('function twoSum() { return [0,1]; }'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

// Mock existsSync to always return true for test/submit paths
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('../../utils/fileUtils.js', () => ({
  findSolutionFile: vi.fn().mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts'),
  findFileByName: vi.fn().mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts'),
  getLangSlugFromExtension: vi.fn().mockReturnValue('typescript'),
}));

vi.mock('../../utils/display.js', () => ({
  displayTestResult: vi.fn(),
  displaySubmissionResult: vi.fn(),
}));

vi.mock('../../utils/editor.js', () => ({
  openInEditor: vi.fn().mockResolvedValue(undefined),
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

// Import after mocking
import { pickCommand, batchPickCommand } from '../../commands/pick.js';
import { testCommand } from '../../commands/test.js';
import { submitCommand } from '../../commands/submit.js';
import { leetcodeClient } from '../../api/client.js';
import { findSolutionFile, findFileByName, getLangSlugFromExtension } from '../../utils/fileUtils.js';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';

describe('Solve Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset existsSync to true by default for test/submit
    vi.mocked(existsSync).mockReturnValue(true);
  });

  describe('pickCommand', () => {
    describe('input variations', () => {
      it('should fetch problem by numeric ID', async () => {
        vi.mocked(existsSync).mockReturnValue(false); // File doesn't exist
        await pickCommand('1', { open: false });

        expect(leetcodeClient.getProblemById).toHaveBeenCalledWith('1');
      });

      it('should fetch problem by title slug', async () => {
        vi.mocked(existsSync).mockReturnValue(false);
        await pickCommand('two-sum', { open: false });

        expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
      });
    });

    describe('options', () => {
      it('should use specified language', async () => {
        vi.mocked(existsSync).mockReturnValue(false);
        await pickCommand('1', { lang: 'java', open: false });

        expect(leetcodeClient.getProblemById).toHaveBeenCalled();
      });

      it('should create .sql file when sql language is selected', async () => {
        vi.mocked(existsSync).mockReturnValue(false);
        vi.mocked(leetcodeClient.getProblemById).mockResolvedValueOnce({
          questionId: '175',
          questionFrontendId: '175',
          title: 'Combine Two Tables',
          titleSlug: 'combine-two-tables',
          difficulty: 'Easy',
          content: '<p>Write a solution...</p>',
          topicTags: [{ name: 'Database', slug: 'database' }],
          codeSnippets: [{ lang: 'MySQL', langSlug: 'mysql', code: 'SELECT * FROM Person;' }],
          exampleTestcases: '',
          sampleTestCase: '',
          hints: [],
          companyTags: [],
          stats: '{}',
          isPaidOnly: false,
          acRate: 0,
          status: null,
        });

        await pickCommand('175', { lang: 'sql', open: false });

        expect(writeFile).toHaveBeenCalled();
        const targetPath = String(vi.mocked(writeFile).mock.calls[0]?.[0] ?? '');
        expect(targetPath.endsWith('.sql')).toBe(true);
      });

      it('should handle existing file', async () => {
        vi.mocked(existsSync).mockReturnValue(true); // File already exists
        await pickCommand('1', { open: false });

        // Should warn about existing file but not fail
        expect(leetcodeClient.getProblemById).toHaveBeenCalled();
      });
    });

    describe('file creation', () => {
      it('should create solution file when file does not exist', async () => {
        vi.mocked(existsSync).mockReturnValue(false);
        await pickCommand('1', { open: false });

        expect(writeFile).toHaveBeenCalled();
      });
    });
  });

  describe('batchPickCommand', () => {
    it('should pick multiple problems', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      await batchPickCommand(['1', '2'], { open: false });

      expect(leetcodeClient.getProblemById).toHaveBeenCalledTimes(2);
    });
  });

  describe('testCommand', () => {
    describe('input variations', () => {
      it('should test by problem ID', async () => {
        await testCommand('1', {});

        expect(findSolutionFile).toHaveBeenCalled();
        expect(leetcodeClient.testSolution).toHaveBeenCalled();
      });

      it('should resolve sql language slug using problem snippets', async () => {
        vi.mocked(findSolutionFile).mockResolvedValueOnce(
          '/tmp/leetcode/Easy/Database/175.combine-two-tables.sql'
        );
        vi.mocked(leetcodeClient.getProblem).mockResolvedValueOnce({
          questionId: '175',
          questionFrontendId: '175',
          title: 'Combine Two Tables',
          titleSlug: 'combine-two-tables',
          difficulty: 'Easy',
          exampleTestcases: '',
          sampleTestCase: '',
          content: '<p>Write a solution...</p>',
          topicTags: [{ name: 'Database', slug: 'database' }],
          codeSnippets: [{ lang: 'MySQL', langSlug: 'mysql', code: 'SELECT 1;' }],
          hints: [],
          companyTags: [],
          stats: '{}',
          isPaidOnly: false,
          acRate: 0,
          status: null,
        });
        vi.mocked(getLangSlugFromExtension).mockReturnValueOnce('mysql');

        await testCommand('175', {});

        expect(getLangSlugFromExtension).toHaveBeenCalledWith(
          'sql',
          expect.arrayContaining([expect.objectContaining({ langSlug: 'mysql' })])
        );
        expect(leetcodeClient.testSolution).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'mysql',
          expect.any(String),
          expect.any(String)
        );
      });

      it('should test by filename', async () => {
        await testCommand('1.two-sum.ts', {});

        expect(findFileByName).toHaveBeenCalled();
        expect(leetcodeClient.testSolution).toHaveBeenCalled();
      });

      it('should test by full path', async () => {
        await testCommand('/tmp/leetcode/Easy/Array/1.two-sum.ts', {});

        // Full path skips file finding
        expect(leetcodeClient.testSolution).toHaveBeenCalled();
      });
    });

    describe('options', () => {
      it('should use custom testcase when provided', async () => {
        await testCommand('1', { testcase: '[1,2,3]\n6' });

        expect(leetcodeClient.testSolution).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          '[1,2,3]\n6',
          expect.anything()
        );
      });
    });

    describe('security', () => {
      it('should reject files outside workDir (path traversal)', async () => {
        // /etc/passwd is definitely outside /tmp/leetcode
        await testCommand('/etc/passwd', {});

        // Should NOT call testSolution because file is outside workDir
        expect(leetcodeClient.testSolution).not.toHaveBeenCalled();
      });

      it('should reject relative path traversal attempts', async () => {
        await testCommand('../../../etc/passwd', {});

        expect(leetcodeClient.testSolution).not.toHaveBeenCalled();
      });
    });
  });

  describe('submitCommand', () => {
    describe('input variations', () => {
      it('should submit by problem ID', async () => {
        await submitCommand('1');

        expect(findSolutionFile).toHaveBeenCalled();
        expect(leetcodeClient.submitSolution).toHaveBeenCalled();
      });

      it('should resolve sql language slug for submit flow', async () => {
        vi.mocked(findSolutionFile).mockResolvedValueOnce(
          '/tmp/leetcode/Easy/Database/175.combine-two-tables.sql'
        );
        vi.mocked(leetcodeClient.getProblem).mockResolvedValueOnce({
          questionId: '175',
          questionFrontendId: '175',
          title: 'Combine Two Tables',
          titleSlug: 'combine-two-tables',
          difficulty: 'Easy',
          exampleTestcases: '',
          sampleTestCase: '',
          content: '<p>Write a solution...</p>',
          topicTags: [{ name: 'Database', slug: 'database' }],
          codeSnippets: [{ lang: 'MySQL', langSlug: 'mysql', code: 'SELECT 1;' }],
          hints: [],
          companyTags: [],
          stats: '{}',
          isPaidOnly: false,
          acRate: 0,
          status: null,
        });
        vi.mocked(getLangSlugFromExtension).mockReturnValueOnce('mysql');

        await submitCommand('175');

        expect(getLangSlugFromExtension).toHaveBeenCalledWith(
          'sql',
          expect.arrayContaining([expect.objectContaining({ langSlug: 'mysql' })])
        );
        expect(leetcodeClient.submitSolution).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          'mysql',
          expect.any(String)
        );
      });

      it('should submit by filename', async () => {
        await submitCommand('1.two-sum.ts');

        expect(findFileByName).toHaveBeenCalled();
        expect(leetcodeClient.submitSolution).toHaveBeenCalled();
      });

      it('should submit by full path', async () => {
        await submitCommand('/tmp/leetcode/Easy/Array/1.two-sum.ts');

        expect(leetcodeClient.submitSolution).toHaveBeenCalled();
      });
    });

    describe('security', () => {
      it('should reject files outside workDir (path traversal)', async () => {
        // /etc/passwd is definitely outside /tmp/leetcode
        await submitCommand('/etc/passwd');

        // Should NOT call submitSolution because file is outside workDir
        expect(leetcodeClient.submitSolution).not.toHaveBeenCalled();
      });

      it('should reject relative path traversal attempts', async () => {
        await submitCommand('../../../etc/passwd');

        expect(leetcodeClient.submitSolution).not.toHaveBeenCalled();
      });
    });
  });
});
