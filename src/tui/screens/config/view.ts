import chalk from 'chalk';
import type { ConfigScreenModel } from '../../types.js';
import {
  renderFooterHints,
  renderScreenTitle,
  renderSectionHeader,
  splitPane,
  truncate,
  wrapLines,
} from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

const EXAMPLES: Record<string, string> = {
  language: 'Example: typescript, python3, cpp',
  editor: 'Example: code, vim, nvim',
  workdir: 'Example: /Users/name/leetcode',
  repo: 'Example: https://github.com/user/leetcode.git',
};

export function view(model: ConfigScreenModel, width: number, height: number): string {
  const safeWidth = Math.max(20, width);
  const safeHeight = Math.max(8, height);
  const lines: string[] = [];

  lines.push(...renderScreenTitle(`${icons.gear} Configuration`, 'Workspace-local CLI settings', safeWidth));
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(safeWidth)));

  const bodyHeight = Math.max(3, safeHeight - lines.length - 3);
  if (safeWidth >= 90) {
    lines.push(...splitPane(renderOptionList(model, safeWidth), renderOptionDetails(model, safeWidth), safeWidth, bodyHeight, 0.4));
  } else {
    const topHeight = Math.max(3, Math.floor(bodyHeight * 0.4));
    const bottomHeight = Math.max(3, bodyHeight - topHeight - 1);
    const top = renderOptionList(model, safeWidth).slice(0, topHeight);
    while (top.length < topHeight) top.push('');
    const bottom = renderOptionDetails(model, safeWidth).slice(0, bottomHeight);
    while (bottom.length < bottomHeight) bottom.push('');
    lines.push(...top);
    lines.push(chalk.hex(colors.border)(borders.horizontal.repeat(safeWidth)));
    lines.push(...bottom);
  }

  while (lines.length < safeHeight - 2) lines.push('');
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(safeWidth)));
  lines.push(...renderFooter(model, safeWidth));

  return lines.slice(0, safeHeight).join('\n');
}

function renderOptionList(model: ConfigScreenModel, width: number): string[] {
  const paneWidth = width >= 90 ? Math.max(20, Math.floor(width * 0.4)) : width;
  const lines: string[] = [];
  lines.push(renderSectionHeader('Options', paneWidth));
  lines.push('');

  for (let i = 0; i < model.options.length; i++) {
    const option = model.options[i];
    const isSelected = i === model.selectedOption;
    const prefix = isSelected ? chalk.hex(colors.primary)('▶') : ' ';
    const row = `${prefix} ${truncate(option.label, Math.max(8, paneWidth - 4))}`;
    if (isSelected && model.paneFocus === 'list') {
      lines.push(chalk.bgHex(colors.bgHighlight)(row.padEnd(Math.max(0, paneWidth - 1))));
    } else {
      lines.push(row);
    }
  }

  return lines;
}

function renderOptionDetails(model: ConfigScreenModel, width: number): string[] {
  const paneWidth = width >= 90 ? Math.max(20, width - Math.floor(width * 0.4) - 1) : width;
  const option = model.options[model.selectedOption];
  const lines: string[] = [];

  lines.push(renderSectionHeader('Editor', paneWidth));
  lines.push('');
  lines.push(chalk.hex(colors.primary).bold(option.label));
  lines.push(...wrapLines([chalk.hex(colors.textMuted)(option.description)], Math.max(12, paneWidth - 2)));
  lines.push('');

  const rawValue = model.isEditing ? `${model.draftValue}█` : model.draftValue;
  const valueLabel = `Value: ${rawValue || '(empty)'}`;
  const valueLine = truncate(valueLabel, Math.max(8, paneWidth - 2));
  if (model.paneFocus === 'editor') {
    lines.push(chalk.bgHex(colors.bgHighlight)(valueLine.padEnd(Math.max(0, paneWidth - 1))));
  } else {
    lines.push(valueLine);
  }

  lines.push(chalk.hex(colors.textMuted)(truncate(EXAMPLES[option.id] || '', paneWidth - 2)));
  lines.push('');

  if (option.id === 'language' || option.id === 'workdir') {
    lines.push(chalk.hex(colors.textMuted)('Validation: required'));
  } else {
    lines.push(chalk.hex(colors.textMuted)('Validation: optional'));
  }

  if (model.validationError) {
    lines.push(chalk.hex(colors.error)(truncate(model.validationError, paneWidth - 2)));
  } else if (model.isDirty) {
    lines.push(chalk.hex(colors.warning)('Unsaved changes'));
  } else {
    lines.push(chalk.hex(colors.success)('No pending changes'));
  }

  return lines;
}

function renderFooter(model: ConfigScreenModel, width: number): string[] {
  return renderFooterHints(
    [
      { key: '↑/↓', label: model.paneFocus === 'list' ? 'Move option' : 'Move option' },
      { key: 'Tab/h/l', label: 'Switch pane' },
      { key: 'Enter', label: model.isEditing ? 'Save' : 'Edit' },
      { key: 'Esc', label: model.isEditing ? 'Cancel edit' : 'Back' },
    ],
    width,
    width < 90 ? 'compact' : 'normal'
  );
}
