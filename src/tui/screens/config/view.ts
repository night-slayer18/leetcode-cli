import chalk from 'chalk';
import type { ConfigScreenModel } from '../../types.js';
import { colors, icons, borders } from '../../theme.js';
import { box, center, keyHint } from '../../lib/layout.js';

export function view(model: ConfigScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height;

  const headerHeight = 3;
  const listHeight = model.options.length * 3 + 2;
  const footerHeight = 2;

  const availableSpace = contentHeight - headerHeight - listHeight - footerHeight;
  const topPadding = Math.max(0, Math.floor(availableSpace / 2));

  for (let i = 0; i < topPadding; i++) lines.push('');

  lines.push(center(chalk.hex(colors.primary).bold(` ${icons.gear} Configuration `), width));
  lines.push('');

  const configRows: string[] = [];
  for (let i = 0; i < model.options.length; i++) {
    const opt = model.options[i];
    const isSel = i === model.selectedOption;
    const isEdit = isSel && model.editMode;

    const label = opt.label.padEnd(25);
    let valStr = opt.value || '(empty)';

    if (isEdit) {
      valStr = chalk.bgHex(colors.bgHighlight).white(` ${valStr} `);
    } else {
      valStr = chalk.hex(colors.secondary)(valStr);
    }

    const prefix = isSel ? chalk.hex(colors.primary)('▶ ') : '  ';
    const row = `${prefix}${isSel ? chalk.bold(label) : label} ${valStr}`;
    configRows.push(row);

    if (isSel) {
      configRows.push(`    ${chalk.hex(colors.textMuted)(opt.description)}`);
      configRows.push('');
    } else {
    }
  }

  lines.push(...box(configRows, width, 'Settings'));

  while (lines.length < contentHeight - footerHeight) lines.push('');

  const hints = model.editMode
    ? keyHint('↵', 'Save') + ' ' + keyHint('Esc', 'Cancel')
    : keyHint('↑/↓', 'Move') + ' ' + keyHint('↵', 'Edit') + ' ' + keyHint('Esc', 'Back');

  lines.push(center(hints, width));

  return lines.join('\n');
}
