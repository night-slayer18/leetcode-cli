/**
 * Panel Component
 * Titled section with consistent styling and proper flex support
 */
import { Box, Text } from 'ink';
import type { ReactNode } from 'react';
import { colors, spacing } from '../theme.js';

interface PanelProps {
  children: ReactNode;
  title: string;
  width?: number | string;
  height?: number;
  minHeight?: number;
  highlight?: boolean;
  flexGrow?: number;
  flexShrink?: number;
}

export function Panel({
  children,
  title,
  width = '100%',
  height,
  minHeight,
  highlight = false,
  flexGrow = 0,
  flexShrink = 0,
}: PanelProps) {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      minHeight={minHeight}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      borderStyle="round"
      borderColor={highlight ? colors.primary : colors.textMuted}
      paddingX={spacing.sm}
    >
      {/* Title positioned on border */}
      <Box marginTop={-1} marginLeft={1}>
        <Text color={highlight ? colors.primary : colors.text} bold>
          {' '}
          {title}{' '}
        </Text>
      </Box>
      {/* Content container - uses remaining space */}
      <Box flexDirection="column" flexGrow={1} marginTop={1}>
        {children}
      </Box>
    </Box>
  );
}
