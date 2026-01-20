/**
 * Stats Screen
 * User statistics with visual charts and heatmap
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useUserStats } from '../hooks/useUserStats.js';
import { Panel } from '../components/Panel.js';
import { DifficultyProgress } from '../components/ProgressBar.js';
import { colors, icons, progressChars } from '../theme.js';

interface StatsScreenProps {
  onBack: () => void;
}

// Generate a simple heatmap visualization
function Heatmap({ weeks = 12 }: { weeks?: number }) {
  // Mock activity data - will be integrated with real calendar data
  const days = ['Mon', 'Wed', 'Fri', 'Sun'];
  
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.textMuted}>Activity (last {weeks} weeks)</Text>
      </Box>
      {days.map((day) => (
        <Box key={day} gap={1}>
          <Text color={colors.textMuted}>{day.padEnd(3)}</Text>
          {Array.from({ length: weeks }).map((_, week) => {
            // Random activity level for demo
            const level = Math.floor(Math.random() * 5);
            const char = level === 0 ? '░' : level === 1 ? '▒' : level === 2 ? '▓' : '█';
            const color = level === 0 ? colors.textDim : 
                          level === 1 ? colors.success + '40' :
                          level === 2 ? colors.success + '80' : colors.success;
            return (
              <Text key={week} color={color}>
                {char}
              </Text>
            );
          })}
        </Box>
      ))}
      <Box marginTop={1} gap={1}>
        <Text color={colors.textMuted}>Less</Text>
        <Text color={colors.textDim}>░</Text>
        <Text color={colors.success}>▒</Text>
        <Text color={colors.success}>▓</Text>
        <Text color={colors.success}>█</Text>
        <Text color={colors.textMuted}>More</Text>
      </Box>
    </Box>
  );
}

// Horizontal bar chart
function BarChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 30;

  return (
    <Box flexDirection="column" gap={1}>
      {data.map(({ label, value, color }) => {
        const width = Math.round((value / maxValue) * barWidth);
        return (
          <Box key={label} gap={1}>
            <Text color={colors.textMuted}>{label.padEnd(10)}</Text>
            <Text color={color}>{progressChars.filled.repeat(width)}</Text>
            <Text color={colors.textDim}>{progressChars.empty.repeat(barWidth - width)}</Text>
            <Text color={colors.textMuted}>{value}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

export function StatsScreen({ onBack }: StatsScreenProps) {
  const { stats, loading, error } = useUserStats();

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" />
        </Text>
        <Text color={colors.textMuted}> Loading your statistics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>Press [Esc] to go back</Text>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box flexDirection="column">
        <Text color={colors.textMuted}>No stats available. Please login first.</Text>
      </Box>
    );
  }

  const difficultyData = [
    { label: 'Easy', value: stats.easy.solved, color: colors.success },
    { label: 'Medium', value: stats.medium.solved, color: colors.warning },
    { label: 'Hard', value: stats.hard.solved, color: colors.error },
  ];

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          {icons.stats} Statistics
        </Text>
        {stats.isLoggedIn ? (
          <Text color={colors.textMuted}> — @{stats.username}</Text>
        ) : (
          <Text color={colors.warning}> — Not logged in</Text>
        )}
      </Box>

      <Box flexDirection="row" gap={2}>
        {/* Left Column */}
        <Box flexDirection="column" flexGrow={1}>
          {/* Progress Overview */}
          <Panel title="📊 Progress Overview" highlight>
            <Box flexDirection="column" gap={1}>
              <DifficultyProgress
                easy={stats.easy}
                medium={stats.medium}
                hard={stats.hard}
                width={25}
              />
              <Box marginTop={1} gap={4}>
                <Text color={colors.text}>
                  Total Solved: <Text bold color={colors.primary}>{stats.totalSolved}</Text>
                </Text>
              </Box>
            </Box>
          </Panel>

          {/* Ranking */}
          <Box marginTop={1}>
            <Panel title="🏆 Ranking">
              <Box flexDirection="column" gap={1}>
                <Box gap={2}>
                  <Text color={colors.textMuted}>Global Rank:</Text>
                  <Text color={colors.purple} bold>
                    #{stats.ranking.toLocaleString()}
                  </Text>
                </Box>
                <Box gap={2}>
                  <Text color={colors.textMuted}>Current Streak:</Text>
                  <Text color={colors.orange} bold>
                    {stats.streak} days {icons.fire}
                  </Text>
                </Box>
                <Box gap={2}>
                  <Text color={colors.textMuted}>Active Days:</Text>
                  <Text color={colors.success}>
                    {stats.totalActiveDays}
                  </Text>
                </Box>
              </Box>
            </Panel>
          </Box>
        </Box>

        {/* Right Column */}
        <Box flexDirection="column" width={50}>
          {/* Difficulty Breakdown Chart */}
          <Panel title="📈 Difficulty Breakdown">
            <BarChart data={difficultyData} />
          </Panel>

          {/* Activity Heatmap */}
          <Box marginTop={1}>
            <Panel title="🗓 Activity Heatmap">
              <Heatmap weeks={12} />
            </Panel>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          Press <Text color={colors.primary}>[Esc]</Text> to go back
        </Text>
      </Box>
    </Box>
  );
}
