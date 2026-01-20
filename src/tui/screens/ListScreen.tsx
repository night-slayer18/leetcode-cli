/**
 * List Screen - Revamped Design
 * Beautiful problem list with centered layout, search, and filters
 */
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DifficultyBadge, StatusBadge } from '../components/Badge.js';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import type { ProblemListFilters } from '../../types.js';
import { colors, icons, difficulty as difficultyColors } from '../theme.js';

export interface Problem {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'solved' | 'attempted' | 'todo';
  acceptance: number;
  isPaidOnly: boolean;
}

interface ListScreenProps {
  onSelectProblem: (problem: Problem) => void;
  onBack: () => void;
}

type DifficultyFilter = 'Easy' | 'Medium' | 'Hard' | null;
type StatusFilter = 'solved' | 'attempted' | 'todo' | null;

const PAGE_SIZE = 50;

export function ListScreen({ onSelectProblem, onBack }: ListScreenProps) {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  
  // Calculate responsive dimensions
  const contentWidth = Math.min(terminalWidth - 4, 100);
  const listHeight = Math.max(8, terminalHeight - 12); // Space for header, search, filters, footer
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  
  // Data state
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch problems with pagination
  const fetchProblems = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
      }

      const filters: ProblemListFilters = {
        limit: PAGE_SIZE,
        skip: pageNum * PAGE_SIZE,
      };

      if (difficultyFilter) {
        filters.difficulty = difficultyFilter.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      }
      if (statusFilter) {
        const statusMap: Record<string, 'NOT_STARTED' | 'AC' | 'TRIED'> = {
          solved: 'AC',
          attempted: 'TRIED',
          todo: 'NOT_STARTED',
        };
        filters.status = statusMap[statusFilter];
      }
      if (searchQuery) {
        filters.searchKeywords = searchQuery;
      }

      const result = await leetcodeClient.getProblems(filters);
      
      const mappedProblems: Problem[] = result.problems.map((p) => ({
        id: parseInt(p.questionFrontendId, 10),
        title: p.title,
        titleSlug: p.titleSlug,
        difficulty: p.difficulty,
        status: p.status === 'ac' ? 'solved' : p.status === 'notac' ? 'attempted' : 'todo',
        acceptance: p.acRate,
        isPaidOnly: p.isPaidOnly,
      }));

      if (append) {
        setProblems((prev) => [...prev, ...mappedProblems]);
      } else {
        setProblems(mappedProblems);
        setSelectedIndex(0);
        setScrollOffset(0);
      }
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch problems');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [difficultyFilter, statusFilter, searchQuery]);

  // Initial load and filter changes
  useEffect(() => {
    fetchProblems(0, false);
  }, [difficultyFilter, statusFilter, searchQuery, fetchProblems]);

  // Keep selected item visible
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + listHeight) {
      setScrollOffset(selectedIndex - listHeight + 1);
    }
  }, [selectedIndex, scrollOffset, listHeight]);

  // Visible items
  const visibleProblems = useMemo(() => {
    return problems.slice(scrollOffset, scrollOffset + listHeight);
  }, [problems, scrollOffset, listHeight]);

  const hasMore = problems.length < total;
  const maxScroll = Math.max(0, problems.length - listHeight);

  // Keyboard navigation
  useInput((input, key) => {
    // Search mode
    if (searchFocused) {
      if (key.escape) {
        setSearchFocused(false);
        setSearchBuffer('');
        return;
      }
      if (key.return) {
        setSearchQuery(searchBuffer);
        setSearchFocused(false);
        return;
      }
      if (key.backspace || key.delete) {
        setSearchBuffer((prev) => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setSearchBuffer((prev) => prev + input);
        return;
      }
      return;
    }

    // Normal mode
    if (key.escape) {
      onBack();
      return;
    }
    
    if (input === '/') {
      setSearchFocused(true);
      setSearchBuffer(searchQuery);
      return;
    }

    // Navigation
    if (key.downArrow || input === 'j') {
      const newIndex = Math.min(selectedIndex + 1, problems.length - 1);
      setSelectedIndex(newIndex);
      // Load more when near end
      if (newIndex >= problems.length - 5 && hasMore && !loadingMore) {
        fetchProblems(page + 1, true);
      }
      return;
    }
    if (key.upArrow || input === 'k') {
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
      return;
    }
    if (input === 'g') {
      setSelectedIndex(0);
      setScrollOffset(0);
      return;
    }
    if (input === 'G') {
      setSelectedIndex(problems.length - 1);
      setScrollOffset(maxScroll);
      return;
    }
    
    // Page navigation
    if (key.pageDown || input === 'd') {
      const newIndex = Math.min(selectedIndex + listHeight, problems.length - 1);
      setSelectedIndex(newIndex);
      return;
    }
    if (key.pageUp || input === 'u') {
      const newIndex = Math.max(selectedIndex - listHeight, 0);
      setSelectedIndex(newIndex);
      return;
    }

    // Select problem
    if (key.return) {
      const problem = problems[selectedIndex];
      if (problem) onSelectProblem(problem);
      return;
    }

    // Filters
    if (input === '1') {
      setDifficultyFilter((prev) => (prev === 'Easy' ? null : 'Easy'));
    }
    if (input === '2') {
      setDifficultyFilter((prev) => (prev === 'Medium' ? null : 'Medium'));
    }
    if (input === '3') {
      setDifficultyFilter((prev) => (prev === 'Hard' ? null : 'Hard'));
    }
    if (input === 's') {
      setStatusFilter((prev) => (prev === 'solved' ? null : 'solved'));
    }
    if (input === 'a') {
      setStatusFilter((prev) => (prev === 'attempted' ? null : 'attempted'));
    }
    if (input === 't') {
      setStatusFilter((prev) => (prev === 'todo' ? null : 'todo'));
    }
    if (input === 'R') {
      fetchProblems(0, false);
    }
    if (input === 'c') {
      setDifficultyFilter(null);
      setStatusFilter(null);
      setSearchQuery('');
    }
  });

  // Calculate column widths based on content width
  const cols = useMemo(() => {
    const fixed = { status: 3, id: 6, difficulty: 8, acceptance: 7 };
    const spacing = 12; // gaps between columns
    const titleWidth = Math.max(25, contentWidth - Object.values(fixed).reduce((a, b) => a + b, 0) - spacing);
    return { ...fixed, title: titleWidth };
  }, [contentWidth]);

  // Render loading state
  if (loading && problems.length === 0) {
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
        <Box gap={1}>
          <Text color={colors.primary}><Spinner type="dots" /></Text>
          <Text color={colors.text}>Loading problems from LeetCode...</Text>
        </Box>
      </Box>
    );
  }

  // Render error state
  if (error && problems.length === 0) {
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" gap={1}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>
          Press <Text color={colors.primary}>[R]</Text> to retry or <Text color={colors.primary}>[Esc]</Text> to go back
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" paddingY={1}>
      {/* Header */}
      <Box width={contentWidth} marginBottom={1}>
        <Box flexGrow={1}>
          <Text color={colors.primary} bold>{icons.folder} LeetCode Problems</Text>
          <Text color={colors.textMuted}> — </Text>
          <Text color={colors.text}>{problems.length}</Text>
          <Text color={colors.textMuted}>/{total} loaded</Text>
        </Box>
        {loadingMore && (
          <Box gap={1}>
            <Text color={colors.primary}><Spinner type="dots" /></Text>
          </Box>
        )}
      </Box>

      {/* Search Bar */}
      <Box width={contentWidth} marginBottom={1}>
        <Box 
          borderStyle="round" 
          borderColor={searchFocused ? colors.primary : colors.textMuted}
          paddingX={1}
          flexGrow={1}
        >
          <Text color={colors.primary}>🔍 </Text>
          {searchFocused ? (
            <Text color={colors.text}>
              {searchBuffer}
              <Text color={colors.primary}>▋</Text>
            </Text>
          ) : (
            <Text color={searchQuery ? colors.text : colors.textMuted}>
              {searchQuery || 'Press / to search...'}
            </Text>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Box width={contentWidth} marginBottom={1} gap={2}>
        <Box gap={1}>
          <Text color={colors.textMuted}>Diff:</Text>
          <Text color={difficultyFilter === 'Easy' ? difficultyColors.easy : colors.textMuted} inverse={difficultyFilter === 'Easy'}> 1:E </Text>
          <Text color={difficultyFilter === 'Medium' ? difficultyColors.medium : colors.textMuted} inverse={difficultyFilter === 'Medium'}> 2:M </Text>
          <Text color={difficultyFilter === 'Hard' ? difficultyColors.hard : colors.textMuted} inverse={difficultyFilter === 'Hard'}> 3:H </Text>
        </Box>
        <Box gap={1}>
          <Text color={colors.textMuted}>Status:</Text>
          <Text color={statusFilter === 'solved' ? colors.success : colors.textMuted} inverse={statusFilter === 'solved'}> s:✓ </Text>
          <Text color={statusFilter === 'attempted' ? colors.warning : colors.textMuted} inverse={statusFilter === 'attempted'}> a:○ </Text>
          <Text color={statusFilter === 'todo' ? colors.textMuted : colors.textMuted} inverse={statusFilter === 'todo'}> t:· </Text>
        </Box>
        {(difficultyFilter || statusFilter || searchQuery) && (
          <Text color={colors.cyan}>[c] clear</Text>
        )}
      </Box>

      {/* Table Header */}
      <Box width={contentWidth} paddingX={1}>
        <Text color={colors.textMuted}>
          {'  '}
          <Text>{'#'.padEnd(cols.id)}</Text>
          {'  '}
          <Text>{'Title'.padEnd(cols.title)}</Text>
          {'  '}
          <Text>{'Diff'.padEnd(cols.difficulty)}</Text>
          {' '}
          <Text>{'Acc%'.padEnd(cols.acceptance)}</Text>
        </Text>
      </Box>
      
      {/* Divider */}
      <Box width={contentWidth}>
        <Text color={colors.textMuted}>{'─'.repeat(contentWidth)}</Text>
      </Box>

      {/* Problem List */}
      <Box flexDirection="column" width={contentWidth} height={listHeight}>
        {problems.length === 0 ? (
          <Box paddingY={2} justifyContent="center">
            <Text color={colors.textMuted}>No problems found. Try adjusting filters.</Text>
          </Box>
        ) : (
          visibleProblems.map((problem, idx) => {
            const actualIndex = scrollOffset + idx;
            const isSelected = actualIndex === selectedIndex;
            
            return (
              <Box key={problem.id} paddingX={1}>
                <Text
                  color={isSelected ? colors.textBright : colors.text}
                  inverse={isSelected}
                  bold={isSelected}
                >
                  {/* Selection indicator */}
                  {isSelected ? icons.arrow : ' '}{' '}
                  
                  {/* Status icon */}
                  <Text color={
                    problem.status === 'solved' ? colors.success :
                    problem.status === 'attempted' ? colors.warning : colors.textMuted
                  }>
                    {problem.status === 'solved' ? icons.check : problem.status === 'attempted' ? '○' : '·'}
                  </Text>
                  {' '}
                  
                  {/* ID */}
                  <Text color={isSelected ? colors.textBright : colors.textMuted}>
                    {String(problem.id).padEnd(cols.id - 1)}
                  </Text>
                  {' '}
                  
                  {/* Title */}
                  <Text color={isSelected ? colors.textBright : colors.text}>
                    {problem.title.length > cols.title - 1 
                      ? problem.title.slice(0, cols.title - 4) + '...'
                      : problem.title.padEnd(cols.title - 1)}
                  </Text>
                  {' '}
                  
                  {/* Difficulty */}
                  <Text color={
                    problem.difficulty === 'Easy' ? difficultyColors.easy :
                    problem.difficulty === 'Medium' ? difficultyColors.medium : difficultyColors.hard
                  }>
                    {problem.difficulty.slice(0, 6).padEnd(cols.difficulty)}
                  </Text>
                  
                  {/* Acceptance */}
                  <Text color={colors.textMuted}>
                    {problem.acceptance.toFixed(0).padStart(3)}%
                  </Text>
                  
                  {/* Premium indicator */}
                  {problem.isPaidOnly && <Text color={colors.warning}> {icons.star}</Text>}
                </Text>
              </Box>
            );
          })
        )}
      </Box>

      {/* Scroll position indicator */}
      <Box width={contentWidth} marginTop={1}>
        <Text color={colors.textMuted}>
          {scrollOffset > 0 && <Text color={colors.cyan}>{icons.arrowUp} </Text>}
          <Text color={colors.text}>{selectedIndex + 1}</Text>
          <Text color={colors.textMuted}>/{problems.length}</Text>
          {hasMore && <Text color={colors.cyan}> (+{total - problems.length} more)</Text>}
          {scrollOffset < maxScroll && problems.length > listHeight && <Text color={colors.cyan}> {icons.arrowDown}</Text>}
        </Text>
      </Box>

      {/* Help footer */}
      <Box width={contentWidth} marginTop={1}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>j/k</Text> nav{' '}
          <Text color={colors.primary}>Enter</Text> view{' '}
          <Text color={colors.primary}>g/G</Text> top/end{' '}
          <Text color={colors.primary}>/</Text> search{' '}
          <Text color={colors.primary}>R</Text> refresh{' '}
          <Text color={colors.primary}>Esc</Text> back
        </Text>
      </Box>
    </Box>
  );
}
