/**
 * ProblemTable Component
 * Beautiful table displaying problems with all metadata
 */
import { Box, Text, useInput } from 'ink';
import { useMemo } from 'react';
import { DifficultyBadge, StatusBadge, AcceptanceRateBadge } from './Badge.js';
import { colors, icons } from '../theme.js';

export interface Problem {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'solved' | 'attempted' | 'todo';
  acceptance: number;
  isPaidOnly: boolean;
}

interface ProblemTableProps {
  problems: Problem[];
  selectedIndex: number;
  onSelect: (problem: Problem) => void;
  onNavigate: (index: number) => void;
  height?: number;
  showHeader?: boolean;
  width?: number;
}

export function ProblemTable({
  problems,
  selectedIndex,
  onSelect,
  onNavigate,
  height = 15,
  showHeader = true,
  width = 80,
}: ProblemTableProps) {
  // Calculate visible window
  const visibleStart = Math.max(0, selectedIndex - Math.floor(height / 2));
  const visibleEnd = Math.min(problems.length, visibleStart + height);
  const visibleProblems = problems.slice(visibleStart, visibleEnd);

  // Keyboard navigation
  useInput((input, key) => {
    if (key.downArrow || input === 'j') {
      onNavigate(Math.min(selectedIndex + 1, problems.length - 1));
    }
    if (key.upArrow || input === 'k') {
      onNavigate(Math.max(selectedIndex - 1, 0));
    }
    if (input === 'g') {
      onNavigate(0); // Go to top
    }
    if (input === 'G') {
      onNavigate(problems.length - 1); // Go to bottom
    }
    if (key.return) {
      const problem = problems[selectedIndex];
      if (problem) onSelect(problem);
    }
  });

  // Calculate responsive column widths based on available width
  const cols = useMemo(() => {
    // Fixed widths for structured columns
    const fixedCols = {
      status: 3,
      id: 6,
      difficulty: 8,
      acceptance: 8,
    };
    // Spacing and padding: 2 chars per gap (6 gaps) + 2 padding = ~16
    const fixedWidth = Object.values(fixedCols).reduce((a, b) => a + b, 0) + 18;
    // Title column gets remaining space, min 30 max 60
    const titleWidth = Math.max(30, Math.min(60, width - fixedWidth));
    return { ...fixedCols, title: titleWidth };
  }, [width]);

  return (
    <Box flexDirection="column">
      {/* Header */}
      {showHeader && (
        <Box
          borderStyle="single"
          borderBottom={true}
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderColor={colors.textMuted}
          paddingX={1}
        >
          <Text color={colors.textMuted}>
            {'  '}
            <Text>{'ID'.padEnd(cols.id)}</Text>
            {'  '}
            <Text>{'Title'.padEnd(cols.title)}</Text>
            {'  '}
            <Text>{'Diff'.padEnd(cols.difficulty)}</Text>
            {'  '}
            <Text>{'Accept'.padEnd(cols.acceptance)}</Text>
          </Text>
        </Box>
      )}

      {/* Rows */}
      {visibleProblems.map((problem, idx) => {
        const actualIndex = visibleStart + idx;
        const isSelected = actualIndex === selectedIndex;

        return (
          <Box
            key={problem.id}
            paddingX={1}
            paddingY={0}
          >
            <Text
              inverse={isSelected}
              color={isSelected ? colors.primary : colors.text}
            >
              {/* Selection indicator */}
              <Text color={isSelected ? colors.primary : colors.textMuted}>
                {isSelected ? icons.arrow : ' '}{' '}
              </Text>

              {/* Status */}
              <StatusBadge status={problem.status} />
              {'  '}

              {/* ID */}
              <Text color={isSelected ? colors.textBright : colors.textMuted}>
                {String(problem.id).padEnd(cols.id)}
              </Text>
              {'  '}

              {/* Title */}
              <Text color={isSelected ? colors.textBright : colors.text} bold={isSelected}>
                {problem.title.slice(0, cols.title).padEnd(cols.title)}
              </Text>
              {'  '}

              {/* Difficulty */}
              <DifficultyBadge difficulty={problem.difficulty} />
              {'  '}

              {/* Acceptance */}
              <AcceptanceRateBadge rate={problem.acceptance} />

              {/* Paid indicator */}
              {problem.isPaidOnly && (
                <Text color={colors.warning}> {icons.star}</Text>
              )}
            </Text>
          </Box>
        );
      })}

      {/* Scroll indicator */}
      <Box marginTop={1} paddingX={1}>
        <Text color={colors.textMuted}>
          {selectedIndex + 1}/{problems.length}
          {' '}
          {visibleStart > 0 && `${icons.arrowUp} `}
          {visibleEnd < problems.length && `${icons.arrowDown} `}
        </Text>
      </Box>
    </Box>
  );
}
