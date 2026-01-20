/**
 * StatusBar Component
 * Bottom bar showing status info and key hints
 */
import { Box, Text } from 'ink';
import { colors, icons } from '../theme.js';

interface StatusBarProps {
  status?: string;
  user?: string;
  hints?: Array<{ key: string; label: string }>;
}

export function StatusBar({ status, user, hints = [] }: StatusBarProps) {
  return (
    <Box
      borderStyle="single"
      borderTop={true}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      borderColor={colors.textMuted}
      paddingX={1}
      justifyContent="space-between"
    >
      {/* Left: Status */}
      <Box gap={2}>
        {status && (
          <Text color={colors.textMuted}>
            {icons.lightning} {status}
          </Text>
        )}
      </Box>

      {/* Center: Keyboard hints */}
      <Box gap={2}>
        {hints.map(({ key, label }) => (
          <Box key={key}>
            <Text color={colors.primary}>[{key}]</Text>
            <Text color={colors.textMuted}> {label}</Text>
          </Box>
        ))}
      </Box>

      {/* Right: User */}
      <Box>
        {user && (
          <Text color={colors.textMuted}>
            {icons.code} {user}
          </Text>
        )}
      </Box>
    </Box>
  );
}
