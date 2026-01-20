/**
 * Bookmarks Screen
 * Display and manage bookmarked problems
 * Matches CLI `bookmark` command functionality
 */
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useState } from 'react';
import { ProblemTable, type Problem } from '../components/ProblemTable.js';
import { Panel } from '../components/Panel.js';
import { useBookmarks } from '../hooks/useBookmarks.js';
import { colors, icons } from '../theme.js';

interface BookmarksScreenProps {
  onSelectProblem: (problem: Problem) => void;
  onBack: () => void;
}

export function BookmarksScreen({ onSelectProblem, onBack }: BookmarksScreenProps) {
  const { bookmarks, loading, error, removeBookmark, clearAll, refetch } = useBookmarks();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useInput((input, key) => {
    // Clear messages on input
    if (message) setMessage(null);
    
    if (key.escape) {
      if (confirmClear) {
        setConfirmClear(false);
      } else {
        onBack();
      }
      return;
    }
    
    // Confirm clear dialog
    if (confirmClear) {
      if (input === 'y' || input === 'Y') {
        const count = bookmarks.length;
        clearAll();
        setMessage({ type: 'success', text: `Cleared ${count} bookmark${count !== 1 ? 's' : ''}` });
        setConfirmClear(false);
        setSelectedIndex(0);
      } else {
        setConfirmClear(false);
      }
      return;
    }
    
    if ((input === 'x' || input === 'd') && bookmarks.length > 0) {
      // Remove bookmark
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
        <Text color={colors.primary}>
          <Spinner type="dots" />
        </Text>
        <Text color={colors.textMuted}> Loading bookmarks...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>
          Press <Text color={colors.primary}>[R]</Text> to retry or{' '}
          <Text color={colors.primary}>[Esc]</Text> to go back
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          {icons.bookmark} Bookmarks
        </Text>
        <Text color={colors.textMuted}> — {bookmarks.length} saved</Text>
      </Box>

      {/* Confirm Clear Dialog */}
      {confirmClear && (
        <Box marginBottom={1}>
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
        <ProblemTable
          problems={bookmarks}
          selectedIndex={selectedIndex}
          onSelect={onSelectProblem}
          onNavigate={setSelectedIndex}
          height={15}
        />
      ) : (
        <Panel title="No Bookmarks">
          <Box flexDirection="column" gap={1}>
            <Text color={colors.textMuted}>
              You haven't bookmarked any problems yet.
            </Text>
            <Text color={colors.textMuted}>
              Press <Text color={colors.primary}>[b]</Text> on any problem to bookmark it.
            </Text>
          </Box>
        </Panel>
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
