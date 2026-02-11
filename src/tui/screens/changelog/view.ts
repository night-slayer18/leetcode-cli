import chalk from 'chalk';
import { ChangelogScreenModel, VersionEntry } from '../../types.js';
import { keyHint } from '../../lib/layout.js';
import { colors, borders, icons } from '../../theme.js';

export function estimateRenderedLineCount(model: ChangelogScreenModel, width: number): number {
  if (model.loading || model.error) {
    return 3;
  }
  return buildEntryLines(model.entries, width).length;
}

export function view(model: ChangelogScreenModel, width: number, height: number): string {
  const lines: string[] = [];

  const title = ' Changelog ';

  const titleBar =
    chalk.hex(colors.primary).bold(icons.code + title) +
    chalk.hex(colors.textMuted)('Latest updates and improvements');

  lines.push(titleBar);
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));
  lines.push('');

  const visibleHeight = Math.max(3, height - 5);

  if (model.loading) {
    lines.push('');
    lines.push('  ' + chalk.hex(colors.primary)('⋯ Loading release notes...'));
  } else if (model.error) {
    lines.push('');
    lines.push('  ' + chalk.red(icons.cross + ' Error loading changelog:'));
    lines.push('  ' + chalk.red(model.error));
  } else {
    const allLines = buildEntryLines(model.entries, width);
    const maxScroll = Math.max(0, allLines.length - visibleHeight);
    const clampedOffset = Math.min(model.scrollOffset, maxScroll);
    const visibleLines = allLines.slice(clampedOffset, clampedOffset + visibleHeight);

    visibleLines.forEach((line) => {
      lines.push('  ' + line);
    });

    if (maxScroll > 0 && lines.length < height - 2) {
      const progress = `${clampedOffset + 1}-${Math.min(clampedOffset + visibleHeight, allLines.length)} of ${allLines.length}`;
      lines.push('  ' + chalk.hex(colors.textMuted)(progress));
    }
  }

  while (lines.length < height - 2) {
    lines.push('');
  }

  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));

  const hints = [keyHint('j/k', 'Scroll'), keyHint('Esc', 'Back')];
  lines.push(hints.join('  '));

  return lines.slice(0, height).join('\n');
}

function renderEntry(entry: VersionEntry, width: number): string[] {
  const lines: string[] = [];

  const versionText = ` ${entry.version} `;
  const header = entry.hasBreakingChanges
    ? chalk.bgRed.white.bold(versionText) + chalk.red(' ⚠️  BREAKING CHANGES')
    : chalk.bgHex(colors.primary).black.bold(versionText);

  lines.push(header);
  if (entry.date) {
    lines.push(chalk.gray(`  📅 ${entry.date}`));
  }
  lines.push('');

  const contentLines = entry.content.split('\n');
  let inList = false;

  for (const line of contentLines) {
    if (line.trim() === '' && !inList) continue;

    if (line.startsWith('> **Release Date**') || line.startsWith('> **Focus**')) continue;

    if (line.startsWith('### ')) {
      const text = line.replace('### ', '').trim();
      lines.push('');

      let emoji = '📌';
      if (text.includes('Breaking')) emoji = '⚠️';
      else if (text.includes('Feature') || text.includes('New')) emoji = '🚀';
      else if (text.includes('Fix') || text.includes('Bug')) emoji = '🐛';

      lines.push(chalk.bold.yellow(`${emoji} ${text}`));
      inList = true;
      continue;
    }

    if (line.startsWith('#### ')) {
      lines.push(chalk.bold.white('   ' + line.replace('#### ', '').trim()));
      continue;
    }

    if (line.startsWith('- ')) {
      const text = line.replace('- ', '').trim();

      const boldMatch = text.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
      let itemLine = '';

      if (boldMatch) {
        itemLine =
          chalk.cyan(`• ${chalk.bold(boldMatch[1])}`) +
          (boldMatch[2] ? chalk.white(`: ${boldMatch[2]}`) : '');
      } else {
        itemLine = chalk.white(`• ${text}`);
      }

      lines.push(...wrapText('   ' + itemLine, width - 3, 5));
      continue;
    }

    if (line.startsWith('---')) continue;

    if (line.trim().length > 0) {
      lines.push(...wrapText('   ' + chalk.gray(line.trim()), width - 3, 3));
    }
  }

  return lines;
}

function wrapText(text: string, width: number, indent: number): string[] {
  const safeWidth = Math.max(1, width);
  if (stripAnsi(text).length <= safeWidth) return [text];

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const indentStr = ' '.repeat(indent);

  words.forEach((word) => {
    if (stripAnsi(currentLine + word).length + 1 > safeWidth) {
      lines.push(currentLine);
      currentLine = indentStr + word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });
  if (currentLine) lines.push(currentLine);

  return lines;
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[\d+m/g, '');
}

function buildEntryLines(entries: VersionEntry[], width: number): string[] {
  const allLines: string[] = [];
  const contentWidth = Math.max(20, width - 4);

  entries.forEach((entry) => {
    allLines.push(...renderEntry(entry, contentWidth));
    allLines.push('');
    allLines.push(chalk.hex(colors.border)(borders.horizontal.repeat(contentWidth)));
    allLines.push('');
  });

  return allLines;
}
