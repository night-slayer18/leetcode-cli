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
    <Box flexDirection="column" gap={1} flexGrow={1} paddingX={1}>
      {/* Header - Left Aligned now */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          {icons.fire} Daily Challenge
        </Text>
        <Text color={colors.textMuted}> — {daily.date}</Text>
      </Box>

      {/* Main Content Grid */}
      <Box flexDirection="row" gap={1}>
         {/* Left Col: Problem Details - Grows */}
         <Box flexGrow={1} flexDirection="column">
            <Panel title="Today's Problem" highlight>
              <Box flexDirection="column" gap={2} paddingX={1} paddingY={1}>
                <Box gap={2} alignItems="center">
                  <Text color={colors.textMuted}>#{daily.id}</Text>
                  <Text color={colors.textBright} bold>
                    {daily.title}
                  </Text>
                  <DifficultyBadge difficulty={daily.difficulty} />
                </Box>
                
                <Box marginTop={1}>
                  <Text color={colors.textMuted}>
                     Solve today's challenge to keep your streak alive!
                  </Text>
                </Box>

                <Box marginTop={2}>
                    <Text color={colors.textBright} underline>
                      {`https://leetcode.com/problems/${daily.titleSlug}/`}
                    </Text>
                </Box>
              </Box>
            </Panel>
         </Box>

         {/* Right Col: Status & Actions - Fixed Width */}
         <Box width={30} flexDirection="column" gap={1}>
            <Panel title="Status">
               <Box flexDirection="column" gap={1} alignItems="center" justifyContent="center" height={6}>
                  {daily.status === 'solved' ? (
                    <Text color={colors.success} bold>{icons.check} Completed</Text>
                  ) : daily.status === 'attempted' ? (
                    <Text color={colors.warning} bold>○ Attempted</Text>
                  ) : (
                    <Text color={colors.textMuted}>Not Started</Text>
                  )}
               </Box>
            </Panel>

            <Box 
              borderStyle="round" 
              borderColor={colors.success} 
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              paddingY={1}
            >
              <Text color={colors.success} bold>[p] Pick</Text>
            </Box>
         </Box>
      </Box>

      {/* Footer / Hints */}
      <Box marginTop={1}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>[p]</Text> Pick problem{' '}
          <Text color={colors.primary}>[r]</Text> Refresh{' '}
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
