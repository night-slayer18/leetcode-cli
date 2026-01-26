/**
 * useProblems Hook
 * Fetches and manages problem list data
 */
import { useState, useEffect, useCallback } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import type { Problem as APIProblem, ProblemListFilters } from '../../types.js';
import type { Problem } from '../components/ProblemTable.js';

interface UseProblemsOptions {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  status?: 'solved' | 'attempted' | 'todo';
  search?: string;
  limit?: number;
  skip?: number;
}

interface UseProblemsResult {
  problems: Problem[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Map API problem to TUI problem format
function mapProblem(apiProblem: APIProblem): Problem {
  return {
    id: apiProblem.questionFrontendId,
    title: apiProblem.title,
    titleSlug: apiProblem.titleSlug,
    difficulty: apiProblem.difficulty,
    status:
      apiProblem.status === 'ac' ? 'solved' : apiProblem.status === 'notac' ? 'attempted' : 'todo',
    acceptance: apiProblem.acRate,
    isPaidOnly: apiProblem.isPaidOnly,
  };
}

export function useProblems(options: UseProblemsOptions = {}): UseProblemsResult {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load credentials
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
      }

      // Build filters with proper types
      const filters: ProblemListFilters = {
        limit: options.limit || 50,
        skip: options.skip || 0,
      };

      if (options.difficulty) {
        filters.difficulty = options.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      }
      if (options.status) {
        const statusMap: Record<string, 'NOT_STARTED' | 'AC' | 'TRIED'> = {
          solved: 'AC',
          attempted: 'TRIED',
          todo: 'NOT_STARTED',
        };
        filters.status = statusMap[options.status];
      }
      if (options.search) {
        filters.searchKeywords = options.search;
      }

      const result = await leetcodeClient.getProblems(filters);

      setProblems(result.problems.map(mapProblem));
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch problems');
      // Use empty data as fallback
      setProblems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [options.difficulty, options.status, options.search, options.limit, options.skip]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return {
    problems,
    total,
    loading,
    error,
    refetch: fetchProblems,
  };
}
