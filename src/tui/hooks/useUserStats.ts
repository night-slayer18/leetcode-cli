/**
 * useUserStats Hook
 * Fetches user statistics and profile data
 */
import { useState, useEffect, useCallback } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';

interface UserStats {
  username: string;
  ranking: number;
  streak: number;
  totalActiveDays: number;
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
  totalSolved: number;
  isLoggedIn: boolean;
}

interface UseUserStatsResult {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const defaultStats: UserStats = {
  username: 'Guest',
  ranking: 0,
  streak: 0,
  totalActiveDays: 0,
  easy: { solved: 0, total: 600 },
  medium: { solved: 0, total: 1300 },
  hard: { solved: 0, total: 500 },
  totalSolved: 0,
  isLoggedIn: false,
};

export function useUserStats(): UseUserStatsResult {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load credentials
      const creds = credentials.get();
      if (!creds) {
        setStats({ ...defaultStats });
        setLoading(false);
        return;
      }

      leetcodeClient.setCredentials(creds);

      // Check authentication
      const auth = await leetcodeClient.checkAuth();
      if (!auth.isSignedIn || !auth.username) {
        setStats({ ...defaultStats });
        setLoading(false);
        return;
      }

      // Fetch user profile
      const profile = await leetcodeClient.getUserProfile(auth.username);

      // Parse solved counts by difficulty
      const solvedByDiff = profile.acSubmissionNum.reduce(
        (acc, item) => {
          if (item.difficulty === 'Easy') acc.easy = item.count;
          if (item.difficulty === 'Medium') acc.medium = item.count;
          if (item.difficulty === 'Hard') acc.hard = item.count;
          if (item.difficulty === 'All') acc.total = item.count;
          return acc;
        },
        { easy: 0, medium: 0, hard: 0, total: 0 }
      );

      setStats({
        username: auth.username,
        ranking: profile.ranking,
        streak: profile.streak,
        totalActiveDays: profile.totalActiveDays,
        easy: { solved: solvedByDiff.easy, total: 600 },
        medium: { solved: solvedByDiff.medium, total: 1300 },
        hard: { solved: solvedByDiff.hard, total: 500 },
        totalSolved: solvedByDiff.total,
        isLoggedIn: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setStats({ ...defaultStats });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
