/**
 * useBookmarks Hook
 * Fetches and manages real bookmarked problems
 */
import { useState, useEffect, useCallback } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { bookmarks as bookmarkStorage } from '../../storage/bookmarks.js';
import type { Problem } from '../components/ProblemTable.js';

interface UseBookmarksResult {
  bookmarks: Problem[];
  loading: boolean;
  error: string | null;
  addBookmark: (problemId: string) => boolean;
  removeBookmark: (problemId: string) => boolean;
  hasBookmark: (problemId: string) => boolean;
  clearAll: () => void;
  refetch: () => void;
}

export function useBookmarks(): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
      }

      // Get bookmark IDs from storage
      const bookmarkIds = bookmarkStorage.list();

      if (bookmarkIds.length === 0) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      // Fetch problem details for each bookmark
      const problems: Problem[] = [];

      for (const id of bookmarkIds) {
        try {
          const detail = await leetcodeClient.getProblemById(id);
          problems.push({
            id: detail.questionFrontendId,
            title: detail.title,
            titleSlug: detail.titleSlug,
            difficulty: detail.difficulty,
            status:
              detail.status === 'ac' ? 'solved' : detail.status === 'notac' ? 'attempted' : 'todo',
            acceptance: detail.acRate,
            isPaidOnly: detail.isPaidOnly,
          });
        } catch {
          // Skip problems that fail to load
        }
      }

      setBookmarks(problems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = useCallback(
    (problemId: string): boolean => {
      const success = bookmarkStorage.add(problemId);
      if (success) {
        fetchBookmarks(); // Refresh list
      }
      return success;
    },
    [fetchBookmarks]
  );

  const removeBookmark = useCallback(
    (problemId: string): boolean => {
      const success = bookmarkStorage.remove(problemId);
      if (success) {
        fetchBookmarks(); // Refresh list
      }
      return success;
    },
    [fetchBookmarks]
  );

  const hasBookmark = useCallback((problemId: string): boolean => {
    return bookmarkStorage.has(problemId);
  }, []);

  const clearAll = useCallback(() => {
    bookmarkStorage.clear();
    setBookmarks([]);
  }, []);

  return {
    bookmarks,
    loading,
    error,
    addBookmark,
    removeBookmark,
    hasBookmark,
    clearAll,
    refetch: fetchBookmarks,
  };
}
