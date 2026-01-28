/**
 * Help Screen
 * Global shortcuts and navigation guide
 */
import { Box, Text, useInput } from 'ink';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  useInput((input, key) => {
    if (key.escape || input === '?' || input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box marginBottom={1}>
        <Text color={colors.primary} bold>{icons.star} Help & Shortcuts</Text>
      </Box>

      <Box flexDirection="row" gap={2} flexGrow={1}>
        {/* Left Column: Global & Navigation */}
        <Box flexDirection="column" flexGrow={1} flexBasis={0}>
          <Panel title="Global Shortcuts">
            <Box flexDirection="column">
              <Box><Text color={colors.primary} bold>?      </Text><Text color={colors.text}> Toggle this help screen</Text></Box>
              <Box><Text color={colors.primary} bold>Ctrl+C </Text><Text color={colors.text}> Force quit</Text></Box>
              <Box><Text color={colors.primary} bold>Esc    </Text><Text color={colors.text}> Back / Cancel</Text></Box>
            </Box>
          </Panel>

          <Box marginTop={1}>
            <Panel title="Home Navigation">
              <Box flexDirection="column">
                <Box><Text color={colors.primary} bold>d </Text><Text color={colors.text}> Daily Challenge</Text></Box>
                <Box><Text color={colors.primary} bold>l </Text><Text color={colors.text}> Problem List</Text></Box>
                <Box><Text color={colors.primary} bold>r </Text><Text color={colors.text}> Random Problem</Text></Box>
                <Box><Text color={colors.primary} bold>b </Text><Text color={colors.text}> Bookmarks</Text></Box>
                <Box><Text color={colors.primary} bold>s </Text><Text color={colors.text}> Stats</Text></Box>
                <Box><Text color={colors.primary} bold>t </Text><Text color={colors.text}> Timer</Text></Box>
              </Box>
            </Panel>
          </Box>
        </Box>

        {/* Right Column: Problem & Lists */}
        <Box flexDirection="column" flexGrow={1} flexBasis={0}>
          <Panel title="List Navigation">
            <Box flexDirection="column">
              <Box><Text color={colors.primary} bold>j / ↓  </Text><Text color={colors.text}> Move down</Text></Box>
              <Box><Text color={colors.primary} bold>k / ↑  </Text><Text color={colors.text}> Move up</Text></Box>
              <Box><Text color={colors.primary} bold>/      </Text><Text color={colors.text}> Search</Text></Box>
              <Box><Text color={colors.primary} bold>1/2/3  </Text><Text color={colors.text}> Filter Difficulty</Text></Box>
              <Box><Text color={colors.primary} bold>s/a    </Text><Text color={colors.text}> Filter Status</Text></Box>
            </Box>
          </Panel>

          <Box marginTop={1}>
            <Panel title="Problem Actions">
              <Box flexDirection="column">
                <Box><Text color={colors.primary} bold>p </Text><Text color={colors.text}> Pick (Open in Editor)</Text></Box>
                <Box><Text color={colors.primary} bold>t </Text><Text color={colors.text}> Test Solution</Text></Box>
                <Box><Text color={colors.primary} bold>x </Text><Text color={colors.text}> Submit Solution</Text></Box>
                <Box><Text color={colors.primary} bold>h </Text><Text color={colors.text}> View Hints</Text></Box>
                <Box><Text color={colors.primary} bold>n </Text><Text color={colors.text}> Notes</Text></Box>
              </Box>
            </Panel>
          </Box>
        </Box>
      </Box>

      <Box marginTop={2}>
        <Text color={colors.textMuted}>Press <Text color={colors.primary}>Esc</Text> or <Text color={colors.primary}>?</Text> to return</Text>
      </Box>
    </Box>
  );
}
