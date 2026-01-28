/**
 * Home Screen
 * Dashboard with real stats from LeetCode API
 */
import { Box, Text, useInput, useStdout } from 'ink';
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
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;
  
  // Calculate responsive panel heights
  // Total available: terminal height - header(3) - statusbar(2) - gaps(2) - footer(2)
  const availableHeight = Math.max(12, terminalHeight - 9);
  // Stats row gets 45% of available space, minimum 8 lines
  const statsRowHeight = Math.max(8, Math.floor(availableHeight * 0.45));
  
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

    <Box flexDirection="column" gap={1} flexGrow={1}>
      {/* ROW 1: Stats & Streak (Side by Side) - Responsive Height */}
      <Box flexDirection="row" gap={1} height={statsRowHeight} flexShrink={0}>
        
        {/* Left Col: Progress - Grows */}
        <Box flexGrow={1} flexDirection="column">
          <Panel title="📊 Progress" highlight flexGrow={1}>
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
                  <Box marginTop={1} gap={2}>
                    <Text color={colors.text}>
                      Total: <Text bold color={colors.primary}>{stats.totalSolved}</Text>
                    </Text>
                    <Text color={colors.text}>
                      Rank: <Text color={colors.purple}>#{stats.ranking.toLocaleString()}</Text>
                    </Text>
                  </Box>
                  {!stats.isLoggedIn && (
                      <Text color={colors.warning}>
                        {icons.star} Login to see your stats
                      </Text>
                    )}
                </>
              ) : null}
            </Box>
          </Panel>
        </Box>

        {/* Right Col: Streak - Fixed Width */}
        <Box width={35} flexDirection="column"> 
          <Panel title="🔥 Streak" flexGrow={1}>
            {statsLoading ? (
              <Box>
                <Text color={colors.primary}>
                  <Spinner type="dots" />
                </Text>
              </Box>
            ) : stats ? (
              <Box gap={1} flexDirection="column" justifyContent="center" height="100%">
                <Text color={colors.orange} bold>
                  {stats.streak} days
                </Text>
                <Text color={colors.textMuted}>
                   {stats.totalActiveDays} active days
                </Text>
              </Box>
            ) : null}
          </Panel>
        </Box>
      </Box>

      {/* ROW 2: Daily Challenge (Fills remaining vertical space) */}
      <Box flexGrow={1} flexDirection="column">
        <Panel title="🎯 Daily Challenge" flexGrow={1}>
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
            <Box flexDirection="column" flexGrow={1}>
              <Box gap={2} marginBottom={1}>
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

              <Box marginTop={2} flexGrow={1} justifyContent="flex-end">
                <Text color={colors.textMuted}>
                  Press <Text color={colors.primary}>[d]</Text> to {daily.status === 'solved' ? 'view' : 'solve'} today's challenge
                </Text>
              </Box>
            </Box>
          ) : (
            <Text color={colors.textMuted}>No daily challenge available</Text>
          )}
        </Panel>
      </Box>

      {/* Quick Actions */}
      <Box flexDirection="column" marginTop={0}>
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
