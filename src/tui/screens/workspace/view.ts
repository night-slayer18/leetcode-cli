import chalk from 'chalk';
import { WorkspaceScreenModel } from '../../types.js';
import {
  keyHint,
  renderFooterHints,
  renderScreenTitle,
  renderSectionHeader,
  splitPane,
  truncate,
  wrapLines,
} from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

const FIELD_META: Array<{ key: 'lang' | 'workDir' | 'editor' | 'syncRepo'; label: string }> = [
  { key: 'lang', label: 'Language' },
  { key: 'workDir', label: 'Work Dir' },
  { key: 'editor', label: 'Editor' },
  { key: 'syncRepo', label: 'Sync Repo' },
];

export function view(model: WorkspaceScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const safeWidth = Math.max(20, width);
  const safeHeight = Math.max(8, height);

  const subtitle = model.selectedWorkspace
    ? `Active: ${model.activeWorkspace} • Selected: ${model.selectedWorkspace}`
    : 'Manage isolated problem-solving contexts';
  lines.push(...renderScreenTitle(`${icons.folder} Workspaces`, subtitle, safeWidth));
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(safeWidth)));

  const bodyHeight = Math.max(3, safeHeight - lines.length - 3);
  if (safeWidth >= 90) {
    lines.push(...splitPane(renderWorkspaceList(model, safeWidth), renderWorkspaceEditor(model, safeWidth), safeWidth, bodyHeight, 0.43));
  } else {
    const topHeight = Math.max(3, Math.floor(bodyHeight * 0.45));
    const bottomHeight = Math.max(3, bodyHeight - topHeight - 1);
    const left = renderWorkspaceList(model, safeWidth).slice(0, topHeight);
    while (left.length < topHeight) left.push('');
    const right = renderWorkspaceEditor(model, safeWidth).slice(0, bottomHeight);
    while (right.length < bottomHeight) right.push('');
    lines.push(...left);
    lines.push(chalk.hex(colors.border)(borders.horizontal.repeat(safeWidth)));
    lines.push(...right);
  }

  while (lines.length < safeHeight - 2) {
    lines.push('');
  }
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(safeWidth)));
  lines.push(...renderFooter(model, safeWidth));

  return lines.slice(0, safeHeight).join('\n');
}

function renderWorkspaceList(model: WorkspaceScreenModel, width: number): string[] {
  const paneWidth = width >= 90 ? Math.max(20, Math.floor(width * 0.43)) : width;
  const lines: string[] = [];
  lines.push(renderSectionHeader('Workspace List', paneWidth));
  lines.push('');

  if (model.workspaces.length === 0) {
    lines.push(chalk.hex(colors.warning)('No workspaces found.'));
    return lines;
  }

  for (let i = 0; i < model.workspaces.length; i++) {
    const name = model.workspaces[i];
    const isSelected = i === model.cursor;
    const isActive = name === model.activeWorkspace;
    const selector = isSelected ? chalk.hex(colors.primary).bold('▶') : ' ';
    const active = isActive ? chalk.hex(colors.success)('●') : chalk.hex(colors.textMuted)('○');
    const text = truncate(name, Math.max(6, paneWidth - 8));
    const base = ` ${selector} ${active} ${text}`;
    if (isSelected && model.paneFocus === 'list') {
      lines.push(chalk.bgHex(colors.bgHighlight)(base.padEnd(Math.max(0, paneWidth - 1))));
    } else {
      lines.push(base);
    }
  }

  lines.push('');
  lines.push(chalk.hex(colors.textMuted)(`Count: ${model.workspaces.length}`));
  return lines;
}

function renderWorkspaceEditor(model: WorkspaceScreenModel, width: number): string[] {
  const paneWidth = width >= 90 ? Math.max(20, width - Math.floor(width * 0.43) - 1) : width;
  const lines: string[] = [];
  lines.push(renderSectionHeader('Properties', paneWidth));
  lines.push('');

  if (!model.selectedWorkspace || !model.draftConfig) {
    lines.push(chalk.hex(colors.textMuted)('Select a workspace to view properties.'));
    return lines;
  }

  lines.push(chalk.hex(colors.primary).bold(truncate(model.selectedWorkspace, paneWidth - 2)));
  lines.push(
    model.selectedWorkspace === model.activeWorkspace
      ? chalk.hex(colors.success)('Currently active')
      : chalk.hex(colors.textMuted)('Not active')
  );
  lines.push('');

  for (const field of FIELD_META) {
    const isSelected = model.selectedField === field.key;
    const rawValue = model.draftConfig[field.key] || '(empty)';
    const value = truncate(rawValue, Math.max(8, paneWidth - 18));
    const prefix = isSelected ? chalk.hex(colors.primary)('▶') : ' ';
    const dirty = model.isDirty && isSelected ? chalk.hex(colors.warning)('*') : ' ';
    const line = `${prefix} ${field.label.padEnd(10)}: ${value} ${dirty}`;

    if (isSelected && model.paneFocus === 'editor') {
      const focused = model.isEditing ? `${line}█` : line;
      lines.push(chalk.bgHex(colors.bgHighlight)(focused.padEnd(Math.max(0, paneWidth - 1))));
    } else {
      lines.push(line);
    }
  }

  lines.push('');
  lines.push(
    chalk.hex(colors.textMuted)(
      model.isEditing ? 'Editing field: Enter=Save Esc=Cancel' : 'Press Enter to edit selected field'
    )
  );
  return lines;
}

function renderFooter(model: WorkspaceScreenModel, width: number): string[] {
  if (model.showCreateInput) {
    const input = `Create workspace: ${truncate(model.newWorkspaceName, Math.max(5, width - 20))}█`;
    return [input, `${keyHint('Enter', 'Create')}  ${keyHint('Esc', 'Cancel')}`];
  }

  if (model.showDeleteConfirm) {
    const target = model.workspaces[model.cursor] || '';
    return [
      chalk.bgRed.white(` Delete "${target}"? `),
      `${keyHint('Enter', 'Delete')}  ${keyHint('Esc', 'Cancel')}`,
    ];
  }

  if (model.error) {
    const wrapped = wrapLines([`Error: ${model.error}`], Math.max(20, width - 2));
    return [chalk.hex(colors.error)(wrapped[0] ?? model.error)];
  }

  if (model.success) {
    const wrapped = wrapLines([model.success], Math.max(20, width - 2));
    return [chalk.hex(colors.success)(wrapped[0] ?? model.success)];
  }

  return renderFooterHints(
    [
      { key: '↑/↓', label: model.paneFocus === 'list' ? 'Select workspace' : 'Select field' },
      { key: 'Tab/h/l', label: 'Switch pane' },
      { key: 'Enter', label: model.paneFocus === 'list' ? 'Switch/Edit' : model.isEditing ? 'Save' : 'Edit' },
      { key: 'c', label: 'Create' },
      { key: 'd', label: 'Delete' },
      { key: 'Esc', label: 'Back/Cancel' },
    ],
    width,
    width < 90 ? 'compact' : 'normal'
  );
}
