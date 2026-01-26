/**
 * Hint Screen
 * Displays problem hints within the TUI
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { leetcodeClient } from '../../api/client.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import type { Problem } from '../components/ProblemTable.js';
import striptags from 'striptags';

interface HintScreenProps {
  problem: Problem;
  onBack: () => void;
}

export function HintScreen({ problem, onBack }: HintScreenProps) {
  const [hints, setHints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(1); // Show one hint at a time

  useInput((input, key) => {
    if (key.escape || input === 'b') {
      onBack();
      return;
    }
    // Show next hint
    if ((key.return || input === 'n') && visibleCount < hints.length) {
      setVisibleCount((prev) => prev + 1);
    }
    // Show all hints
    if (input === 'a') {
      setVisibleCount(hints.length);
    }
  });

  useEffect(() => {
    const fetchHints = async () => {
      try {
        const problemDetail = await leetcodeClient.getProblem(problem.titleSlug);
        setHints(problemDetail.hints || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hints');
      } finally {
        setLoading(false);
      }
    };
    fetchHints();
  }, [problem.titleSlug]);

  // Clean HTML from hints (CodeQL fix)
  const cleanHtml = (html: string): string => {
    // 1. Handle code blocks first to preserve content
    let content = html.replace(/<[/\s]*code[^>]*>/gi, '`');
    
    // 2. Handle line breaks
    content = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n');

    // 3. Strip all other tags securely
    content = striptags(content);

    // 4. Decode entities safely
    content = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    return content.trim();
  };

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.primary}>
          <Spinner type="dots" /> Loading hints...
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

  if (hints.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={colors.warning}>{icons.star} No hints available for this problem.</Text>
        <Text color={colors.textMuted}>Try working through the problem description and examples first!</Text>
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
          {icons.star} Hints: {problem.title}
        </Text>
      </Box>

      {hints.slice(0, visibleCount).map((hint, idx) => (
        <Box key={idx} marginBottom={1}>
          <Panel title={`Hint ${idx + 1}/${hints.length}`}>
            <Text color={colors.text}>{cleanHtml(hint)}</Text>
          </Panel>
        </Box>
      ))}

      <Box marginTop={1}>
        {visibleCount < hints.length ? (
          <Text color={colors.textMuted}>
            Press [Enter] or [n] for next hint ({hints.length - visibleCount} remaining), [a] for all, [Esc] to go back
          </Text>
        ) : (
          <Text color={colors.success}>
            {icons.check} All hints revealed! Press [Esc] to go back
          </Text>
        )}
      </Box>
    </Box>
  );
}
