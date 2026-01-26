/**
 * Submissions Screen
 * Displays submission history for a problem
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { leetcodeClient } from '../../api/client.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';
import type { Submission } from '../../types.js';

interface SubmissionsScreenProps {
  problem: Problem;
  onBack: () => void;
}

export function SubmissionsScreen({ problem, onBack }: SubmissionsScreenProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useInput((input, key) => {
    if (key.escape || input === 'b') {
      onBack();
      return;
    }
    if (key.downArrow || input === 'j') {
      setSelectedIdx((prev) => Math.min(prev + 1, submissions.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    }
  });

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const result = await leetcodeClient.getSubmissionList(problem.titleSlug);
        setSubmissions(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [problem.titleSlug]);

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" /> Loading submissions...
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

  if (submissions.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.warning}>No submissions found for this problem.</Text>
        <Box marginTop={1}>
          <Text color={colors.textMuted}>Press [Esc] to go back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          {icons.folder} Submissions: {problem.title}
        </Text>
        <Text color={colors.textMuted}> ({submissions.length} total)</Text>
      </Box>

      <Panel title="Submission History">
        <Box flexDirection="column">
          {/* Header */}
          <Box marginBottom={1} flexDirection="row" width="100%">
            <Box width={12}><Text color={colors.textMuted} bold>Status</Text></Box>
            <Box width={12}><Text color={colors.textMuted} bold>Language</Text></Box>
            <Box width={10}><Text color={colors.textMuted} bold>Runtime</Text></Box>
            <Box width={10}><Text color={colors.textMuted} bold>Memory</Text></Box>
            <Box flexGrow={1}><Text color={colors.textMuted} bold>Date</Text></Box>
          </Box>

          {/* Submissions List */}
          {submissions.slice(0, 15).map((sub, idx) => {
            const isAC = sub.statusDisplay === 'Accepted';
            const isSelected = idx === selectedIdx;
            const date = new Date(parseInt(sub.timestamp) * 1000).toLocaleDateString();

            return (
              <Box key={sub.id} flexDirection="row" width="100%">
                <Box width={12}>
                  <Text color={isAC ? colors.success : colors.error} inverse={isSelected}>
                    {isAC ? icons.check : icons.cross} {isAC ? 'AC' : 'WA'}
                  </Text>
                </Box>
                <Box width={12}>
                  <Text color={colors.text} inverse={isSelected}>{sub.lang}</Text>
                </Box>
                <Box width={10}>
                  <Text color={colors.text} inverse={isSelected}>{sub.runtime}</Text>
                </Box>
                <Box width={10}>
                  <Text color={colors.text} inverse={isSelected}>{sub.memory}</Text>
                </Box>
                <Box flexGrow={1}>
                  <Text color={colors.textMuted} inverse={isSelected}>{date}</Text>
                </Box>
              </Box>
            );
          })}

          {submissions.length > 15 && (
            <Text color={colors.textMuted} dimColor>
              ... and {submissions.length - 15} more
            </Text>
          )}
        </Box>
      </Panel>

      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          Navigate with [j/k], Press [Esc] to go back
        </Text>
      </Box>
    </Box>
  );
}
