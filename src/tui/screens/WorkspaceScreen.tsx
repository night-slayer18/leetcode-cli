/**
 * Workspace Screen
 * Manage workspaces with list, create, switch, delete
 * Matches CLI `workspace` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import { workspaceStorage } from '../../storage/workspaces.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import { homedir } from 'os';
import { join } from 'path';

interface Workspace {
  name: string;
  workDir: string;
  lang: string;
  isActive: boolean;
}

type ViewMode = 'list' | 'create';

interface WorkspaceScreenProps {
  onBack: () => void;
}

export function WorkspaceScreen({ onBack }: WorkspaceScreenProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load workspaces
  const loadWorkspaces = () => {
    const names = workspaceStorage.list();
    const active = workspaceStorage.getActive();
    const ws = names.map(name => {
      const config = workspaceStorage.getConfig(name);
      return {
        name,
        workDir: config.workDir,
        lang: config.lang,
        isActive: name === active,
      };
    });
    setWorkspaces(ws);
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleSwitch = (name: string) => {
    if (workspaceStorage.setActive(name)) {
      setMessage({ type: 'success', text: `Switched to workspace "${name}"` });
      loadWorkspaces();
    } else {
      setMessage({ type: 'error', text: 'Failed to switch workspace' });
    }
  };

  const handleDelete = (name: string) => {
    if (name === 'default') {
      setMessage({ type: 'error', text: 'Cannot delete the default workspace' });
      return;
    }
    if (workspaceStorage.delete(name)) {
      setMessage({ type: 'success', text: `Deleted workspace "${name}"` });
      loadWorkspaces();
      if (selectedIndex >= workspaces.length - 1) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }
    } else {
      setMessage({ type: 'error', text: 'Failed to delete workspace' });
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      setMessage({ type: 'error', text: 'Workspace name cannot be empty' });
      return;
    }
    if (workspaceStorage.exists(newName.trim())) {
      setMessage({ type: 'error', text: `Workspace "${newName}" already exists` });
      return;
    }
    const workDir = join(homedir(), 'leetcode', newName.trim());
    const success = workspaceStorage.create(newName.trim(), { workDir, lang: 'typescript' });
    if (success) {
      setMessage({ type: 'success', text: `Created workspace "${newName}"` });
      setNewName('');
      setViewMode('list');
      loadWorkspaces();
    } else {
      setMessage({ type: 'error', text: 'Failed to create workspace' });
    }
  };

  useInput((input, key) => {
    // Clear message after any input
    if (message) setMessage(null);

    if (viewMode === 'create') {
      if (key.escape) {
        setViewMode('list');
        setNewName('');
        return;
      }
      if (key.return) {
        handleCreate();
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
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => Math.min(workspaces.length - 1, prev + 1));
    }
    if (key.return || input === 'u') {
      const ws = workspaces[selectedIndex];
      if (ws && !ws.isActive) {
        handleSwitch(ws.name);
      }
    }
    if (input === 'n') {
      setViewMode('create');
    }
    if (input === 'd') {
      const ws = workspaces[selectedIndex];
      if (ws) {
        handleDelete(ws.name);
      }
    }
  });

  // Create mode
  if (viewMode === 'create') {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Box marginBottom={1}>
          <Text color={colors.primary} bold>{icons.folder} Create Workspace</Text>
        </Box>
        
        <Panel title="New Workspace">
          <Box flexDirection="column" gap={1}>
            <Box>
              <Text color={colors.textMuted}>Name: </Text>
              <Text color={colors.success}>{newName}</Text>
              <Text color={colors.primary}>▌</Text>
            </Box>
            <Box>
              <Text color={colors.textDim}>
                Work Dir: ~/leetcode/{newName || '<name>'}
              </Text>
            </Box>
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
            <Text color={colors.primary}>[Enter]</Text> Create  
            <Text color={colors.primary}> [Esc]</Text> Cancel
          </Text>
        </Box>
      </Box>
    );
  }

  // List mode
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>{icons.folder} Workspaces</Text>
      </Box>

      <Panel title="Available Workspaces">
        <Box flexDirection="column" width="100%">
           {/* Header Row */}
           <Box width="100%" flexDirection="row" marginBottom={1} borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderBottom={true} borderColor={colors.textMuted}>
              <Box width={3} />
              <Box width={3} />
              <Box width={20}><Text color={colors.textMuted} bold>Name</Text></Box>
              <Box flexGrow={1}><Text color={colors.textMuted} bold>Path</Text></Box>
           </Box>

          {workspaces.length === 0 ? (
            <Text color={colors.textMuted}>No workspaces found</Text>
          ) : (
            workspaces.map((ws, i) => {
              const isSelected = i === selectedIndex;
              return (
                <Box key={ws.name} width="100%" flexDirection="row" paddingX={0}>
                  <Box width={3}>
                    <Text color={isSelected ? colors.primary : colors.textMuted}>
                      {isSelected ? icons.arrow : ' '}
                    </Text>
                  </Box>
                  <Box width={3}>
                     <Text color={ws.isActive ? colors.success : colors.textMuted}>
                      {ws.isActive ? icons.check : ' '}
                    </Text>
                  </Box>
                  <Box width={20}>
                    <Text color={isSelected ? colors.textBright : colors.text} bold={isSelected}>
                      {ws.name}
                    </Text>
                  </Box>
                  <Box flexGrow={1}>
                     <Text color={colors.textDim}>{ws.workDir}</Text>
                  </Box>
                </Box>
              );
            })
          )}
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
          <Text color={colors.primary}>[j/k]</Text> Navigate  
          <Text color={colors.primary}> [Enter/u]</Text> Use  
          <Text color={colors.primary}> [n]</Text> New  
          <Text color={colors.primary}> [d]</Text> Delete  
          <Text color={colors.primary}> [Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
