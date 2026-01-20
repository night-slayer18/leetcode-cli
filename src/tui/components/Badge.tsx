/**
 * Badge Component
 * Styled difficulty and status badges
 */
import { Text } from 'ink';
import { colors, difficulty as difficultyColors, status as statusColors, icons } from '../theme.js';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Status = 'solved' | 'attempted' | 'todo';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  compact?: boolean;
}

export function DifficultyBadge({ difficulty, compact = false }: DifficultyBadgeProps) {
  const color = {
    Easy: difficultyColors.easy,
    Medium: difficultyColors.medium,
    Hard: difficultyColors.hard,
  }[difficulty];

  if (compact) {
    return (
      <Text color={color} bold>
        {difficulty[0]}
      </Text>
    );
  }

  return (
    <Text color={color} bold>
      {difficulty.padEnd(6)}
    </Text>
  );
}

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    solved: { icon: icons.check, color: statusColors.solved },
    attempted: { icon: '○', color: statusColors.attempted },
    todo: { icon: ' ', color: statusColors.todo },
  }[status];

  return (
    <Text color={config.color} bold>
      {config.icon}
    </Text>
  );
}

interface AcceptanceRateBadgeProps {
  rate: number;
}

export function AcceptanceRateBadge({ rate }: AcceptanceRateBadgeProps) {
  const color = rate >= 60 ? colors.success : rate >= 40 ? colors.warning : colors.error;
  return (
    <Text color={color}>
      {rate.toFixed(1)}%
    </Text>
  );
}
