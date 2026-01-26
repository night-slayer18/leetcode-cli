/**
 * Test Result Screen
 * Runs tests and displays results within the TUI
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';
import { leetcodeClient } from '../../api/client.js';
import { config } from '../../storage/config.js';
import { findSolutionFile, getLangSlugFromExtension } from '../../utils/fileUtils.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';
import type { TestResult } from '../../types.js';

interface TestResultScreenProps {
  problem: Problem;
  onBack: () => void;
}

type TestState = 'loading' | 'success' | 'error';

export function TestResultScreen({ problem, onBack }: TestResultScreenProps) {
  const [state, setState] = useState<TestState>('loading');
  const [status, setStatus] = useState('Finding solution file...');
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape || input === 'b') {
      onBack();
    }
    if (input === 'r' && state !== 'loading') {
      // Re-run tests
      setState('loading');
      setStatus('Finding solution file...');
      setResult(null);
      setError(null);
      runTests();
    }
  });

  const runTests = async () => {
    try {
      const workDir = config.getWorkDir();
      const problemId = problem.id.toString();

      // Find solution file
      const filePath = await findSolutionFile(workDir, problemId);
      if (!filePath) {
        setError(`No solution file found for problem ${problemId}. Run 'pick' first.`);
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
      const testcases = problemDetail.exampleTestcases ?? problemDetail.sampleTestCase;

      setStatus('Running tests...');
      const testResult = await leetcodeClient.testSolution(
        problem.titleSlug,
        code,
        lang,
        testcases,
        problemDetail.questionId
      );

      setResult(testResult);
      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
      setState('error');
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  // Loading state
  if (state === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text color={colors.primary} bold>
            {icons.target} Testing: {problem.title}
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
            {icons.cross} Test Failed
          </Text>
        </Box>
        <Panel title="Error">
          <Text color={colors.error}>{error}</Text>
        </Panel>
        <Box marginTop={1}>
          <Text color={colors.textMuted}>
            Press [r] to retry, [Esc] to go back
          </Text>
        </Box>
      </Box>
    );
  }

  // Success state - show results
  const allPassed = result?.correct_answer === true;
  const hasCompileError = !!result?.compile_error;
  const hasRuntimeError = !!result?.runtime_error;

  return (
    <Box flexDirection="column" gap={1} padding={1} flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={allPassed ? colors.success : colors.error} bold>
          {allPassed ? `${icons.check} All Tests Passed!` : `${icons.cross} Tests Failed`}
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
        </Panel>
      )}

      {/* Test Cases Results - Fills available space */}
      {!hasCompileError && !hasRuntimeError && result && (
        <Box flexGrow={1} flexDirection="column">
            <Panel title="Test Results" flexGrow={1}>
            <Box flexDirection="column" gap={1}>
                {(result.code_answer ?? []).map((output, idx) => {
                const expected = result.expected_code_answer?.[idx] ?? '';
                const passed = output === expected;
                return (
                    <Box key={idx} flexDirection="column" marginBottom={1}>
                    <Text color={colors.textBright} bold>
                        Test Case {idx + 1}: {passed ? (
                        <Text color={colors.success}>{icons.check} Passed</Text>
                        ) : (
                        <Text color={colors.error}>{icons.cross} Failed</Text>
                        )}
                    </Text>
                    <Box marginLeft={2} flexDirection="column">
                        <Text color={colors.textMuted}>
                        Output: <Text color={passed ? colors.success : colors.error}>{output}</Text>
                        </Text>
                        <Text color={colors.textMuted}>
                        Expected: <Text color={colors.success}>{expected}</Text>
                        </Text>
                    </Box>
                    </Box>
                );
                })}
            </Box>
            </Panel>
        </Box>
      )}

      {/* Stdout */}
      {result?.std_output_list && result.std_output_list.filter(s => s).length > 0 && (
        <Box marginTop={1}>
          <Panel title="Stdout">
            <Box flexDirection="column">
              {result.std_output_list.filter(s => s).map((out, idx) => (
                <Text key={idx} color={colors.textMuted}>{out}</Text>
              ))}
            </Box>
          </Panel>
        </Box>
      )}

      {/* Actions */}
      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          Press [r] to re-run, [Esc] to go back
        </Text>
      </Box>
    </Box>
  );
}
