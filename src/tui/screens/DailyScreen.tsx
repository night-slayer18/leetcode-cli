/**
 * Daily Screen
 * Show and pick the daily challenge
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useDailyChallenge } from '../hooks/useDailyChallenge.js';
import { Panel } from '../components/Panel.js';
import { DifficultyBadge } from '../components/Badge.js';
import { colors, icons } from '../theme.js';

interface DailyScreenProps {
  onPick: (problemId: number, titleSlug: string) => void;
  onBack: () => void;
}

export function DailyScreen({ onPick, onBack }: DailyScreenProps) {
  const { daily, loading, error, refetch } = useDailyChallenge();

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
    if (input === 'p' && daily) {
      onPick(daily.id, daily.titleSlug);
    }
    if (input === 'r') {
      refetch();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" />
        </Text>
        <Text color={colors.textMuted}> Loading daily challenge...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>
          Press <Text color={colors.primary}>[r]</Text> to retry or{' '}
          <Text color={colors.primary}>[Esc]</Text> to go back
        </Text>
      </Box>
    );
  }

  if (!daily) {
    return (
      <Box flexDirection="column">
        <Text color={colors.textMuted}>No daily challenge available today.</Text>
      </Box>
    );
  }

  const difficultyColor = {
    Easy: colors.success,
    Medium: colors.warning,
    Hard: colors.error,
  }[daily.difficulty];

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text color={colors.primary} bold>
          {icons.fire} Daily Challenge
        </Text>
        <Text color={colors.textMuted}> — {daily.date}</Text>
      </Box>

      {/* Problem Card */}
      <Panel title="Today's Problem" highlight>
        <Box flexDirection="column" gap={1} paddingX={2} paddingY={1}>
          <Box gap={2}>
            <Text color={colors.textMuted}>#{daily.id}</Text>
            <Text color={colors.textBright} bold>
              {daily.title}
            </Text>
          </Box>
          <Box gap={2}>
            <Text color={colors.textMuted}>Difficulty:</Text>
            <DifficultyBadge difficulty={daily.difficulty} />
          </Box>
        </Box>
      </Panel>

      {/* Actions */}
      <Box marginTop={2} gap={2}>
        <Box
          borderStyle="round"
          borderColor={colors.success}
          paddingX={2}
          paddingY={0}
        >
          <Text color={colors.success} bold>
            [p] Pick & Start Solving
          </Text>
        </Box>
      </Box>

      {/* Hints */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>[p]</Text> Pick problem{' '}
          <Text color={colors.primary}>[r]</Text> Refresh{' '}
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
