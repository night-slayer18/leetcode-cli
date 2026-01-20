/**
 * Update Screen
 * Check for updates and provide upgrade instructions
 * Matches CLI `update` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import got from 'got';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface UpdateScreenProps {
  onBack: () => void;
}

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@night-slayer18/leetcode-cli/latest';
const PACKAGE_NAME = '@night-slayer18/leetcode-cli';

function getCurrentVersion(): string {
  const candidates = [
    join(__dirname, '../../../package.json'),
    join(__dirname, '../../../../package.json'),
  ];

  for (const path of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(path, 'utf-8'));
      if (pkg.version) return pkg.version;
    } catch {
      continue;
    }
  }
  return 'unknown';
}

function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = latest.replace(/^v/, '').split('.').map(Number);
  const currentParts = current.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
    const l = latestParts[i] || 0;
    const c = currentParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

function hasMajorBump(current: string, latest: string): boolean {
  const currentMajor = parseInt(current.replace(/^v/, '').split('.')[0], 10);
  const latestMajor = parseInt(latest.replace(/^v/, '').split('.')[0], 10);
  return latestMajor > currentMajor;
}

export function UpdateScreen({ onBack }: UpdateScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [hasBreaking, setHasBreaking] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      setLoading(true);
      try {
        const current = getCurrentVersion();
        setCurrentVersion(current);

        const response = await got(NPM_REGISTRY_URL, { timeout: { request: 10000 } }).json<{ version: string }>();
        const latest = response.version;
        setLatestVersion(latest);

        const newer = isNewerVersion(latest, current);
        setUpdateAvailable(newer);
        setHasBreaking(newer && hasMajorBump(current, latest));
      } catch {
        setError('Failed to check for updates');
      } finally {
        setLoading(false);
      }
    };
    checkUpdate();
  }, []);

  useInput((_, key) => {
    if (key.escape) {
      onBack();
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}><Spinner type="dots" /></Text>
        <Text color={colors.textMuted}> Checking for updates...</Text>
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

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>🚀 Update Check</Text>
      </Box>

      <Panel title="Version Info">
        <Box flexDirection="column" gap={1}>
          <Box>
            <Text color={colors.textMuted}>Current: </Text>
            <Text color={colors.text}>{currentVersion}</Text>
          </Box>
          <Box>
            <Text color={colors.textMuted}>Latest:  </Text>
            <Text color={updateAvailable ? colors.success : colors.text}>{latestVersion}</Text>
          </Box>
        </Box>
      </Panel>

      <Box marginTop={1}>
        <Panel title="Status">
          {updateAvailable ? (
            <Box flexDirection="column" gap={1}>
              <Text color={colors.success}>{icons.check} Update available!</Text>
              {hasBreaking && (
                <Text color={colors.warning}>⚠️ This update contains breaking changes</Text>
              )}
              <Box marginTop={1} flexDirection="column">
                <Text color={colors.textMuted}>To update, run:</Text>
                <Text color={colors.cyan}>  npm update -g {PACKAGE_NAME}</Text>
              </Box>
              {hasBreaking && (
                <Box marginTop={1}>
                  <Text color={colors.textMuted}>Run </Text>
                  <Text color={colors.cyan}>leetcode changelog</Text>
                  <Text color={colors.textMuted}> to review changes</Text>
                </Box>
              )}
            </Box>
          ) : (
            <Text color={colors.success}>{icons.check} You're on the latest version!</Text>
          )}
        </Panel>
      </Box>

      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
