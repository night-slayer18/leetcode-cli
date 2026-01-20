/**
 * Header Component
 * Top bar with branding and user info
 */
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { colors, icons } from '../theme.js';

interface HeaderProps {
  username?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'loading';
}

export function Header({
  username = 'Guest',
  connectionStatus = 'connected',
}: HeaderProps) {
  const statusColor = {
    connected: colors.success,
    disconnected: colors.error,
    loading: colors.warning,
  }[connectionStatus];

  const statusIcon = {
    connected: '●',
    disconnected: '○',
    loading: '◐',
  }[connectionStatus];

  return (
    <Box
      borderStyle="round"
      borderColor={colors.primary}
      paddingX={2}
      justifyContent="space-between"
    >
      {/* Branding */}
      <Box gap={1}>
        <Text bold>
          <Gradient name="morning">
             {icons.fire} LeetCode CLI 
          </Gradient>
        </Text>
        <Text color={colors.textMuted} dimColor>v2.2.2</Text>
      </Box>

      {/* User info */}
      <Box gap={2}>
        <Text color={statusColor}>{statusIcon}</Text>
        <Text color={colors.textBright} bold>@{username}</Text>
      </Box>
    </Box>
  );
}
