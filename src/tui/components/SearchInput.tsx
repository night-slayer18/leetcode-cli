/**
 * SearchInput Component
 * Fuzzy search input with styling
 */
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useState } from 'react';
import { colors, icons } from '../theme.js';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  focused?: boolean;
  onSubmit?: () => void;
  onEscape?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  focused = false,
  onSubmit,
  onEscape,
}: SearchInputProps) {
  useInput((input, key) => {
    if (key.escape && onEscape) {
      onEscape();
    }
    if (key.return && onSubmit) {
      onSubmit();
    }
  });

  return (
    <Box
      borderStyle="round"
      borderColor={focused ? colors.primary : colors.textMuted}
      paddingX={1}
    >
      <Text color={colors.textMuted}>{icons.target} </Text>
      {focused ? (
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <Text color={value ? colors.text : colors.textMuted}>
          {value || placeholder}
        </Text>
      )}
    </Box>
  );
}
