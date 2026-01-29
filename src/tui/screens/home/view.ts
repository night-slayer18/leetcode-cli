import chalk from 'chalk';
import type { HomeScreenModel } from '../../types.js';
import { colors, borders, icons } from '../../theme.js';
import { renderLogo, box, center, stripAnsi, keyHint } from '../../lib/layout.js';
import { MENU_ITEMS } from './index.js';

export function view(model: HomeScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height - 4;

  const logoHeight = width >= 80 ? 6 : 3;
  const menuHeight = MENU_ITEMS.length + 4;
  const totalContentHeight = logoHeight + 2 + menuHeight + 4;
  const topPadding = Math.max(0, Math.floor((contentHeight - totalContentHeight) / 2));

  for (let i = 0; i < topPadding; i++) {
    lines.push('');
  }

  const logoLines = renderLogo(width);
  lines.push(...logoLines);
  lines.push('');

  const tagline = chalk.hex(colors.textMuted)('A modern command-line interface for LeetCode');
  lines.push(center(tagline, width));
  lines.push('');

  const menuWidth = Math.min(100, Math.max(60, width - 8));
  const menuContent: string[] = [];

  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const item = MENU_ITEMS[i];
    const isSelected = i === model.menuIndex;

    const selector = isSelected ? chalk.hex(colors.primary)(' ▶ ') : '   ';

    const key = chalk.hex(colors.primary)(`[${item.key}]`);

    const label = isSelected
      ? chalk.hex(colors.textBright).bold(item.label)
      : chalk.hex(colors.text)(item.label);

    const desc = chalk.hex(colors.textMuted)(` - ${item.description}`);

    let line = `${selector}${key} ${label}`;

    const lineLen = stripAnsi(line).length;
    const descLen = stripAnsi(desc).length;
    if (lineLen + descLen < menuWidth - 4) {
      line += desc;
    }

    const stripped = stripAnsi(line);
    const padding = menuWidth - 4 - stripped.length;
    line = line + (padding > 0 ? ' '.repeat(padding) : '');

    if (isSelected) {
      menuContent.push(chalk.bgHex(colors.bgHighlight)(line));
    } else {
      menuContent.push(line);
    }
  }

  const boxLines = box(menuContent, menuWidth, 'Menu');
  for (const boxLine of boxLines) {
    lines.push(center(boxLine, width));
  }

  lines.push('');

  const tips = [
    chalk.hex(colors.textMuted)(`${icons.arrow} Press `) +
      chalk.hex(colors.primary)('j/k') +
      chalk.hex(colors.textMuted)(' or ') +
      chalk.hex(colors.primary)('↑/↓') +
      chalk.hex(colors.textMuted)(' to navigate'),
    chalk.hex(colors.textMuted)(`${icons.arrow} Press `) +
      chalk.hex(colors.primary)('Enter') +
      chalk.hex(colors.textMuted)(' or the highlighted key to select'),
  ];

  for (const tip of tips) {
    lines.push(center(tip, width));
  }

  while (lines.length < contentHeight) {
    lines.push('');
  }

  return lines.join('\n');
}
