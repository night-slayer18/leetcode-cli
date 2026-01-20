/**
 * Notes Screen
 * View and manage problem notes within the TUI
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../../storage/config.js';
import { openInEditor } from '../../utils/editor.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';

interface NotesScreenProps {
  problem: Problem;
  onBack: () => void;
}

export function NotesScreen({ problem, onBack }: NotesScreenProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const notesDir = join(config.getWorkDir(), '.notes');
  const notePath = join(notesDir, `${problem.id}.md`);

  useInput((input, key) => {
    if (key.escape || input === 'b') {
      onBack();
      return;
    }
    if (input === 'e' && !editing) {
      handleEdit();
    }
  });

  const loadNotes = async () => {
    try {
      if (existsSync(notePath)) {
        const text = await readFile(notePath, 'utf-8');
        setContent(text);
      } else {
        setContent(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    setEditing(true);
    try {
      // Create notes dir if needed
      if (!existsSync(notesDir)) {
        await mkdir(notesDir, { recursive: true });
      }
      
      // Create template if file doesn't exist
      if (!existsSync(notePath)) {
        const template = `# ${problem.id}. ${problem.title}

**Difficulty:** ${problem.difficulty}
**URL:** https://leetcode.com/problems/${problem.titleSlug}/

---

## Approach

<!-- Describe your approach to solving this problem -->


## Key Insights

<!-- What patterns or techniques did you use? -->


## Complexity

- **Time:** O(?)
- **Space:** O(?)


## Code Notes

<!-- Any notes about the implementation -->


## Mistakes / Learnings

<!-- What did you learn from this problem? -->

`;
        await writeFile(notePath, template, 'utf-8');
      }
      
      // Open in editor
      await openInEditor(notePath);
      
      // Reload after editing
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit notes');
    } finally {
      setEditing(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" /> Loading notes...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>Press [Esc] to go back</Text>
      </Box>
    );
  }

  if (editing) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" /> Opening notes in editor...
        </Text>
        <Text color={colors.textMuted}>Close the editor to return to TUI</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          {icons.code} Notes: {problem.title}
        </Text>
      </Box>

      {content ? (
        <Panel title="Your Notes">
          <Box flexDirection="column">
            <Text color={colors.text}>
              {content.slice(0, 1500)}
              {content.length > 1500 && '...'}
            </Text>
          </Box>
        </Panel>
      ) : (
        <Box flexDirection="column">
          <Text color={colors.warning}>No notes yet for this problem.</Text>
          <Text color={colors.textMuted}>Press [e] to create notes.</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          Press [e] to edit notes in your editor, [Esc] to go back
        </Text>
      </Box>
    </Box>
  );
}
