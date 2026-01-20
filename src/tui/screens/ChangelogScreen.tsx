/**
 * Changelog Screen
 * Display release notes from GitHub
 * Matches CLI `changelog` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import got from 'got';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

interface ChangelogScreenProps {
  onBack: () => void;
}

interface VersionEntry {
  version: string;
  content: string;
  hasBreakingChanges: boolean;
}

const RELEASES_URL = 'https://raw.githubusercontent.com/night-slayer18/leetcode-cli/main/docs/releases.md';

function parseReleases(content: string): VersionEntry[] {
  const entries: VersionEntry[] = [];
  const versionRegex = /^## v?([\d.]+)/gm;
  const matches = [...content.matchAll(versionRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const version = `v${match[1]}`;
    const startIndex = match.index! + match[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const versionContent = content.slice(startIndex, endIndex).trim();
    const hasBreakingChanges = versionContent.includes('⚠️ Breaking Change');

    entries.push({ version, content: versionContent, hasBreakingChanges });
  }

  return entries;
}

export function ChangelogScreen({ onBack }: ChangelogScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releases, setReleases] = useState<VersionEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    const fetchChangelog = async () => {
      setLoading(true);
      try {
        const content = await got(RELEASES_URL, { timeout: { request: 10000 } }).text();
        const entries = parseReleases(content);
        setReleases(entries);
      } catch {
        setError('Failed to fetch changelog');
      } finally {
        setLoading(false);
      }
    };
    fetchChangelog();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (viewMode === 'detail') {
        setViewMode('list');
        setScrollOffset(0);
      } else {
        onBack();
      }
      return;
    }

    if (viewMode === 'list') {
      if (input === 'j' || key.downArrow) {
        setSelectedIndex(prev => Math.min(releases.length - 1, prev + 1));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      }
      if (key.return) {
        setViewMode('detail');
        setScrollOffset(0);
      }
    } else {
      // Detail view scrolling
      const lines = releases[selectedIndex]?.content.split('\n') || [];
      if (input === 'j' || key.downArrow) {
        setScrollOffset(prev => Math.min(prev + 1, Math.max(0, lines.length - 15)));
      }
      if (input === 'k' || key.upArrow) {
        setScrollOffset(prev => Math.max(0, prev - 1));
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}><Spinner type="dots" /></Text>
        <Text color={colors.textMuted}> Fetching changelog...</Text>
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

  // Detail view
  if (viewMode === 'detail' && releases[selectedIndex]) {
    const entry = releases[selectedIndex];
    const lines = entry.content.split('\n');
    const visibleLines = lines.slice(scrollOffset, scrollOffset + 18);

    return (
      <Box flexDirection="column" flexGrow={1}>
        <Box marginBottom={1}>
          <Text color={entry.hasBreakingChanges ? colors.error : colors.primary} bold>
            {entry.version} {entry.hasBreakingChanges && '⚠️ BREAKING'}
          </Text>
        </Box>

        <Panel title={`Content (${scrollOffset + 1}-${Math.min(scrollOffset + 18, lines.length)} of ${lines.length})`}>
          <Box flexDirection="column">
            {visibleLines.map((line, i) => {
              const getColor = () => {
                if (line.startsWith('### ')) return colors.warning;
                if (line.startsWith('- **')) return colors.cyan;
                if (line.startsWith('- ')) return colors.text;
                return colors.textMuted;
              };
              
              return (
                <Text key={i} color={getColor()}>
                  {line.replace('### ', '').replace('- **', '• ').substring(0, 70)}
                </Text>
              );
            })}
          </Box>
        </Panel>

        <Box marginTop={2}>
          <Text color={colors.textMuted}>
            <Text color={colors.primary}>[j/k]</Text> Scroll <Text color={colors.primary}>[Esc]</Text> Back to list
          </Text>
        </Box>
      </Box>
    );
  }

  // List view
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>📋 Changelog</Text>
        <Text color={colors.textMuted}> — {releases.length} releases</Text>
      </Box>

      <Panel title="Releases">
        <Box flexDirection="column">
          {releases.slice(0, 15).map((entry, i) => {
            const isSelected = i === selectedIndex;
            return (
              <Box key={entry.version} gap={1}>
                <Text color={isSelected ? colors.primary : colors.textMuted}>
                  {isSelected ? icons.arrow : ' '}
                </Text>
                <Text color={isSelected ? colors.textBright : colors.text} bold={isSelected}>
                  {entry.version.padEnd(10)}
                </Text>
                {entry.hasBreakingChanges && (
                  <Text color={colors.error}>⚠️ Breaking</Text>
                )}
              </Box>
            );
          })}
        </Box>
      </Panel>

      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          <Text color={colors.primary}>[j/k]</Text> Navigate <Text color={colors.primary}>[Enter]</Text> View <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
