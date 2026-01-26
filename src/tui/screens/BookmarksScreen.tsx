/**
 * Bookmarks Screen
 * Display and manage bookmarked problems
 */
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useMemo } from 'react';
import { useBookmarks } from '../hooks/useBookmarks.js';
import { colors, icons } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';

interface BookmarksScreenProps {
  onSelectProblem: (problem: Problem) => void;
  onBack: () => void;
}

// Fixed widths to prevent overlap
const COL_WIDTHS = {
  selector: 2,
  status: 2,
  id: 6,
  difficulty: 8,
  acceptance: 7,
  premium: 3,
} as const;

function BookmarkRow({ 
  problem, 
  isSelected,
  titleWidth 
}: { 
  problem: Problem; 
  isSelected: boolean;
  titleWidth: number;
}) {
  const statusIcon = problem.status === 'solved' ? '✓' : problem.status === 'attempted' ? '○' : ' ';
  const statusColor = problem.status === 'solved' ? colors.success : problem.status === 'attempted' ? colors.warning : colors.textMuted;
  const diffColor = problem.difficulty === 'Easy' ? colors.success : problem.difficulty === 'Medium' ? colors.warning : colors.error;
  
  const truncatedTitle = problem.title.length > titleWidth 
    ? problem.title.substring(0, titleWidth - 3) + '...'
    : problem.title.padEnd(titleWidth);

  return (
    <Box width="100%" backgroundColor={isSelected ? colors.bgHighlight : undefined}>
      <Text>
        <Text color={isSelected ? colors.primary : colors.textMuted}>{isSelected ? '▶' : ' '} </Text>
        <Text color={statusColor}>{statusIcon} </Text>
        <Text color={colors.textMuted}>{problem.id.toString().padEnd(COL_WIDTHS.id)}</Text>
        <Text color={isSelected ? colors.textBright : colors.text} bold={isSelected}>{truncatedTitle}</Text>
        <Text color={diffColor}>{problem.difficulty.padEnd(COL_WIDTHS.difficulty)}</Text>
        <Text color={colors.textMuted}>{`${Math.round(problem.acceptance)}%`.padStart(COL_WIDTHS.acceptance)}</Text>
        <Text>{problem.isPaidOnly ? ' 💎' : '   '}</Text>
      </Text>
    </Box>
  );
}

export function BookmarksScreen({ onSelectProblem, onBack }: BookmarksScreenProps) {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  
  const totalFixed = Object.values(COL_WIDTHS).reduce((s, w) => s + w, 0);
  const titleWidth = Math.max(20, terminalWidth - totalFixed - 6);
  const listHeight = Math.max(5, terminalHeight - 12);

  const { bookmarks, loading, error, removeBookmark, clearAll, refetch } = useBookmarks();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Visible bookmarks
  const visibleBookmarks = useMemo(() => {
    return bookmarks.slice(scrollOffset, scrollOffset + listHeight);
  }, [bookmarks, scrollOffset, listHeight]);

  // Keep selection in view
  useState(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + listHeight) {
      setScrollOffset(selectedIndex - listHeight + 1);
    }
  });

  useInput((input, key) => {
    if (message) setMessage(null);
    
    if (key.escape) {
      if (confirmClear) {
        setConfirmClear(false);
      } else {
        onBack();
      }
      return;
    }
    
    if (confirmClear) {
      if (input === 'y' || input === 'Y') {
        const count = bookmarks.length;
        clearAll();
        setMessage({ type: 'success', text: `Cleared ${count} bookmark${count !== 1 ? 's' : ''}` });
        setConfirmClear(false);
        setSelectedIndex(0);
        setScrollOffset(0);
      } else {
        setConfirmClear(false);
      }
      return;
    }
    
    // Navigation
    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => Math.min(prev + 1, bookmarks.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
    if (input === 'g') {
      setSelectedIndex(0);
      setScrollOffset(0);
    }
    if (input === 'G') {
      setSelectedIndex(Math.max(0, bookmarks.length - 1));
    }
    
    // Actions
    if (key.return) {
      if (bookmarks[selectedIndex]) {
        onSelectProblem(bookmarks[selectedIndex]);
      }
    }
    if ((input === 'x' || input === 'd') && bookmarks.length > 0) {
      const problem = bookmarks[selectedIndex];
      if (problem) {
        removeBookmark(problem.id.toString());
        setMessage({ type: 'success', text: `Removed bookmark for #${problem.id}` });
        if (selectedIndex >= bookmarks.length - 1) {
          setSelectedIndex(Math.max(0, bookmarks.length - 2));
        }
      }
    }
    if (input === 'C' && bookmarks.length > 0) {
      setConfirmClear(true);
    }
    if (input === 'R') {
      refetch();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}><Spinner type="dots" /></Text>
        <Text color={colors.textMuted}> Loading bookmarks...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={2}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>
          Press <Text color={colors.primary}>[R]</Text> to retry or{' '}
          <Text color={colors.primary}>[Esc]</Text> to go back
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>{icons.bookmark} Bookmarks</Text>
        <Text color={colors.textMuted}> — {bookmarks.length} saved</Text>
      </Box>

      {/* Confirm Clear Dialog */}
      {confirmClear && (
        <Box marginBottom={1} borderStyle="round" borderColor={colors.warning} paddingX={2}>
          <Text color={colors.warning}>
            Clear all {bookmarks.length} bookmarks? <Text color={colors.primary}>[y/N]</Text>
          </Text>
        </Box>
      )}

      {/* Message */}
      {message && (
        <Box marginBottom={1}>
          <Text color={message.type === 'success' ? colors.success : colors.error}>
            {message.type === 'success' ? icons.check : icons.cross} {message.text}
          </Text>
        </Box>
      )}

      {/* Bookmarks Table */}
      {bookmarks.length > 0 ? (
        <>
          {/* Table Header */}
          <Box 
            borderStyle="single" 
            borderBottom={true} 
            borderTop={false} 
            borderLeft={false} 
            borderRight={false} 
            borderColor={colors.textMuted}
            width="100%"
          >
            <Text>
              <Text color={colors.textMuted} bold>{'St'.padEnd(COL_WIDTHS.selector + COL_WIDTHS.status + 2)}</Text>
              <Text color={colors.textMuted} bold>{'ID'.padEnd(COL_WIDTHS.id)}</Text>
              <Text color={colors.textMuted} bold>{'Title'.padEnd(titleWidth)}</Text>
              <Text color={colors.textMuted} bold>{'Diff'.padEnd(COL_WIDTHS.difficulty)}</Text>
              <Text color={colors.textMuted} bold>{'Accept'.padStart(COL_WIDTHS.acceptance)}</Text>
              <Text color={colors.textMuted} bold> 💎</Text>
            </Text>
          </Box>

          {/* Rows */}
          <Box flexDirection="column" flexGrow={1} width="100%">
            {visibleBookmarks.map((problem, idx) => (
              <BookmarkRow
                key={`${problem.id}-${scrollOffset + idx}`}
                problem={problem}
                isSelected={scrollOffset + idx === selectedIndex}
                titleWidth={titleWidth}
              />
            ))}
          </Box>

          {/* Footer */}
          <Box 
            marginTop={1}
            borderStyle="single" 
            borderTop={true} 
            borderBottom={false} 
            borderLeft={false} 
            borderRight={false} 
            borderColor={colors.textMuted}
            width="100%"
          >
            <Text color={colors.textMuted}>
              {selectedIndex + 1} of {bookmarks.length}
            </Text>
          </Box>
        </>
      ) : (
        <Box 
          borderStyle="round" 
          borderColor={colors.textMuted} 
          flexDirection="column" 
          padding={2} 
          alignItems="center"
        >
          <Text color={colors.textMuted}>No bookmarks yet.</Text>
          <Text color={colors.textMuted}>Press [b] on any problem to bookmark it.</Text>
        </Box>
      )}

      {/* Controls */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>[j/k]</Text> Navigate{' '}
          <Text color={colors.primary}>[Enter]</Text> View{' '}
          <Text color={colors.primary}>[x]</Text> Remove{' '}
          {bookmarks.length > 0 && <><Text color={colors.primary}>[C]</Text> Clear all{' '}</>}
          <Text color={colors.primary}>[R]</Text> Refresh{' '}
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}