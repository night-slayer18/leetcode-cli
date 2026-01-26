/**
 * Submit Result Screen
 * Submits solution and displays results within the TUI
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';
import { leetcodeClient } from '../../api/client.js';
import { config } from '../../storage/config.js';
import { timerStorage } from '../../storage/timer.js';
import { findSolutionFile, getLangSlugFromExtension } from '../../utils/fileUtils.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';
import type { SubmissionResult } from '../../types.js';

interface SubmitResultScreenProps {
  problem: Problem;
  onBack: () => void;
}

type SubmitState = 'loading' | 'success' | 'error';

export function SubmitResultScreen({ problem, onBack }: SubmitResultScreenProps) {
  const [state, setState] = useState<SubmitState>('loading');
  const [status, setStatus] = useState('Finding solution file...');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerInfo, setTimerInfo] = useState<{ time: string; withinLimit: boolean } | null>(null);

  useInput((input, key) => {
    if (key.escape || input === 'b') {
      onBack();
    }
  });

  const runSubmit = async () => {
    try {
      const workDir = config.getWorkDir();
      const problemId = problem.id.toString();

      // Find solution file
      const filePath = await findSolutionFile(workDir, problemId);
      if (!filePath) {
        setError(`No solution file found for problem ${problemId}. Run 'pick' to create it, or check your file naming.`);
        setState('error');
        return;
      }

      if (!existsSync(filePath)) {
        setError(`File not found: ${filePath}`);
        setState('error');
        return;
      }

      // Get language from extension
      const fileName = basename(filePath);
      const ext = fileName.split('.').pop()!;
      const lang = getLangSlugFromExtension(ext);

      if (!lang) {
        setError(`Unsupported file extension: .${ext}`);
        setState('error');
        return;
      }

      setStatus('Reading solution file...');
      const code = await readFile(filePath, 'utf-8');

      setStatus('Fetching problem details...');
      const problemDetail = await leetcodeClient.getProblem(problem.titleSlug);

      setStatus('Submitting solution...');
      const submitResult = await leetcodeClient.submitSolution(
        problem.titleSlug,
        code,
        lang,
        problemDetail.questionId
      );

      setResult(submitResult);
      setState('success');

      // Handle timer if active and submission was accepted
      if (submitResult.status_msg === 'Accepted') {
        const activeTimer = timerStorage.getActiveTimer();
        if (activeTimer && activeTimer.problemId === problemId) {
          const timerResult = timerStorage.stopTimer();
          if (timerResult) {
            timerStorage.recordSolveTime(
              problemId,
              problem.title,
              problem.difficulty,
              timerResult.durationSeconds,
              activeTimer.durationMinutes
            );

            const mins = Math.floor(timerResult.durationSeconds / 60);
            const secs = timerResult.durationSeconds % 60;
            const timeStr = `${mins}m ${secs}s`;
            const withinLimit = timerResult.durationSeconds <= activeTimer.durationMinutes * 60;

            setTimerInfo({ time: timeStr, withinLimit });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setState('error');
    }
  };

  useEffect(() => {
    runSubmit();
  }, []);

  // Loading state
  if (state === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color={colors.primary} bold>
            {icons.lightning} Submitting: {problem.title}
          </Text>
        </Box>
        <Box>
          <Text color={colors.primary}>
            <Spinner type="dots" /> {status}
          </Text>
        </Box>
      </Box>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color={colors.error} bold>
            {icons.cross} Submission Failed
          </Text>
        </Box>
        <Panel title="Error">
          <Text color={colors.error}>{error}</Text>
        </Panel>
        <Box marginTop={1}>
          <Text color={colors.textMuted}>
            Press [Esc] to go back
          </Text>
        </Box>
      </Box>
    );
  }

  // Success state - show results
  const isAccepted = result?.status_msg === 'Accepted';
  const hasCompileError = !!result?.compile_error;
  const hasRuntimeError = !!result?.runtime_error;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={isAccepted ? colors.success : colors.error} bold>
          {isAccepted ? `${icons.check} Accepted!` : `${icons.cross} ${result?.status_msg || 'Failed'}`}
        </Text>
        <Text color={colors.textMuted}> - {problem.title}</Text>
      </Box>

      {/* Compile Error */}
      {hasCompileError && (
        <Panel title="Compile Error">
          <Text color={colors.error}>{result?.compile_error}</Text>
        </Panel>
      )}

      {/* Runtime Error */}
      {hasRuntimeError && (
        <Panel title="Runtime Error">
          <Text color={colors.error}>{result?.runtime_error}</Text>
          {result?.last_testcase && (
            <Box marginTop={1}>
              <Text color={colors.textMuted}>Last testcase: {result.last_testcase}</Text>
            </Box>
          )}
        </Panel>
      )}

      {/* Accepted Results */}
      {isAccepted && result && (
        <Panel title="Performance">
          <Box flexDirection="column">
            <Text color={colors.textMuted}>
              Runtime: <Text color={colors.success}>{result.status_runtime}</Text>
              <Text color={colors.textMuted}> (beats {result.runtime_percentile?.toFixed(1) ?? 'N/A'}%)</Text>
            </Text>
            <Text color={colors.textMuted}>
              Memory: <Text color={colors.success}>{result.status_memory}</Text>
              <Text color={colors.textMuted}> (beats {result.memory_percentile?.toFixed(1) ?? 'N/A'}%)</Text>
            </Text>
          </Box>
        </Panel>
      )}

      {/* Wrong Answer / Other */}
      {!isAccepted && !hasCompileError && !hasRuntimeError && result && (
        <Panel title="Details">
          <Box flexDirection="column">
            <Text color={colors.textMuted}>
              Passed: {result.total_correct}/{result.total_testcases} testcases
            </Text>
            {result.code_output && (
              <Text color={colors.textMuted}>
                Your Output: <Text color={colors.error}>{result.code_output}</Text>
              </Text>
            )}
            {result.expected_output && (
              <Text color={colors.textMuted}>
                Expected: <Text color={colors.success}>{result.expected_output}</Text>
              </Text>
            )}
            {result.last_testcase && (
              <Text color={colors.textMuted}>
                Failed testcase: {result.last_testcase}
              </Text>
            )}
          </Box>
        </Panel>
      )}

      {/* Timer Info */}
      {timerInfo && (
        <Box marginTop={1}>
          <Panel title="Timer Result">
            <Text color={timerInfo.withinLimit ? colors.success : colors.warning}>
              Solved in {timerInfo.time}
              {timerInfo.withinLimit ? ' ✓ Within time limit!' : ' ⚠ Exceeded time limit'}
            </Text>
          </Panel>
        </Box>
      )}

      {/* Actions */}
      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          Press [Esc] to go back
        </Text>
      </Box>
    </Box>
  );
}
