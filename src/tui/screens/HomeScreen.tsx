/**
 * Home Screen
 * Dashboard with real stats from LeetCode API
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { Panel } from '../components/Panel.js';
import { DifficultyProgress } from '../components/ProgressBar.js';
import { useUserStats } from '../hooks/useUserStats.js';
import { useDailyChallenge } from '../hooks/useDailyChallenge.js';
import { colors, icons } from '../theme.js';

interface HomeScreenProps {
  username?: string;
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { stats, loading: statsLoading, error: statsError } = useUserStats();
  const { daily, loading: dailyLoading, error: dailyError } = useDailyChallenge();

  useInput((input) => {
    // Quick navigation shortcuts
    if (input === 'd') onNavigate('daily');
    if (input === 'l') onNavigate('list');
    if (input === 'r') onNavigate('random');
    if (input === 's') onNavigate('stats');
    if (input === 't') onNavigate('timer');
  });

  const difficultyColor = {
    Easy: colors.success,
    Medium: colors.warning,
    Hard: colors.error,
  };

  return (
    <Box flexDirection="column" gap={1}>
      {/* Stats Panel */}
      <Panel title="📊 Progress" highlight>
        <Box flexDirection="column" gap={1}>
          {statsLoading ? (
            <Box>
              <Text color={colors.primary}>
                <Spinner type="dots" />
              </Text>
              <Text color={colors.textMuted}> Loading stats...</Text>
            </Box>
          ) : statsError ? (
            <Text color={colors.error}>{icons.cross} {statsError}</Text>
          ) : stats ? (
            <>
              <DifficultyProgress
                easy={stats.easy}
                medium={stats.medium}
                hard={stats.hard}
                width={25}
              />
              <Box marginTop={1} gap={4}>
                <Text color={colors.text}>
                  Total: <Text bold color={colors.primary}>{stats.totalSolved}</Text>
                </Text>
                <Text color={colors.text}>
                  Rank: <Text color={colors.purple}>#{stats.ranking.toLocaleString()}</Text>
                </Text>
                {!stats.isLoggedIn && (
                  <Text color={colors.warning}>
                    {icons.star} Login to see your stats
                  </Text>
                )}
              </Box>
            </>
          ) : null}
        </Box>
      </Panel>

      {/* Daily Challenge Panel */}
      <Panel title="🎯 Daily Challenge">
        {dailyLoading ? (
          <Box>
            <Text color={colors.primary}>
              <Spinner type="dots" />
            </Text>
            <Text color={colors.textMuted}> Loading daily challenge...</Text>
          </Box>
        ) : dailyError ? (
          <Text color={colors.error}>{icons.cross} {dailyError}</Text>
        ) : daily ? (
          <>
            <Box gap={2}>
              <Text color={colors.textMuted}>#{daily.id}</Text>
              <Text color={colors.textBright} bold>
                {daily.title}
              </Text>
              <Text color={difficultyColor[daily.difficulty]}>
                [{daily.difficulty}]
              </Text>
            </Box>
            <Box marginTop={1}>
              {daily.status === 'solved' ? (
                <Text color={colors.success}>{icons.check} Completed!</Text>
              ) : daily.status === 'attempted' ? (
                <Text color={colors.warning}>○ Attempted</Text>
              ) : (
                <Text color={colors.textMuted}>- Not started</Text>
              )}
            </Box>
            <Box marginTop={1}>
              <Text color={colors.textMuted}>
                Press <Text color={colors.primary}>[d]</Text> to {daily.status === 'solved' ? 'view' : 'solve'} today's challenge
              </Text>
            </Box>
          </>
        ) : (
          <Text color={colors.textMuted}>No daily challenge available</Text>
        )}
      </Panel>

      {/* Streak Panel */}
      <Panel title="🔥 Streak">
        {statsLoading ? (
          <Box>
            <Text color={colors.primary}>
              <Spinner type="dots" />
            </Text>
          </Box>
        ) : stats ? (
          <Box gap={2}>
            <Text color={colors.orange} bold>
              {stats.streak} days
            </Text>
            <Text color={colors.textMuted}>
              • {stats.totalActiveDays} total active days
            </Text>
          </Box>
        ) : null}
      </Panel>

      {/* Quick Actions */}
      <Box flexDirection="column" marginTop={1}>
        <Text color={colors.textMuted} dimColor>
          Quick Actions:{' '}
          <Text color={colors.primary}>[l]</Text> List{' '}
          <Text color={colors.primary}>[r]</Text> Random{' '}
          <Text color={colors.primary}>[s]</Text> Stats{' '}
          <Text color={colors.primary}>[t]</Text> Timer
        </Text>
      </Box>
    </Box>
  );
}
