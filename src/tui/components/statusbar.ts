import chalk from 'chalk';
import { colors, borders } from '../theme.js';
import { stripAnsi, keyHints, wrapLines } from '../lib/layout.js';

export interface StatusBarProps {
  screen: string;
  hints: Array<{ key: string; label: string }>;
  message?: string;
  width: number;
}

export function renderStatusBar(props: StatusBarProps): string[] {
  const { screen, hints, message, width } = props;
  const lines: string[] = [];

  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));

  const hintsText = keyHints(hints);
  const screenBadge = chalk.bgHex(colors.bgHighlight).hex(colors.primary)(
    ` ${screen.toUpperCase()} `
  );

  let statusLine: string;
  if (message) {
    const messageText = chalk.hex(colors.warning)(message);
    statusLine = hintsText + '  ' + messageText;
  } else {
    statusLine = hintsText;
  }

  const rightLen = stripAnsi(screenBadge).length;
  const availableWidth = Math.max(1, width - rightLen - 1);
  statusLine = wrapLines([statusLine], availableWidth)[0] ?? '';
  const leftLen = stripAnsi(statusLine).length;
  const padding = width - leftLen - rightLen;
  const spaces = padding > 0 ? ' '.repeat(padding) : '  ';

  lines.push(statusLine + spaces + screenBadge);

  return lines;
}

export function getScreenHints(screen: string): Array<{ key: string; label: string }> {
  switch (screen) {
    case 'home':
      return [
        { key: 'j/k', label: 'Navigate' },
        { key: '↵', label: 'Select' },
        { key: 'q', label: 'Quit' },
        { key: '?', label: 'Help' },
      ];
    case 'list':
      return [
        { key: 'j/k', label: 'Move' },
        { key: '/', label: 'Search' },
        { key: '1-3', label: 'Filter' },
        { key: '↵', label: 'Open' },
        { key: 'Esc', label: 'Back' },
      ];
    case 'problem':
      return [
        { key: 'j/k', label: 'Scroll' },
        { key: 'p', label: 'Pick' },
        { key: 't', label: 'Test' },
        { key: 's', label: 'Submit' },
        { key: 'Esc', label: 'Back' },
      ];
    case 'timer':
      return [
        { key: 'Space', label: 'Start/Pause' },
        { key: 'r', label: 'Reset' },
        { key: 'Esc', label: 'Back' },
      ];
    case 'help':
      return [
        { key: 'j/k', label: 'Scroll' },
        { key: 'PgUp/PgDn', label: 'Page' },
        { key: '?/Esc', label: 'Close' },
      ];
    case 'workspace':
      return [
        { key: 'Tab', label: 'Switch Pane' },
        { key: 'Enter', label: 'Switch/Edit' },
        { key: 'c/d', label: 'Create/Delete' },
        { key: 'Esc', label: 'Back' },
      ];
    case 'config':
      return [
        { key: 'Tab', label: 'Switch Pane' },
        { key: 'Enter', label: 'Edit/Save' },
        { key: 'Esc', label: 'Back' },
      ];
    default:
      return [
        { key: 'Esc', label: 'Back' },
        { key: '?', label: 'Help' },
      ];
  }
}
