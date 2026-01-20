/**
 * Sync Screen
 * Git sync solutions to remote repository
 * Matches CLI `sync` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { config } from '../../storage/config.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

interface SyncScreenProps {
  onBack: () => void;
}

type SyncStatus = 'checking' | 'ready' | 'syncing' | 'success' | 'error' | 'no-changes';

function isGitInstalled(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isGitRepo(workDir: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: workDir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getRemoteUrl(workDir: string): string | null {
  try {
    const url = execSync('git config --get remote.origin.url', { cwd: workDir, encoding: 'utf-8' });
    return url.trim();
  } catch {
    return null;
  }
}

function getChangedFiles(workDir: string): string[] {
  try {
    const status = execSync('git status --porcelain', { cwd: workDir, encoding: 'utf-8' });
    return status.trim().split('\n').filter(l => l.length > 0);
  } catch {
    return [];
  }
}

export function SyncScreen({ onBack }: SyncScreenProps) {
  const [status, setStatus] = useState<SyncStatus>('checking');
  const [message, setMessage] = useState<string>('');
  const [changes, setChanges] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  const workDir = config.getWorkDir();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    setStatus('checking');

    if (!existsSync(workDir)) {
      setStatus('error');
      setMessage(`Work directory does not exist: ${workDir}`);
      return;
    }

    if (!isGitInstalled()) {
      setStatus('error');
      setMessage('Git is not installed');
      return;
    }

    if (!isGitRepo(workDir)) {
      setStatus('error');
      setMessage('Work directory is not a git repository. Initialize with: git init');
      return;
    }

    const remote = getRemoteUrl(workDir);
    setRepoUrl(remote);

    if (!remote) {
      setStatus('error');
      setMessage('No remote origin configured. Run: git remote add origin <url>');
      return;
    }

    const changedFiles = getChangedFiles(workDir);
    setChanges(changedFiles);

    if (changedFiles.length === 0) {
      setStatus('no-changes');
      setMessage('No changes to sync');
    } else {
      setStatus('ready');
      setMessage(`${changedFiles.length} file(s) to sync`);
    }
  };

  const performSync = () => {
    setStatus('syncing');
    setMessage('Syncing...');

    try {
      // Add all changes
      execSync('git add .', { cwd: workDir });

      // Commit
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const commitMsg = `Sync: ${changes.length} solutions - ${timestamp}`;
      execSync(`git commit -m "${commitMsg}"`, { cwd: workDir });

      // Push
      try {
        execSync('git push -u origin main', { cwd: workDir, stdio: 'ignore' });
      } catch {
        try {
          execSync('git push -u origin master', { cwd: workDir, stdio: 'ignore' });
        } catch {
          throw new Error('Failed to push. Check your git credentials.');
        }
      }

      setStatus('success');
      setMessage(`Successfully synced ${changes.length} file(s)`);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if ((key.return || input === 's') && status === 'ready') {
      performSync();
    }
    if (input === 'r') {
      checkStatus();
    }
  });

  const statusIcon = {
    checking: <Spinner type="dots" />,
    ready: '📦',
    syncing: <Spinner type="dots" />,
    success: icons.check,
    error: icons.cross,
    'no-changes': icons.check,
  }[status];

  const statusColor = {
    checking: colors.primary,
    ready: colors.warning,
    syncing: colors.primary,
    success: colors.success,
    error: colors.error,
    'no-changes': colors.success,
  }[status];

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>🔄 Git Sync</Text>
      </Box>

      {/* Workspace Info */}
      <Panel title="Workspace">
        <Box flexDirection="column">
          <Text color={colors.textMuted}>Directory: <Text color={colors.text}>{workDir}</Text></Text>
          <Text color={colors.textMuted}>Remote: <Text color={repoUrl ? colors.success : colors.error}>{repoUrl || 'Not configured'}</Text></Text>
        </Box>
      </Panel>

      {/* Status */}
      <Box marginTop={1}>
        <Panel title="Status">
          <Box gap={2}>
            <Text color={statusColor}>{statusIcon}</Text>
            <Text color={statusColor}>{message}</Text>
          </Box>
        </Panel>
      </Box>

      {/* Changed Files */}
      {changes.length > 0 && status === 'ready' && (
        <Box marginTop={1}>
          <Panel title={`Changed Files (${changes.length})`}>
            <Box flexDirection="column">
              {changes.slice(0, 10).map((file, i) => (
                <Box key={i} flexDirection="row" gap={2}>
                   <Box width={2}>
                     <Text color={file.startsWith(' M') ? colors.warning : file.startsWith('??') ? colors.success : colors.textMuted}>
                       {file.startsWith(' M') ? '📝' : file.startsWith('??') ? '➕' : '📄'}
                     </Text>
                   </Box>
                   <Box flexGrow={1}>
                      <Text color={colors.textMuted}>{file.slice(3)}</Text>
                   </Box>
                </Box>
              ))}
              {changes.length > 10 && (
                <Box marginTop={1}>
                  <Text color={colors.textDim}>... and {changes.length - 10} more</Text>
                </Box>
              )}
            </Box>
          </Panel>
        </Box>
      )}

      {/* Controls */}
      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          {status === 'ready' && <><Text color={colors.primary}>[Enter/s]</Text> Sync  </>}
          <Text color={colors.primary}>[r]</Text> Refresh  
          <Text color={colors.primary}> [Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
