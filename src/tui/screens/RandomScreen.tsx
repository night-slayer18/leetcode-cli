/**
 * Random Screen
 * Get a random problem with difficulty and tag filters
 * Matches CLI `random` command functionality
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useCallback } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { Panel } from '../components/Panel.js';
import { FilterPill } from '../components/FilterPill.js';
import { colors, icons, difficulty as difficultyColors } from '../theme.js';
import type { ProblemListFilters } from '../../types.js';

interface RandomScreenProps {
  onPick: (problemId: number, titleSlug: string) => void;
  onViewProblem: (problem: { id: number; title: string; titleSlug: string; difficulty: 'Easy' | 'Medium' | 'Hard'; status: 'solved' | 'attempted' | 'todo'; acceptance: number; isPaidOnly: boolean }) => void;
  onBack: () => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard' | null;

// Common tags for filtering
const POPULAR_TAGS = ['array', 'string', 'hash-table', 'dynamic-programming', 'math', 'sorting', 'greedy', 'tree', 'graph', 'binary-search'];

export function RandomScreen({ onPick, onViewProblem, onBack }: RandomScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagPage, setTagPage] = useState(0);
  const [foundProblem, setFoundProblem] = useState<{ id: number; title: string; slug: string; difficulty: string } | null>(null);

  const getRandomProblem = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFoundProblem(null);

    try {
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
      }

      const filters: ProblemListFilters = {};
      if (selectedDifficulty) {
        filters.difficulty = selectedDifficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      }
      if (selectedTag) {
        filters.tags = [selectedTag];
      }

      const slug = await leetcodeClient.getRandomProblem(filters);
      
      // Fetch problem details to show preview
      const problem = await leetcodeClient.getProblem(slug);
      if (problem) {
        setFoundProblem({
          id: parseInt(problem.questionFrontendId, 10),
          title: problem.title,
          slug: problem.titleSlug,
          difficulty: problem.difficulty,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get random problem');
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, selectedTag]);

  const handlePickProblem = useCallback(() => {
    if (foundProblem) {
      onPick(foundProblem.id, foundProblem.slug);
    }
  }, [foundProblem, onPick]);

  const handleViewProblem = useCallback(() => {
    if (foundProblem) {
      onViewProblem({
        id: foundProblem.id,
        title: foundProblem.title,
        titleSlug: foundProblem.slug,
        difficulty: foundProblem.difficulty as 'Easy' | 'Medium' | 'Hard',
        status: 'todo',
        acceptance: 0,
        isPaidOnly: false,
      });
    }
  }, [foundProblem, onViewProblem]);

  useInput((input, key) => {
    if (key.escape) {
      if (foundProblem) {
        setFoundProblem(null);
      } else {
        onBack();
      }
      return;
    }
    
    // Difficulty filters
    if (input === '1') setSelectedDifficulty(prev => prev === 'Easy' ? null : 'Easy');
    if (input === '2') setSelectedDifficulty(prev => prev === 'Medium' ? null : 'Medium');
    if (input === '3') setSelectedDifficulty(prev => prev === 'Hard' ? null : 'Hard');
    
    // Tag navigation
    if (input === 't') setTagPage(prev => (prev + 1) % 2);
    if (input === 'c') { setSelectedTag(null); setSelectedDifficulty(null); }
    
    // Tag selection (4-9 for visible tags)
    const visibleTags = POPULAR_TAGS.slice(tagPage * 5, tagPage * 5 + 5);
    const tagNum = parseInt(input, 10);
    if (tagNum >= 4 && tagNum <= 8) {
      const tagIndex = tagNum - 4;
      if (visibleTags[tagIndex]) {
        setSelectedTag(prev => prev === visibleTags[tagIndex] ? null : visibleTags[tagIndex]);
      }
    }
    
    // Actions
    if (input === 'r' || (key.return && !foundProblem)) {
      getRandomProblem();
    }
    if (foundProblem) {
      if (input === 'p') handlePickProblem();
      if (input === 'v' || key.return) handleViewProblem();
      if (input === 'n') { setFoundProblem(null); getRandomProblem(); }
    }
  });

  const difficultyFilters = [
    { key: 'Easy', label: 'Easy [1]', color: difficultyColors.easy },
    { key: 'Medium', label: 'Medium [2]', color: difficultyColors.medium },
    { key: 'Hard', label: 'Hard [3]', color: difficultyColors.hard },
  ];

  const visibleTags = POPULAR_TAGS.slice(tagPage * 5, tagPage * 5 + 5);

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text color={colors.primary} bold>
          {icons.target} Random Problem
        </Text>
      </Box>

      {/* Difficulty Filter */}
      <Panel title="Difficulty">
        <Box gap={1} paddingX={1}>
          <FilterPill label="Any" active={selectedDifficulty === null} />
          {difficultyFilters.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={selectedDifficulty === f.key}
              color={f.color}
            />
          ))}
        </Box>
      </Panel>

      {/* Tag Filter */}
      <Box marginTop={1}>
        <Panel title={`Tags [t=more] (page ${tagPage + 1}/2)`}>
          <Box gap={1} paddingX={1} flexWrap="wrap">
            <FilterPill label="Any" active={selectedTag === null} />
            {visibleTags.map((tag, i) => (
              <FilterPill
                key={tag}
                label={`${tag} [${i + 4}]`}
                active={selectedTag === tag}
                color={colors.cyan}
              />
            ))}
          </Box>
        </Panel>
      </Box>

      {/* Result or Action */}
      <Box marginTop={2}>
        {loading ? (
          <Box gap={1}>
            <Text color={colors.primary}><Spinner type="dots" /></Text>
            <Text color={colors.textMuted}>Finding a random problem...</Text>
          </Box>
        ) : error ? (
          <Text color={colors.error}>{icons.cross} {error}</Text>
        ) : foundProblem ? (
          <Panel title="Found Problem" highlight>
            <Box flexDirection="column" gap={1}>
              <Box gap={2}>
                <Text color={colors.textMuted}>#{foundProblem.id}</Text>
                <Text color={colors.textBright} bold>{foundProblem.title}</Text>
                <Text color={foundProblem.difficulty === 'Easy' ? colors.success : foundProblem.difficulty === 'Medium' ? colors.warning : colors.error}>
                  [{foundProblem.difficulty}]
                </Text>
              </Box>
              <Box gap={2} marginTop={1}>
                <Text color={colors.success}>[p] Pick & Open</Text>
                <Text color={colors.primary}>[v/Enter] View Details</Text>
                <Text color={colors.cyan}>[n] Next Random</Text>
              </Box>
            </Box>
          </Panel>
        ) : (
          <Box borderStyle="round" borderColor={colors.success} paddingX={3} paddingY={1}>
            <Text color={colors.success} bold>
              {icons.target} [Enter/r] Get Random Problem
            </Text>
          </Box>
        )}
      </Box>

      {/* Active Filters */}
      {(selectedDifficulty || selectedTag) && (
        <Box marginTop={1}>
          <Text color={colors.textMuted}>
            Active: 
            {selectedDifficulty && <Text color={colors.primary}> {selectedDifficulty}</Text>}
            {selectedTag && <Text color={colors.cyan}> #{selectedTag}</Text>}
            <Text color={colors.textDim}> [c] clear</Text>
          </Text>
        </Box>
      )}

      {/* Hints */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>[1/2/3]</Text> Difficulty{' '}
          <Text color={colors.primary}>[4-8]</Text> Tags{' '}
          <Text color={colors.primary}>[t]</Text> More tags{' '}
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
