/**
 * Problem View Screen
 * Detailed problem display with scrollable description
 * Uses simple layout to avoid Ink height calculation issues
 */
import { Box, Text, useInput, useStdout } from 'ink';
import { useState, useEffect, useMemo } from 'react';
import Spinner from 'ink-spinner';
import striptags from 'striptags';
import { leetcodeClient } from '../../api/client.js';
import type { ProblemDetail } from '../../types.js';
import { DifficultyBadge, StatusBadge } from '../components/Badge.js';
import { colors, icons, borders } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';

interface ProblemViewProps {
  problem: Problem;
  onBack: () => void;
  onPick: (problem: Problem) => void;
  onTest?: (problem: Problem) => void;
  onSubmit?: (problem: Problem) => void;
  onHints?: (problem: Problem) => void;
  onSubmissions?: (problem: Problem) => void;
  onNotes?: (problem: Problem) => void;
}

/**
 * Parse HTML content to clean text for TUI display.
 * Mirrors the approach in src/utils/display.ts but returns plain text.
 */
function parseContent(html: string): string {
  if (!html) return '';
  
  let content = html;
  
  // Handle superscripts
  content = content.replace(/<sup>(.*?)<\/sup>/gi, '^$1');
  
  // Mark sections
  content = content.replace(/<strong class="example">Example (\d+):<\/strong>/gi, '\n📌 Example $1:\n');
  content = content.replace(/Input:/gi, '  Input:');
  content = content.replace(/Output:/gi, '  Output:');
  content = content.replace(/Explanation:/gi, '  Explanation:');
  content = content.replace(/<strong>Constraints:<\/strong>/gi, '\n📋 Constraints:\n');
  content = content.replace(/Constraints:/gi, '\n📋 Constraints:\n');
  content = content.replace(/<strong>Follow-up:/gi, '\n💡 Follow-up:');
  
  // Handle lists
  content = content.replace(/<li>/gi, '• ');
  content = content.replace(/<\/li>/gi, '\n');
  
  // Handle breaks
  content = content.replace(/<\/p>/gi, '\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip tags
  content = striptags(content);
  
  // Decode entities
  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, '&');
  
  // Clean up whitespace
  content = content.replace(/\t/g, ' ');
  content = content.replace(/ +/g, ' ');
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return content.trim();
}

export function ProblemViewScreen({
  problem,
  onBack,
  onPick,
  onTest,
  onSubmit,
  onHints,
  onSubmissions,
  onNotes,
}: ProblemViewProps) {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  
  // Layout - keep it simple
  const sidebarWidth = 24;
  const mainWidth = Math.max(40, terminalWidth - sidebarWidth - 4);
  const contentWidth = mainWidth - 6; // Safer padding calculation
  const descriptionHeight = Math.max(5, terminalHeight - 8);
  
  const [details, setDetails] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setScrollOffset(0);
    leetcodeClient.getProblem(problem.titleSlug)
      .then(setDetails)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [problem.titleSlug]);

  // Parse content and split into lines with word wrap
  const lines = useMemo(() => {
    if (!details?.content) return ['No content available'];
    
    // Add extra newlines for safety around tables and lists
    let safeContent = details.content
      .replace(/<table/g, '\n<table')
      .replace(/<\/table>/g, '</table>\n');
      
    const parsed = parseContent(safeContent);
    const result: string[] = [];
    
    for (const line of parsed.split('\n')) {
      if (line.length <= contentWidth) {
        result.push(line);
      } else {
        // Word wrap
        let remaining = line;
        while (remaining.length > contentWidth) {
          let breakAt = remaining.lastIndexOf(' ', contentWidth);
          if (breakAt <= 0) breakAt = contentWidth;
          result.push(remaining.slice(0, breakAt).trimEnd());
          remaining = remaining.slice(breakAt).trimStart();
        }
        if (remaining) result.push(remaining);
      }
    }
    
    return result;
  }, [details?.content, contentWidth]);

  const maxScroll = Math.max(0, lines.length - descriptionHeight + 2); // +2 buffer
  const visibleLines = lines.slice(scrollOffset, scrollOffset + descriptionHeight);

  useInput((input, key) => {
    if (key.escape) { onBack(); return; }
    if (key.downArrow || input === 'j') { setScrollOffset(o => Math.min(o + 1, maxScroll)); return; }
    if (key.upArrow || input === 'k') { setScrollOffset(o => Math.max(o - 1, 0)); return; }
    if (input === 'G') { setScrollOffset(maxScroll); return; }
    if (input === 'g') { setScrollOffset(0); return; }
    if (input === 'p') onPick(problem);
    if (input === 't' && onTest) onTest(problem);
    if (input === 'x' && onSubmit) onSubmit(problem);
    if (input === 'h' && onHints) onHints(problem);
    if (input === 's' && onSubmissions) onSubmissions(problem);
    if (input === 'n' && onNotes) onNotes(problem);
  });

  // Loading state
  if (loading) {
    return (
      <Box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={colors.primary}><Spinner type="dots" /></Text>
        <Text color={colors.text}> Loading...</Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>Press Esc to go back</Text>
      </Box>
    );
  }

  const scrollInfo = lines.length > descriptionHeight ? `(${scrollOffset + 1}-${Math.min(scrollOffset + visibleLines.length, lines.length)}/${lines.length})` : '';

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box paddingX={1} marginBottom={1}>
        <Text color={colors.textMuted}>#{problem.id} </Text>
        <Text color={colors.textBright} bold>{problem.title} </Text>
        <DifficultyBadge difficulty={problem.difficulty} />
        <Text> </Text>
        <StatusBadge status={problem.status} />
      </Box>

      {/* Main content area */}
      <Box flexDirection="row" flexGrow={1}>
        {/* Description */}
        <Box flexDirection="column" width={mainWidth} paddingX={1}>
          {/* Title bar */}
          <Box>
            <Text color={colors.primary} bold>{borders.roundTopLeft}{borders.horizontal} Description {scrollInfo} {borders.horizontal.repeat(Math.max(0, contentWidth - 18 - scrollInfo.length))}{borders.roundTopRight}</Text>
          </Box>
          
          {/* Content Container - Fixed Height */}
          <Box 
            flexDirection="column" 
            height={descriptionHeight}
            borderStyle="round"
            borderColor={colors.textMuted}
            borderTop={false}
            paddingX={1}
          >
            {/* Render lines directly - truncate prevents 2nd line wrapping */}
            {visibleLines.map((line, i) => (
              <Text key={i} color={colors.text} wrap="truncate">{line || ' '}</Text>
            ))}
          </Box>
          
          {/* Scroll indicators */}
          {lines.length > descriptionHeight && (
            <Box marginTop={1}>
              <Text color={colors.textMuted}>
                {scrollOffset > 0 ? <Text color={colors.primary}>↑</Text> : ' '}
                {' j/k '}
                {scrollOffset < maxScroll ? <Text color={colors.primary}>↓</Text> : ' '}
              </Text>
            </Box>
          )}
        </Box>

        {/* Actions sidebar */}
        <Box flexDirection="column" width={sidebarWidth} paddingLeft={1}>
          <Text color={colors.primary} bold>{borders.roundTopLeft}{borders.horizontal} Actions {borders.horizontal.repeat(sidebarWidth - 14)}{borders.roundTopRight}</Text>
          <Box 
            flexDirection="column" 
            borderStyle="round" 
            borderTop={false}
            borderColor={colors.textMuted}
            paddingX={1}
          >
            <Text color={colors.text}>{icons.code} Pick [p]</Text>
            <Text color={colors.text}>{icons.target} Test [t]</Text>
            <Text color={colors.text}>{icons.lightning} Submit [x]</Text>
            <Text color={colors.text}>{icons.star} Hints [h]</Text>
            <Text color={colors.text}>{icons.folder} History [s]</Text>
            <Text color={colors.text}>{icons.bookmark} Notes [n]</Text>
            <Text> </Text>
            <Text color={colors.textMuted}>{icons.arrowLeft} Back [Esc]</Text>
          </Box>
          
          <Box marginTop={1}>
            <Text color={colors.primary} bold>{borders.roundTopLeft}{borders.horizontal} Stats {borders.horizontal.repeat(sidebarWidth - 12)}{borders.roundTopRight}</Text>
          </Box>
          <Box 
            flexDirection="column" 
            borderStyle="round" 
            borderTop={false}
            borderColor={colors.textMuted}
            paddingX={1}
          >
            <Text color={colors.textMuted}>Acceptance: <Text color={colors.success}>{problem.acceptance.toFixed(1)}%</Text></Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
