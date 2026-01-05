// Bookmark storage using Conf package
import Conf from 'conf';

interface BookmarksSchema {
  bookmarks: string[];
}

const bookmarksStore = new Conf<BookmarksSchema>({
  projectName: 'leetcode-cli-bookmarks',
  defaults: { bookmarks: [] },
});

export const bookmarks = {
  add(problemId: string): boolean {
    const current = bookmarksStore.get('bookmarks');
    if (current.includes(problemId)) {
      return false;
    }
    bookmarksStore.set('bookmarks', [...current, problemId]);
    return true;
  },

  remove(problemId: string): boolean {
    const current = bookmarksStore.get('bookmarks');
    if (!current.includes(problemId)) {
      return false;
    }
    bookmarksStore.set('bookmarks', current.filter(id => id !== problemId));
    return true;
  },

  list(): string[] {
    return bookmarksStore.get('bookmarks');
  },

  has(problemId: string): boolean {
    return bookmarksStore.get('bookmarks').includes(problemId);
  },

  count(): number {
    return bookmarksStore.get('bookmarks').length;
  },

  clear(): void {
    bookmarksStore.set('bookmarks', []);
  },
};
