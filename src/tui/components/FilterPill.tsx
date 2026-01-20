/**
 * FilterPill Component
 * Clickable filter buttons
 */
import { Box, Text } from 'ink';
import { colors } from '../theme.js';

interface FilterPillProps {
  label: string;
  active?: boolean;
  color?: string;
}

export function FilterPill({ label, active = false, color }: FilterPillProps) {
  const bgColor = active ? color || colors.primary : undefined;
  const textColor = active ? colors.textBright : colors.textMuted;

  return (
    <Box paddingX={1}>
      <Text color={textColor} inverse={active} bold={active}>
        {` ${label} `}
      </Text>
    </Box>
  );
}

interface FilterGroupProps {
  filters: Array<{ key: string; label: string; color?: string }>;
  activeKey: string | null;
  onSelect: (key: string | null) => void;
}

export function FilterGroup({ filters, activeKey, onSelect }: FilterGroupProps) {
  return (
    <Box gap={1}>
      <FilterPill
        label="All"
        active={activeKey === null}
      />
      {filters.map((filter) => (
        <FilterPill
          key={filter.key}
          label={filter.label}
          active={activeKey === filter.key}
          color={filter.color}
        />
      ))}
    </Box>
  );
}
