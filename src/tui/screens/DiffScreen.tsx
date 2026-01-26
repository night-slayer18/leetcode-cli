/**
 * Diff Screen
 * Compare current solution with past submissions
 * Matches CLI `diff` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { config } from '../../storage/config.js';
import { findSolutionFile } from '../../utils/fileUtils.js';
import { readFile } from 'fs/promises';
import { diffLines } from 'diff';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

interface DiffScreenProps {
  problemId: string;
  problemSlug: string;
  onBack: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export function DiffScreen({ problemId, problemSlug, onBack }: DiffScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [comparedCode, setComparedCode] = useState<string>('');
  const [comparedLabel, setComparedLabel] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [stats, setStats] = useState({ added: 0, removed: 0 });

  useEffect(() => {
    const fetchDiff = async () => {
      setLoading(true);
      setError(null);

      try {
        const creds = credentials.get();
        if (!creds) {
          setError('Please login first');
          setLoading(false);
          return;
        }
        leetcodeClient.setCredentials(creds);

        // Find current solution file
        const workDir = config.getWorkDir();
        const filePath = await findSolutionFile(workDir, String(problemId));

        if (!filePath) {
          setError(`No solution file found for problem ${problemId}`);
          setLoading(false);
          return;
        }

        // Read current code
        const code = await readFile(filePath, 'utf-8');
        setCurrentCode(code);

        // Fetch last accepted submission
        const submissions = await leetcodeClient.getSubmissionList(problemSlug, 50);
        const accepted = submissions.find(s => s.statusDisplay === 'Accepted');

        if (!accepted) {
          setError('No accepted submissions found');
          setLoading(false);
          return;
        }

        // Get submission details
        const details = await leetcodeClient.getSubmissionDetails(parseInt(accepted.id, 10));
        setComparedCode(details.code);
        setComparedLabel('Last Accepted Submission');

        // Calculate diff
        const diff = diffLines(code, details.code);
        const lines: DiffLine[] = [];
        let added = 0;
        let removed = 0;

        for (const part of diff) {
          const partLines = part.value.split('\n').filter(l => l !== '');
          for (const line of partLines) {
            if (part.added) {
              lines.push({ type: 'added', content: line });
              added++;
            } else if (part.removed) {
              lines.push({ type: 'removed', content: line });
              removed++;
            } else {
              lines.push({ type: 'unchanged', content: line });
            }
          }
        }

        setDiffResult(lines);
        setStats({ added, removed });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load diff');
      } finally {
        setLoading(false);
      }
    };

    fetchDiff();
  }, [problemId, problemSlug]);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    // Scroll
    if (input === 'j' || key.downArrow) {
      setScrollOffset(prev => Math.min(prev + 1, Math.max(0, diffResult.length - 15)));
    }
    if (input === 'k' || key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (input === 'g') {
      setScrollOffset(0);
    }
    if (input === 'G') {
      setScrollOffset(Math.max(0, diffResult.length - 15));
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}><Spinner type="dots" /></Text>
        <Text color={colors.textMuted}> Loading diff...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.error}>{icons.cross} {error}</Text>
        <Text color={colors.textMuted}>Press [Esc] to go back</Text>
      </Box>
    );
  }

  const visibleLines = diffResult.slice(scrollOffset, scrollOffset + 20);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>📊 Diff: Your Solution → {comparedLabel}</Text>
      </Box>

      {/* Stats */}
      <Box marginBottom={1}>
        <Text color={colors.success}>+{stats.added} added</Text>
        <Text color={colors.textMuted}> · </Text>
        <Text color={colors.error}>-{stats.removed} removed</Text>
      </Box>

      {/* Diff Content */}
      <Panel title={`Lines ${scrollOffset + 1}-${Math.min(scrollOffset + 20, diffResult.length)} of ${diffResult.length}`}>
        <Box flexDirection="column">
          {visibleLines.map((line, i) => (
            <Box key={i} width="100%">
              <Text color={line.type === 'added' ? colors.success : line.type === 'removed' ? colors.error : colors.textDim} wrap="truncate-end">
                {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                {line.content}
              </Text>
            </Box>
          ))}
        </Box>
      </Panel>

      {/* Controls */}
      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          <Text color={colors.primary}>[j/k]</Text> Scroll  
          <Text color={colors.primary}> [g/G]</Text> Top/Bottom  
          <Text color={colors.primary}> [Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
