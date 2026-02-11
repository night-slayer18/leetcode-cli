import chalk from 'chalk';
import { colors, icons, borders } from '../theme.js';
import { stripAnsi, wrapLines } from '../lib/layout.js';

export interface HeaderProps {
  username: string | null;
  isConnected: boolean;
  width: number;
}

export function renderHeader(props: HeaderProps): string[] {
  const { username, isConnected, width } = props;
  const lines: string[] = [];

  const logo = chalk.hex(colors.primary).bold(`${icons.fire} LeetCode CLI`);
  const status = isConnected
    ? chalk.hex(colors.success)('● Connected')
    : chalk.hex(colors.error)('○ Offline');
  const userText = username
    ? chalk.hex(colors.text)(`${icons.code} ${username}`)
    : chalk.hex(colors.textMuted)('Not logged in');

  const leftPart = logo;
  const rightPart = `${status}  ${userText}`;

  const rightLen = stripAnsi(rightPart).length;
  const availableLeftWidth = Math.max(1, width - rightLen - 1);
  const leftLine = wrapLines([leftPart], availableLeftWidth)[0] ?? leftPart;
  const leftLen = stripAnsi(leftLine).length;
  const padding = width - leftLen - rightLen;
  const spaces = padding > 0 ? ' '.repeat(padding) : '  ';

  lines.push(leftLine + spaces + rightPart);

  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));

  return lines;
}
