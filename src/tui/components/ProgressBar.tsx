/**
 * ProgressBar Component
 * Gradient-style progress visualization
 */
import { Box, Text } from 'ink';
import { progressChars, colors } from '../theme.js';

interface ProgressBarProps {
  value: number;
  max: number;
  width?: number;
  color?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  max,
  width = 20,
  color = colors.primary,
  showLabel = true,
  showPercentage = false,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  const filledWidth = Math.round((value / max) * width);
  const emptyWidth = width - filledWidth;

  return (
    <Box gap={1}>
      <Box>
        <Text color={color}>
          {progressChars.filled.repeat(filledWidth)}
        </Text>
        <Text color={colors.textDim}>
          {progressChars.empty.repeat(emptyWidth)}
        </Text>
      </Box>
      {showLabel && (
        <Text color={colors.textMuted}>
          {value}/{max}
        </Text>
      )}
      {showPercentage && (
        <Text color={colors.textMuted}>({percentage}%)</Text>
      )}
    </Box>
  );
}

// Difficulty-specific progress bar
interface DifficultyProgressProps {
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
  width?: number;
}

export function DifficultyProgress({
  easy,
  medium,
  hard,
  width = 20,
}: DifficultyProgressProps) {
  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Text color={colors.success}>Easy  </Text>
        <ProgressBar
          value={easy.solved}
          max={easy.total}
          width={width}
          color={colors.success}
        />
      </Box>
      <Box gap={2}>
        <Text color={colors.warning}>Medium</Text>
        <ProgressBar
          value={medium.solved}
          max={medium.total}
          width={width}
          color={colors.warning}
        />
      </Box>
      <Box gap={2}>
        <Text color={colors.error}>Hard  </Text>
        <ProgressBar
          value={hard.solved}
          max={hard.total}
          width={width}
          color={colors.error}
        />
      </Box>
    </Box>
  );
}
