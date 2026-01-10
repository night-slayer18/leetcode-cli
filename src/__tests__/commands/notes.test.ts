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
      status: 'ac',
      topicTags: [{ name: 'Array' }],
    }),
  },
}));

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
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

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

    it('should handle invalid problem ID', async () => {
      await notesCommand('invalid', 'view');

      expect(outputContains('Invalid problem ID')).toBe(true);
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
