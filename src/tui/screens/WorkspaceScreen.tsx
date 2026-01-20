/**
 * Workspace Screen
 * Manage workspaces directly in TUI
 */
import { Box, Text, useInput } from 'ink';
import { useState, useCallback } from 'react';
import { Panel } from '../components/Panel.js';
import { FilterPill } from '../components/FilterPill.js';
import { colors, icons } from '../theme.js';

interface Workspace {
  name: string;
  path: string;
  active: boolean;
}

// Mock workspace data for now - will hook up to real API later if needed
// The CLI currently manages this via config file which we can read
const mockWorkspaces: Workspace[] = [
  { name: 'default', path: './', active: true },
];

interface WorkspaceScreenProps {
  onBack: () => void;
}

export function WorkspaceScreen({ onBack }: WorkspaceScreenProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(mockWorkspaces);
  
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>
          {icons.folder} Workspaces
        </Text>
      </Box>

      {/* Workspace List */}
      <Panel title="Available Workspaces">
        <Box flexDirection="column" gap={1}>
          {workspaces.map((ws) => (
            <Box key={ws.name} justifyContent="space-between">
              <Box gap={1}>
                <Text color={ws.active ? colors.success : colors.textMuted}>
                  {ws.active ? icons.check : '  '}
                </Text>
                <Text color={ws.active ? colors.textBright : colors.text}>
                  {ws.name}
                </Text>
              </Box>
              <Text color={colors.textDim}>{ws.path}</Text>
            </Box>
          ))}
        </Box>
      </Panel>

      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          Managing workspaces in TUI is <Text color={colors.warning}>read-only</Text> for now.
        </Text>
        <Text color={colors.textMuted}>
          Use <Text color={colors.cyan}>leetcode workspace</Text> CLI command to manage.
        </Text>
      </Box>

      {/* Hints */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
