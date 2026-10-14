// Notes and Bookmark commands tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({ language: 'typescript', workDir: '/tmp/leetcode' })),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getEditor: vi.fn(() => 'code'),
  },
}));

// Mock the bookmarks storage module
vi.mock('../../storage/bookmarks.js', () => ({
  bookmarks: {
    add: vi.fn().mockReturnValue(true),
    remove: vi.fn().mockReturnValue(true),
    list: vi.fn().mockReturnValue(['1', '2']),
    count: vi.fn().mockReturnValue(2),
    clear: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('../../api/client.js', () => {
  const problem = {
    questionId: '1',
    questionFrontendId: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    status: 'ac',
    topicTags: [{ name: 'Array' }],
  };

  return {
    leetcodeClient: {
      setCredentials: vi.fn(),
      checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
      getProblemById: vi.fn().mockResolvedValue(problem),
      getProblem: vi.fn().mockResolvedValue(problem),
    },
  };
});

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('# Notes for Two Sum\n\nThis is a test note.'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
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
  })),
}));

// Import after mocking
import { notesCommand } from '../../commands/notes.js';
import { bookmarkCommand } from '../../commands/bookmark.js';
import { bookmarks } from '../../storage/bookmarks.js';
import { leetcodeClient } from '../../api/client.js';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

describe('Notes and Bookmark Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notesCommand', () => {
    it('should view notes for a problem when file exists', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await notesCommand('1', 'view');

      expect(readFile).toHaveBeenCalled();
    });

    it('should edit notes for a problem', async () => {
      const { openInEditor } = await import('../../utils/editor.js');

      await notesCommand('1', 'edit');

      expect(openInEditor).toHaveBeenCalled();
    });

    it('should handle invalid problem ID or name', async () => {
      await notesCommand('Two Sum', 'view');

      expect(outputContains('Invalid problem ID or name')).toBe(true);
      expect(leetcodeClient.getProblem).not.toHaveBeenCalled();
    });

    it('should resolve a problem name to its note file', async () => {
      vi.mocked(existsSync).mockReturnValue(true);

      await notesCommand('two-sum', 'view');

      expect(leetcodeClient.getProblem).toHaveBeenCalledWith('two-sum');
      expect(readFile).toHaveBeenCalledWith(join('/tmp/leetcode', '.notes', '1.md'), 'utf-8');
    });

    it('should reuse the resolved problem for the note template', async () => {
      // Note file does not exist yet, but the notes directory does.
      vi.mocked(existsSync).mockImplementation((path) => !String(path).endsWith('1.md'));

      await notesCommand('two-sum', 'edit');

      expect(leetcodeClient.getProblem).toHaveBeenCalledTimes(1);
      expect(leetcodeClient.getProblemById).not.toHaveBeenCalled();
      expect(vi.mocked(writeFile).mock.calls[0][1]).toContain('# 1. Two Sum');
    });

    it('should report a problem name that does not exist', async () => {
      vi.mocked(leetcodeClient.getProblem).mockRejectedValueOnce(
        new Error('Invalid input: expected object, received null')
      );

      await notesCommand('not-a-real-problem', 'view');

      expect(readFile).not.toHaveBeenCalled();
      expect(outputContains('Check the problem name')).toBe(true);
    });

    it('should surface an unexpected lookup failure', async () => {
      vi.mocked(leetcodeClient.getProblem).mockRejectedValueOnce(new Error('connect ETIMEDOUT'));

      await notesCommand('two-sum', 'view');

      expect(readFile).not.toHaveBeenCalled();
      expect(outputContains('connect ETIMEDOUT')).toBe(true);
    });
  });

  describe('bookmarkCommand', () => {
    it('should add bookmark', async () => {
      await bookmarkCommand('add', '1');

      expect(bookmarks.add).toHaveBeenCalledWith('1');
    });

    it('should remove bookmark', async () => {
      await bookmarkCommand('remove', '1');

      expect(bookmarks.remove).toHaveBeenCalledWith('1');
    });

    it('should list bookmarks', async () => {
      await bookmarkCommand('list');

      expect(bookmarks.list).toHaveBeenCalled();
    });

    it('should clear bookmarks', async () => {
      await bookmarkCommand('clear');

      expect(bookmarks.clear).toHaveBeenCalled();
    });

    it('should handle invalid action', async () => {
      await bookmarkCommand('invalid');

      expect(outputContains('Invalid action')).toBe(true);
    });
  });
});
