/**
 * useDailyChallenge Hook
 * Fetches today's daily challenge
 */
import { useState, useEffect, useCallback } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';

interface DailyChallenge {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  date: string;
  status: 'solved' | 'attempted' | 'todo';
}

interface UseDailyResult {
  daily: DailyChallenge | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDailyChallenge(): UseDailyResult {
  const [daily, setDaily] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load credentials
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
      }

      const result = await leetcodeClient.getDailyChallenge();

      // Map status from API (ac/notac/null) to our format
      const apiStatus = result.question.status;
      let status: 'solved' | 'attempted' | 'todo' = 'todo';
      if (apiStatus === 'ac') status = 'solved';
      else if (apiStatus === 'notac') status = 'attempted';

      setDaily({
        id: parseInt(result.question.questionFrontendId, 10),
        title: result.question.title,
        titleSlug: result.question.titleSlug,
        difficulty: result.question.difficulty,
        date: result.date,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily challenge');
      setDaily(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  return {
    daily,
    loading,
    error,
    refetch: fetchDaily,
  };
}
