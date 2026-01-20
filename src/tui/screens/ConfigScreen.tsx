/**
 * Config Screen
 * View and edit CLI configuration
 * Matches CLI `config` command functionality
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import { config } from '../../storage/config.js';
import { credentials } from '../../storage/credentials.js';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';
import type { SupportedLanguage } from '../../types.js';

interface ConfigScreenProps {
  onBack: () => void;
}

type EditField = 'language' | 'editor' | 'workDir' | 'repo' | null;

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'typescript', 'javascript', 'python3', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'kotlin', 'swift'
];

export function ConfigScreen({ onBack }: ConfigScreenProps) {
  const [currentConfig, setCurrentConfig] = useState({
    language: 'typescript' as SupportedLanguage,
    editor: '',
    workDir: '',
    repo: '',
  });
  const [editField, setEditField] = useState<EditField>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const [langIndex, setLangIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workspace, setWorkspace] = useState('default');

  // Load current config
  useEffect(() => {
    const cfg = config.getConfig();
    setCurrentConfig({
      language: cfg.language,
      editor: cfg.editor || '',
      workDir: cfg.workDir,
      repo: cfg.repo || '',
    });
    setWorkspace(config.getActiveWorkspace());
    setIsLoggedIn(!!credentials.get());
    
    // Find current language index
    const idx = SUPPORTED_LANGUAGES.indexOf(cfg.language);
    if (idx >= 0) setLangIndex(idx);
  }, []);

  const handleSave = () => {
    if (editField === 'language') {
      config.setLanguage(SUPPORTED_LANGUAGES[langIndex]);
      setCurrentConfig(prev => ({ ...prev, language: SUPPORTED_LANGUAGES[langIndex] }));
    } else if (editField === 'editor' && editBuffer.trim()) {
      config.setEditor(editBuffer.trim());
      setCurrentConfig(prev => ({ ...prev, editor: editBuffer.trim() }));
    } else if (editField === 'workDir' && editBuffer.trim()) {
      config.setWorkDir(editBuffer.trim());
      setCurrentConfig(prev => ({ ...prev, workDir: editBuffer.trim() }));
    } else if (editField === 'repo') {
      if (editBuffer.trim()) {
        config.setRepo(editBuffer.trim());
        setCurrentConfig(prev => ({ ...prev, repo: editBuffer.trim() }));
      } else {
        config.deleteRepo();
        setCurrentConfig(prev => ({ ...prev, repo: '' }));
      }
    }
    setEditField(null);
    setEditBuffer('');
  };

  useInput((input, key) => {
    if (editField) {
      // Editing mode
      if (key.escape) {
        setEditField(null);
        setEditBuffer('');
        return;
      }
      if (key.return) {
        handleSave();
        return;
      }
      
      if (editField === 'language') {
        // Language selection with arrow keys
        if (key.leftArrow || input === 'h') {
          setLangIndex(prev => (prev - 1 + SUPPORTED_LANGUAGES.length) % SUPPORTED_LANGUAGES.length);
        }
        if (key.rightArrow || input === 'l') {
          setLangIndex(prev => (prev + 1) % SUPPORTED_LANGUAGES.length);
        }
      } else {
        // Text input
        if (key.backspace || key.delete) {
          setEditBuffer(prev => prev.slice(0, -1));
        } else if (input && !key.ctrl && !key.meta) {
          setEditBuffer(prev => prev + input);
        }
      }
      return;
    }
    
    // Normal mode
    if (key.escape) {
      onBack();
      return;
    }
    
    // Start editing
    if (input === '1') {
      setEditField('language');
      const idx = SUPPORTED_LANGUAGES.indexOf(currentConfig.language);
      setLangIndex(idx >= 0 ? idx : 0);
    }
    if (input === '2') {
      setEditField('editor');
      setEditBuffer(currentConfig.editor);
    }
    if (input === '3') {
      setEditField('workDir');
      setEditBuffer(currentConfig.workDir);
    }
    if (input === '4') {
      setEditField('repo');
      setEditBuffer(currentConfig.repo);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>{icons.gear} Configuration</Text>
        <Text color={colors.textMuted}> — Workspace: {workspace}</Text>
      </Box>

      {/* Config Path */}
      <Box marginBottom={1}>
        <Text color={colors.textMuted}>Config file: {config.getPath()}</Text>
      </Box>

      {/* Config Fields */}
      <Panel title="Settings">
        <Box flexDirection="column" gap={1}>
          {/* Language */}
          <Box>
            <Text color={colors.textMuted}>[1] Language:    </Text>
            {editField === 'language' ? (
              <Box>
                <Text color={colors.primary}>{icons.arrowLeft} </Text>
                <Text color={colors.success} bold>{SUPPORTED_LANGUAGES[langIndex]}</Text>
                <Text color={colors.primary}> {icons.arrow}</Text>
                <Text color={colors.textDim}> (←/→ to change, Enter to save)</Text>
              </Box>
            ) : (
              <Text color={colors.textBright}>{currentConfig.language}</Text>
            )}
          </Box>

          {/* Editor */}
          <Box>
            <Text color={colors.textMuted}>[2] Editor:      </Text>
            {editField === 'editor' ? (
              <Box>
                <Text color={colors.success}>{editBuffer}</Text>
                <Text color={colors.primary}>▌</Text>
                <Text color={colors.textDim}> (type, Enter to save)</Text>
              </Box>
            ) : (
              <Text color={colors.textBright}>{currentConfig.editor || '(not set)'}</Text>
            )}
          </Box>

          {/* Work Dir */}
          <Box>
            <Text color={colors.textMuted}>[3] Work Dir:    </Text>
            {editField === 'workDir' ? (
              <Box>
                <Text color={colors.success}>{editBuffer}</Text>
                <Text color={colors.primary}>▌</Text>
              </Box>
            ) : (
              <Text color={colors.textBright}>{currentConfig.workDir}</Text>
            )}
          </Box>

          {/* Repo URL */}
          <Box>
            <Text color={colors.textMuted}>[4] Repo URL:    </Text>
            {editField === 'repo' ? (
              <Box>
                <Text color={colors.success}>{editBuffer}</Text>
                <Text color={colors.primary}>▌</Text>
              </Box>
            ) : (
              <Text color={colors.textBright}>{currentConfig.repo || '(not set)'}</Text>
            )}
          </Box>

          {/* Login Status (read-only) */}
          <Box marginTop={1}>
            <Text color={colors.textMuted}>    Logged in:   </Text>
            <Text color={isLoggedIn ? colors.success : colors.warning}>
              {isLoggedIn ? 'Yes' : 'No'}
            </Text>
          </Box>
        </Box>
      </Panel>

      {/* Footer */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          {editField ? (
            <>
              <Text color={colors.primary}>[Enter]</Text> Save <Text color={colors.primary}>[Esc]</Text> Cancel
            </>
          ) : (
            <>
              <Text color={colors.primary}>[1-4]</Text> Edit field <Text color={colors.primary}>[Esc]</Text> Back
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
}
