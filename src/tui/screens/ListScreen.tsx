/**
 * List Screen - Clean, Professional Design
 * Problem list with search, filters, and proper item rendering
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import type { ProblemListFilters } from '../../types.js';
import { colors } from '../theme.js';
import { FilterPill } from '../components/FilterPill.js';

export interface Problem {
  id: string;
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

const PAGE_SIZE = 50;

const ProblemRow = React.memo(function ProblemRow({ 
  problem, 
  isSelected,
}: { 
  problem: Problem; 
  isSelected: boolean;
}) {
  const statusIcon = problem.status === 'solved' ? '✓' : problem.status === 'attempted' ? '○' : ' ';
  const statusColor = problem.status === 'solved' ? colors.success : problem.status === 'attempted' ? colors.warning : colors.textMuted;
  const diffColor = problem.difficulty === 'Easy' ? colors.success : problem.difficulty === 'Medium' ? colors.warning : colors.error;
  
  const selector = isSelected ? '▶' : ' ';

  const id = problem.id.padEnd(6, ' ');
  const diff = problem.difficulty.padEnd(8, ' ');
  const acc = `${Math.round(problem.acceptance)}%`.padStart(6, ' ');
  const premium = problem.isPaidOnly ? '💎' : ' ';
  const paidPadded = premium.padEnd(4, ' ');

  return (
    <Box paddingX={1} marginBottom={0} width="100%" flexShrink={0}>
       <Box 
          flexDirection="row" 
          alignItems="flex-start" 
          width="100%"
          minHeight={1}
          paddingY={0}
          backgroundColor={isSelected ? colors.bgHighlight : undefined}
       >
        {/* Selector & Status */}
        <Box width={6} flexShrink={0}>
          <Text color={isSelected ? colors.primary : colors.textMuted}>{selector} </Text>
          <Text color={statusColor}>{statusIcon}</Text>
        </Box>

        {/* ID */}
        <Box width={6} flexShrink={0}>
          <Text color={colors.textMuted}>{id}</Text>
        </Box>

        {/* Title: Flexible, takes remaining space */}
        <Box flexGrow={1} minWidth={0}>
          <Text color={isSelected ? colors.textBright : colors.text} wrap="truncate-end">
            {problem.title}
          </Text>
        </Box>

        {/* Difficulty */}
        <Box width={8} flexShrink={0}>
          <Text color={diffColor}>{diff}</Text>
        </Box>

        {/* Acceptance */}
        <Box width={6} flexShrink={0} justifyContent="flex-end">
          <Text color={colors.textMuted}>{acc}</Text>
        </Box>

        {/* Premium */}
        <Box width={4} flexShrink={0} marginLeft={1}>
          <Text>{paidPadded}</Text>
        </Box>
      </Box>
    </Box>
  );
}, (prev, next) => {
  return prev.problem === next.problem && prev.isSelected === next.isSelected;
});

export function ListScreen({ onSelectProblem, onBack }: ListScreenProps) {
  // Use stable height to prevent blinking on resize/scroll
  // const { stdout } = useStdout(); // Causing instability?
  const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 24);

  useEffect(() => {
    const onResize = () => setTerminalHeight(process.stdout.rows || 24);
    process.stdout.on('resize', onResize);
    return () => { process.stdout.off('resize', onResize); };
  }, []);

  const listHeight = Math.max(5, terminalHeight - 15);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState('');
  
  const [diffFilter, setDiffFilter] = useState<'Easy' | 'Medium' | 'Hard' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'solved' | 'attempted' | 'todo' | null>(null);

  const fetchProblems = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const creds = credentials.get();
      if (creds) leetcodeClient.setCredentials(creds);

      const filters: ProblemListFilters = {
        limit: PAGE_SIZE,
        skip: pageNum * PAGE_SIZE,
      };

      if (diffFilter) filters.difficulty = diffFilter.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      if (statusFilter) {
        const map: Record<string, 'NOT_STARTED' | 'AC' | 'TRIED'> = { solved: 'AC', attempted: 'TRIED', todo: 'NOT_STARTED' };
        filters.status = map[statusFilter];
      }
      if (searchQuery) filters.searchKeywords = searchQuery;

      const result = await leetcodeClient.getProblems(filters);
      
      const mapped: Problem[] = result.problems.map((p) => ({
        id: p.questionFrontendId,
        title: p.title,
        titleSlug: p.titleSlug,
        difficulty: p.difficulty,
        status: (p.status === 'ac' ? 'solved' : p.status === 'notac' ? 'attempted' : 'todo') as Problem['status'],
        acceptance: p.acRate,
        isPaidOnly: p.isPaidOnly,
      }));

      if (append) {
        setProblems(prev => [...prev, ...mapped]);
      } else {
        setProblems(mapped);
        setSelectedIndex(0);
        setScrollOffset(0);
      }
      setTotal(result.total);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [diffFilter, statusFilter, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchProblems(0, false);
  }, [diffFilter, statusFilter, searchQuery, fetchProblems]);

  // Keep selection visible
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

  // Input handling
  useInput((input, key) => {
    if (searchMode) {
      if (key.escape) { setSearchMode(false); setSearchBuffer(''); return; }
      if (key.return) { setSearchQuery(searchBuffer); setSearchMode(false); return; }
      if (key.backspace || key.delete) { setSearchBuffer(b => b.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta) { setSearchBuffer(b => b + input); }
      return;
    }

    if (key.escape) { onBack(); return; }
    if (input === '/') { setSearchMode(true); setSearchBuffer(searchQuery); return; }

    // Navigation
    if (key.downArrow || input === 'j') {
      const next = Math.min(selectedIndex + 1, problems.length - 1);
      setSelectedIndex(next);
      if (next >= problems.length - 5 && hasMore && !loadingMore) fetchProblems(page + 1, true);
      return;
    }
    if (key.upArrow || input === 'k') { setSelectedIndex(Math.max(selectedIndex - 1, 0)); return; }
    if (input === 'g') { setSelectedIndex(0); setScrollOffset(0); return; }
    if (input === 'G') { setSelectedIndex(problems.length - 1); return; }

    // Select
    if (key.return) {
      const p = problems[selectedIndex];
      if (p) onSelectProblem(p);
      return;
    }

    // Filters
    if (input === '1') { setDiffFilter(f => f === 'Easy' ? null : 'Easy'); return; }
    if (input === '2') { setDiffFilter(f => f === 'Medium' ? null : 'Medium'); return; }
    if (input === '3') { setDiffFilter(f => f === 'Hard' ? null : 'Hard'); return; }
    if (input === 's') { setStatusFilter(f => f === 'solved' ? null : 'solved'); return; }
    if (input === 'a') { setStatusFilter(f => f === 'attempted' ? null : 'attempted'); return; }
    if (input === 'c') { setDiffFilter(null); setStatusFilter(null); setSearchQuery(''); return; }
    if (input === 'R') { fetchProblems(0, false); return; }
  });

  // Loading/Error states
  if (loading && problems.length === 0) return <Box padding={2}><Text color={colors.primary}><Spinner type="dots"/> Loading...</Text></Box>;
  if (error && problems.length === 0) return <Box padding={2}><Text color={colors.error}>✗ {error}</Text></Box>;

  return (
    <Box flexDirection="column" paddingX={1} width="100%">
      {/* Header & Search Sections */}
      <Box marginBottom={1} justifyContent="space-between">
        <Box>
           <Text color={colors.primary} bold>Problems </Text>
           <Text color={colors.textMuted}>({problems.length}/{total})</Text>
           {loadingMore && <Text color={colors.primary}> <Spinner type="dots" /></Text>}
        </Box>
        <Box>
          <Text color={colors.textMuted}>[/] Search: </Text>
          {searchMode ? (
            <Text inverse>{searchBuffer || ' '}<Text color={colors.primary}>▌</Text></Text>
          ) : (
            <Text color={searchQuery ? colors.textBright : colors.textMuted} underline={!!searchQuery}>
              {searchQuery || 'Type / to search'}
            </Text>
          )}
        </Box>
      </Box>
      
      {/* Filters */}
      <Box gap={1} marginBottom={1}>
        <Text color={colors.textMuted} dimColor>Filters:</Text>
        <FilterPill label="1:Easy" active={diffFilter === 'Easy'} color={colors.success} />
        <FilterPill label="2:Med" active={diffFilter === 'Medium'} color={colors.warning} />
        <FilterPill label="3:Hard" active={diffFilter === 'Hard'} color={colors.error} />
        <Text color={colors.textMuted} dimColor>│</Text>
        <FilterPill label="s:Solved" active={statusFilter === 'solved'} color={colors.success} />
        <FilterPill label="a:Tried" active={statusFilter === 'attempted'} color={colors.warning} />
        {(diffFilter || statusFilter || searchQuery) && (
          <Text color={colors.cyan}> [c] Clear</Text>
        )}
      </Box>

      {/* Table Header - Using Flexbox Grid */}
      <Box 
        borderStyle="single" 
        borderBottom={true} 
        borderTop={false} 
        borderLeft={false} 
        borderRight={false} 
        borderColor={colors.textMuted} 
        paddingX={1}
        width="100%"
        flexShrink={0}
      >
        <Box width={6} flexShrink={0}><Text color={colors.textMuted} bold>Stat</Text></Box>
        <Box width={6} flexShrink={0}><Text color={colors.textMuted} bold>ID</Text></Box>
        <Box flexGrow={1} minWidth={0}><Text color={colors.textMuted} bold>Title</Text></Box>
        <Box width={8} flexShrink={0}><Text color={colors.textMuted} bold>Diff</Text></Box>
        <Box width={6} flexShrink={0} justifyContent="flex-end"><Text color={colors.textMuted} bold>Acc</Text></Box>
        <Box width={4} flexShrink={0} marginLeft={1}><Text color={colors.textMuted} bold>Paid</Text></Box>
      </Box>

      {/* Problem List */}
      <Box flexDirection="column" flexGrow={1}>
        {problems.length === 0 ? (
          <Box marginTop={1} marginLeft={2}>
            <Text color={colors.textMuted}>No matching problems found.</Text>
          </Box>
        ) : (
          visibleProblems.map((problem) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              isSelected={problem.id === problems[selectedIndex]?.id}
            />
          ))
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderStyle="single" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} borderColor={colors.textMuted}>
        <Box justifyContent="space-between" width="100%">
          <Text color={colors.textMuted}>
            {selectedIndex + 1} of {problems.length}
            {hasMore ? ` (+${total - problems.length} more)` : ''}
          </Text>
          <Text color={colors.textMuted}>
            <Text color={colors.primary}>[j/k]</Text> Nav 
            <Text color={colors.primary}> [↵]</Text> Open 
            <Text color={colors.primary}> [Esc]</Text> Back
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
