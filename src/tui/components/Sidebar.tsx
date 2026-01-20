/**
 * Sidebar Component
 * Navigation menu with keyboard shortcuts
 * Can be disabled to prevent input capture when inside screens
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import { colors, icons } from '../theme.js';

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: MenuItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  width?: number;
  disabled?: boolean; // When true, don't capture j/k input
}

export function Sidebar({
  items,
  activeKey,
  onSelect,
  width = 22,
  disabled = false,
}: SidebarProps) {
  const [focusedIndex, setFocusedIndex] = useState(
    items.findIndex((item) => item.key === activeKey)
  );

  // Update focused index when activeKey changes
  useEffect(() => {
    const idx = items.findIndex((item) => item.key === activeKey);
    if (idx !== -1) setFocusedIndex(idx);
  }, [activeKey, items]);

  useInput((input, key) => {
    // Don't handle ANY input when disabled (inside content screens)
    if (disabled) {
      return;
    }
    
    // Full navigation when not disabled matches home screen
    if (key.downArrow || input === 'j') {
      setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (key.return) {
      const item = items[focusedIndex];
      if (item) onSelect(item.key);
    }
    // Direct key shortcuts always work
    const matchedItem = items.find(
      (item) => item.key.toLowerCase() === input.toLowerCase()
    );
    if (matchedItem) {
      onSelect(matchedItem.key);
    }
  });

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="round"
      borderColor={colors.textMuted}
      paddingX={1}
    >
      <Box marginTop={-1} marginLeft={1}>
        <Text color={colors.primary} bold>
          {' '}
          MENU{' '}
        </Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {items.map((item, index) => {
          const isActive = item.key === activeKey;
          const isFocused = index === focusedIndex && !disabled;

          return (
            <Box key={item.key} gap={1}>
              <Text
                color={
                  isActive
                    ? colors.primary
                    : isFocused
                      ? colors.textBright
                      : colors.text
                }
                bold={isActive}
                inverse={isFocused}
              >
                {' '}
                {item.icon} {item.label.padEnd(12)}{' '}
              </Text>
              <Text color={colors.textMuted}>[{item.key}]</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Default menu items
export const defaultMenuItems: MenuItem[] = [
  { key: 'd', label: 'Daily', icon: icons.fire },
  { key: 'l', label: 'List', icon: icons.folder },
  { key: 'r', label: 'Random', icon: icons.target },
  { key: 'b', label: 'Bookmarks', icon: icons.bookmark },
  { key: 't', label: 'Timer', icon: icons.clock },
  { key: 's', label: 'Stats', icon: icons.stats },
  { key: 'w', label: 'Workspace', icon: icons.folder },
  { key: 'c', label: 'Config', icon: icons.gear },
  { key: 'y', label: 'Sync', icon: '🔄' },
  { key: 'g', label: 'Changelog', icon: '📋' },
  { key: 'u', label: 'Update', icon: '🚀' },
  { key: 'q', label: 'Quit', icon: icons.cross },
];
