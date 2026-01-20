/**
 * ProblemTable Component
 * Beautiful table displaying problems with all metadata
 */
import { Box, Text, useInput } from 'ink';
import { useMemo } from 'react';
import { DifficultyBadge, StatusBadge, AcceptanceRateBadge } from './Badge.js';
import { colors, icons } from '../theme.js';

export interface Problem {
  id: string;  // Changed to string to match API's questionFrontendId
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

  return (
    <Box flexDirection="column" flexGrow={1} width="100%">
      {/* Header */}
      {showHeader && (
        <Box
          width="100%"
          borderStyle="single"
          borderBottom={true}
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderColor={colors.textMuted}
          paddingX={1}
          flexDirection="row"
        >
          {/* Status & Selection Placeholder */}
          <Box width={3} flexShrink={0} /> 
          
          <Box width={3} flexShrink={0}>
             <Text color={colors.textMuted} bold>St</Text>
          </Box>
          
          {/* ID */}
          <Box width={6} flexShrink={0}>
            <Text color={colors.textMuted} bold>ID</Text>
          </Box>

          {/* Title */}
          <Box flexGrow={1} marginRight={1}>
             <Text color={colors.textMuted} bold>Title</Text>
          </Box>

          {/* Difficulty */}
          <Box width={8} flexShrink={0}>
             <Text color={colors.textMuted} bold>Diff</Text>
          </Box>

          {/* Acceptance */}
          <Box width={8} flexShrink={0}>
             <Text color={colors.textMuted} bold>Accept</Text>
          </Box>

          {/* Paid */}
          <Box width={2} flexShrink={0} />
        </Box>
      )}

      {/* Rows */}
      {visibleProblems.map((problem, idx) => {
        const actualIndex = visibleStart + idx;
        const isSelected = actualIndex === selectedIndex;

        return (
          <Box
            key={problem.id}
            width="100%"
            paddingX={1}
            paddingY={0}
            flexDirection="row"
            backgroundColor={isSelected ? colors.bgHighlight : undefined}
          >
            {/* Selection Indicator */}
            <Box width={3} flexShrink={0}>
               <Text color={isSelected ? colors.primary : colors.textMuted}>
                 {isSelected ? icons.arrow : ' '}{' '}
               </Text>
            </Box>

            {/* Status */}
            <Box width={3} flexShrink={0}>
              <StatusBadge status={problem.status} />
            </Box>

            {/* ID */}
            <Box width={6} flexShrink={0}>
              <Text color={isSelected ? colors.textBright : colors.textMuted}>
                {problem.id}
              </Text>
            </Box>

            {/* Title */}
            <Box flexGrow={1} marginRight={1}>
              <Text color={isSelected ? colors.textBright : colors.text} bold={isSelected} wrap="truncate">
                {problem.title}
              </Text>
            </Box>

            {/* Difficulty */}
            <Box width={8} flexShrink={0}>
              <DifficultyBadge difficulty={problem.difficulty} />
            </Box>

            {/* Acceptance */}
            <Box width={8} flexShrink={0}>
              <AcceptanceRateBadge rate={problem.acceptance} />
            </Box>
            
            {/* Paid */}
             <Box width={2} flexShrink={0}>
              {problem.isPaidOnly && (
                <Text color={colors.warning}> {icons.star}</Text>
              )}
            </Box>
          </Box>
        );
      })}

      {/* Scroll indicator */}
      <Box marginTop={1} paddingX={1} justifyContent="space-between">
         <Text color={colors.textMuted}>
          {selectedIndex + 1}/{problems.length}
        </Text>
        <Text color={colors.textMuted}>
          {visibleStart > 0 && `${icons.arrowUp} `}
          {visibleEnd < problems.length && `${icons.arrowDown} `}
        </Text>
      </Box>
    </Box>
  );
}
