/**
 * Snapshot Screen
 * Save/restore/compare solution snapshots
 * Matches CLI `snapshot` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { snapshotStorage } from '../../storage/snapshots.js';
import { config } from '../../storage/config.js';
import { findSolutionFile, getLangSlugFromExtension } from '../../utils/fileUtils.js';
import { readFile, writeFile } from 'fs/promises';
import { extname, basename } from 'path';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

interface SnapshotScreenProps {
  problemId: string;
  problemTitle: string;
  onBack: () => void;
}

interface Snapshot {
  id: number;
  name: string;
  lines: number;
  createdAt: string;
}

type ViewMode = 'list' | 'save';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function SnapshotScreen({ problemId, problemTitle, onBack }: SnapshotScreenProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSnapshots = () => {
    const list = snapshotStorage.list(String(problemId));
    setSnapshots(list);
  };

  useEffect(() => {
    loadSnapshots();
  }, [problemId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const workDir = config.getWorkDir();
      const filePath = await findSolutionFile(workDir, String(problemId));

      if (!filePath) {
        setMessage({ type: 'error', text: 'No solution file found' });
        setLoading(false);
        return;
      }

      const code = await readFile(filePath, 'utf-8');
      const ext = extname(filePath).slice(1);
      const lang = getLangSlugFromExtension(ext) || ext;

      const result = snapshotStorage.save(String(problemId), problemTitle, code, lang, newName || undefined);

      if ('error' in result) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: `Saved snapshot: ${result.name}` });
        setViewMode('list');
        setNewName('');
        loadSnapshots();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    const snapshot = snapshots[selectedIndex];
    if (!snapshot) return;

    setLoading(true);
    try {
      const workDir = config.getWorkDir();
      const filePath = await findSolutionFile(workDir, String(problemId));

      if (!filePath) {
        setMessage({ type: 'error', text: 'No solution file found' });
        setLoading(false);
        return;
      }

      // Auto-backup before restore
      const currentCode = await readFile(filePath, 'utf-8');
      const ext = extname(filePath).slice(1);
      const lang = getLangSlugFromExtension(ext) || ext;
      snapshotStorage.save(String(problemId), problemTitle, currentCode, lang, `backup-before-restore-${Date.now()}`);

      // Get and restore snapshot code
      const snapshotData = snapshotStorage.get(String(problemId), String(snapshot.id));
      if (!snapshotData) {
        setMessage({ type: 'error', text: 'Snapshot not found' });
        setLoading(false);
        return;
      }

      const snapshotCode = snapshotStorage.getCode(String(problemId), snapshotData);
      await writeFile(filePath, snapshotCode, 'utf-8');

      setMessage({ type: 'success', text: `Restored: ${snapshot.name}` });
      loadSnapshots();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to restore' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const snapshot = snapshots[selectedIndex];
    if (!snapshot) return;

    const deleted = snapshotStorage.delete(String(problemId), String(snapshot.id));
    if (deleted) {
      setMessage({ type: 'success', text: `Deleted: ${snapshot.name}` });
      loadSnapshots();
      if (selectedIndex >= snapshots.length - 1) {
        setSelectedIndex(Math.max(0, snapshots.length - 2));
      }
    } else {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  useInput((input, key) => {
    if (message) setMessage(null);

    if (viewMode === 'save') {
      if (key.escape) {
        setViewMode('list');
        setNewName('');
        return;
      }
      if (key.return) {
        handleSave();
        return;
      }
      if (key.backspace || key.delete) {
        setNewName(prev => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setNewName(prev => prev + input);
      }
      return;
    }

    // List mode
    if (key.escape) {
      onBack();
      return;
    }
    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(snapshots.length - 1, prev + 1));
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (input === 's') {
      setViewMode('save');
    }
    if (key.return || input === 'r') {
      handleRestore();
    }
    if (input === 'd') {
      handleDelete();
    }
  });

  // Save mode
  if (viewMode === 'save') {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Box marginBottom={1}>
          <Text color={colors.primary} bold>📸 Save Snapshot</Text>
        </Box>

        <Panel title="New Snapshot">
          <Box flexDirection="column">
            <Box>
              <Text color={colors.textMuted}>Name (optional): </Text>
              <Text color={colors.success}>{newName}</Text>
              <Text color={colors.primary}>▌</Text>
            </Box>
            <Text color={colors.textDim}>Leave empty for auto-generated name</Text>
          </Box>
        </Panel>

        {message && (
          <Box marginTop={1}>
            <Text color={message.type === 'success' ? colors.success : colors.error}>
              {message.type === 'success' ? icons.check : icons.cross} {message.text}
            </Text>
          </Box>
        )}

        <Box marginTop={2}>
          <Text color={colors.textMuted}>
            {loading ? <><Spinner type="dots" /> Saving...</> : (
              <><Text color={colors.primary}>[Enter]</Text> Save <Text color={colors.primary}>[Esc]</Text> Cancel</>
            )}
          </Text>
        </Box>
      </Box>
    );
  }

  // List mode
  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>📸 Snapshots</Text>
        <Text color={colors.textMuted}> — Problem #{problemId}</Text>
      </Box>

      {/* Snapshot List */}
      <Panel title={`Snapshots (${snapshots.length})`}>
        {snapshots.length === 0 ? (
          <Text color={colors.textMuted}>No snapshots yet. Press [s] to save one.</Text>
        ) : (
          <Box flexDirection="column">
            {snapshots.map((snap, i) => {
              const isSelected = i === selectedIndex;
              return (
                <Box key={snap.id} gap={1} width="100%" flexDirection="row">
                  <Box width={3}>
                    <Text color={isSelected ? colors.primary : colors.textMuted}>
                      {isSelected ? icons.arrow : ' '}
                    </Text>
                  </Box>
                  <Box flexGrow={1} minWidth={0}>
                    <Text color={isSelected ? colors.textBright : colors.text} bold={isSelected} wrap="truncate-end">
                      {snap.id}. {snap.name}
                    </Text>
                  </Box>
                  <Box width={12}>
                     <Text color={colors.textDim}>{snap.lines} lines</Text>
                  </Box>
                  <Box width={15}>
                     <Text color={colors.textDim}>· {formatTimeAgo(snap.createdAt)}</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

      {/* Message */}
      {message && (
        <Box marginTop={1}>
          <Text color={message.type === 'success' ? colors.success : colors.error}>
            {message.type === 'success' ? icons.check : icons.cross} {message.text}
          </Text>
        </Box>
      )}

      {/* Controls */}
      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          {loading ? <><Spinner type="dots" /> Loading...</> : (
            <>
              <Text color={colors.primary}>[j/k]</Text> Navigate  
              <Text color={colors.primary}> [s]</Text> Save  
              {snapshots.length > 0 && <><Text color={colors.primary}> [Enter/r]</Text> Restore  </>}
              {snapshots.length > 0 && <><Text color={colors.primary}> [d]</Text> Delete  </>}
              <Text color={colors.primary}>[Esc]</Text> Back
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
}
