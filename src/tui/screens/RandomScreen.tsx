/**
 * Random Screen
 * Get a random problem with optional filters
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useCallback } from 'react';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { Panel } from '../components/Panel.js';
import { FilterPill } from '../components/FilterPill.js';
import { colors, icons, difficulty as difficultyColors } from '../theme.js';

interface RandomScreenProps {
  onPick: (problemId: number, titleSlug: string) => void;
  onBack: () => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard' | null;

export function RandomScreen({ onPick, onBack }: RandomScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(null);
  const [result, setResult] = useState<{ id: number; slug: string } | null>(null);

  const getRandomProblem = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
      }

      const filters: { difficulty?: 'EASY' | 'MEDIUM' | 'HARD' } = {};
      if (selectedDifficulty) {
        filters.difficulty = selectedDifficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      }

      const slug = await leetcodeClient.getRandomProblem(filters);
      
      // Extract ID from slug (this is a simplification - would need API call for full ID)
      setResult({ id: 0, slug });
      onPick(0, slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get random problem');
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, onPick]);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
    if (input === '1') {
      setSelectedDifficulty((prev) => (prev === 'Easy' ? null : 'Easy'));
    }
    if (input === '2') {
      setSelectedDifficulty((prev) => (prev === 'Medium' ? null : 'Medium'));
    }
    if (input === '3') {
      setSelectedDifficulty((prev) => (prev === 'Hard' ? null : 'Hard'));
    }
    if (input === 'r' || key.return) {
      getRandomProblem();
    }
  });

  const difficultyFilters = [
    { key: 'Easy', label: 'Easy [1]', color: difficultyColors.easy },
    { key: 'Medium', label: 'Medium [2]', color: difficultyColors.medium },
    { key: 'Hard', label: 'Hard [3]', color: difficultyColors.hard },
  ];

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text color={colors.primary} bold>
          {icons.target} Random Problem
        </Text>
      </Box>

      {/* Difficulty Filter */}
      <Panel title="Filter by Difficulty">
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

      {/* Action Button */}
      <Box marginTop={2}>
        {loading ? (
          <Box gap={1}>
            <Text color={colors.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={colors.textMuted}>Finding a random problem...</Text>
          </Box>
        ) : error ? (
          <Text color={colors.error}>{icons.cross} {error}</Text>
        ) : (
          <Box
            borderStyle="round"
            borderColor={colors.success}
            paddingX={3}
            paddingY={1}
          >
            <Text color={colors.success} bold>
              {icons.target} [Enter/r] Get Random Problem
            </Text>
          </Box>
        )}
      </Box>

      {/* Hints */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>[1/2/3]</Text> Filter{' '}
          <Text color={colors.primary}>[Enter]</Text> Get random{' '}
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
