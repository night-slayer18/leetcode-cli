/**
 * Styled Box Component
 * Premium bordered container with rounded corners
 */
import { Box as InkBox, Text } from 'ink';
import type { ReactNode } from 'react';
import { borders, colors, spacing } from '../theme.js';

interface BoxProps {
  children: ReactNode;
  title?: string;
  width?: number | string;
  height?: number;
  borderColor?: string;
  borderStyle?: 'light' | 'heavy' | 'round';
  padding?: number;
}

export function Box({
  children,
  title,
  width,
  height,
  borderColor = colors.textMuted,
  borderStyle = 'round',
  padding = spacing.sm,
}: BoxProps) {
  const chars = {
    light: {
      tl: borders.topLeft,
      tr: borders.topRight,
      bl: borders.bottomLeft,
      br: borders.bottomRight,
      h: borders.horizontal,
      v: borders.vertical,
    },
    heavy: {
      tl: borders.heavyTopLeft,
      tr: borders.heavyTopRight,
      bl: borders.heavyBottomLeft,
      br: borders.heavyBottomRight,
      h: borders.heavyHorizontal,
      v: borders.heavyVertical,
    },
    round: {
      tl: borders.roundTopLeft,
      tr: borders.roundTopRight,
      bl: borders.roundBottomLeft,
      br: borders.roundBottomRight,
      h: borders.horizontal,
      v: borders.vertical,
    },
  }[borderStyle];

  return (
    <InkBox
      flexDirection="column"
      width={width}
      height={height}
      borderStyle="round"
      borderColor={borderColor}
      paddingX={padding}
      paddingY={padding > 1 ? 1 : 0}
    >
      {title && (
        <InkBox marginTop={-1} marginLeft={1}>
          <Text color={colors.primary} bold>
            {' '}
            {title}{' '}
          </Text>
        </InkBox>
      )}
      {children}
    </InkBox>
  );
}
