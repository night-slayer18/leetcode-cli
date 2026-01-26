/**
 * Panel Component
 * Titled section with consistent styling
 */
import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import { colors, spacing } from '../theme.js';

interface PanelProps {
  children: ReactNode;
  title: string;
  width?: number | string;
  height?: number;
  highlight?: boolean;
  flexGrow?: number;
}

export function Panel({
  children,
  title,
  width = '100%', // Default to full width for consistency
  height,
  highlight = false,
  flexGrow = 0,
}: PanelProps) {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      flexGrow={flexGrow}
      borderStyle="round"
      borderColor={highlight ? colors.primary : colors.textMuted}
      paddingX={spacing.sm}
    >
      <Box marginTop={-1} marginLeft={1}>
        <Text color={highlight ? colors.primary : colors.text} bold>
          {' '}
          {title}{' '}
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {children}
      </Box>
    </Box>
  );
}
