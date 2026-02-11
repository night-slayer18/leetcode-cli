import chalk from 'chalk';
import { colors, borders, icons, progressChars, layout } from '../theme.js';

const ansiRegex = /\x1B\[[0-9;]*[a-zA-Z]/g;

export function stripAnsi(str: string): string {
  return str.replace(ansiRegex, '');
}

export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

export function truncate(str: string, maxLen: number): string {
  if (maxLen <= 0) return '';
  if (maxLen === 1) return '…';
  if (visibleLength(str) <= maxLen) return str;

  const target = maxLen - 1;
  let result = '';
  let visible = 0;

  for (let i = 0; i < str.length && visible < target; ) {
    if (str[i] === '\x1b') {
      const match = str.slice(i).match(/^\x1B\[[0-9;]*[a-zA-Z]/);
      if (match) {
        result += match[0];
        i += match[0].length;
        continue;
      }
    }

    result += str[i];
    i += 1;
    visible += 1;
  }

  if (str.includes('\x1b[')) {
    return `${result}…\x1b[0m`;
  }

  return `${result}…`;
}

export function padEnd(str: string, len: number): string {
  const stripped = stripAnsi(str);
  const padding = len - stripped.length;
  return padding > 0 ? str + ' '.repeat(padding) : str;
}

export function padStart(str: string, len: number): string {
  const stripped = stripAnsi(str);
  const padding = len - stripped.length;
  return padding > 0 ? ' '.repeat(padding) + str : str;
}

export function center(str: string, width: number): string {
  if (width <= 0) return '';
  const stripped = stripAnsi(str);
  const len = stripped.length;
  if (len >= width) return str;

  const leftPad = Math.floor((width - len) / 2);
  const rightPad = width - len - leftPad;

  return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
}

export type BorderStyle = 'light' | 'heavy' | 'double' | 'round';

export interface BoxOptions {
  title?: string;
  borderColor?: string;
  padding?: number;
  borderStyle?: BorderStyle;
  minWidth?: number;
}

const BORDER_CHARS: Record<BorderStyle, any> = {
  light: borders,
  round: borders,
  heavy: {
    horizontal: '━',
    vertical: '┃',
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
  },
  double: {
    horizontal: '═',
    vertical: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
  },
};

export function box(content: string[], width: number, options: string | BoxOptions = {}): string[] {
  const opts: BoxOptions = typeof options === 'string' ? { title: options } : options;
  const { title, borderColor = colors.textMuted, padding = 0, borderStyle = 'round' } = opts;

  const chars = BORDER_CHARS[borderStyle] || borders;
  const lines: string[] = [];
  const safeWidth = Math.max(4, width);
  const innerWidth = Math.max(2, safeWidth - 2);
  const contentWidth = Math.max(1, innerWidth - padding * 2);

  let top = chalk.hex(borderColor)(chars.topLeft || chars.roundTopLeft);
  if (title) {
    const titleText = chalk.hex(borderColor).bold(` ${title} `);
    const titleLen = stripAnsi(titleText).length;
    top += chalk.hex(borderColor)(chars.horizontal);
    top += titleText;
    top += chalk.hex(borderColor)(chars.horizontal.repeat(Math.max(0, innerWidth - titleLen - 1)));
  } else {
    top += chalk.hex(borderColor)(chars.horizontal.repeat(innerWidth));
  }
  top += chalk.hex(borderColor)(chars.topRight || chars.roundTopRight);
  lines.push(top);

  for (let i = 0; i < padding; i++) {
    lines.push(
      chalk.hex(borderColor)(chars.vertical) +
        ' '.repeat(innerWidth) +
        chalk.hex(borderColor)(chars.vertical)
    );
  }

  for (const line of content) {
    const stripped = stripAnsi(line);

    let processed = line;
    if (stripped.length > contentWidth) {
      processed = truncate(line, contentWidth);
    }
    const pad = contentWidth - stripAnsi(processed).length;
    const finalLine = ' '.repeat(padding) + processed + ' '.repeat(pad) + ' '.repeat(padding);

    lines.push(
      chalk.hex(borderColor)(chars.vertical) + finalLine + chalk.hex(borderColor)(chars.vertical)
    );
  }

  for (let i = 0; i < padding; i++) {
    lines.push(
      chalk.hex(borderColor)(chars.vertical) +
        ' '.repeat(innerWidth) +
        chalk.hex(borderColor)(chars.vertical)
    );
  }

  lines.push(
    chalk.hex(borderColor)(chars.bottomLeft || chars.roundBottomLeft) +
      chalk.hex(borderColor)(chars.horizontal.repeat(innerWidth)) +
      chalk.hex(borderColor)(chars.bottomRight || chars.roundBottomRight)
  );

  return lines;
}

export function dropShadow(lines: string[], width: number): string[] {
  const result = lines.map((line) => line + chalk.hex('#1a1a1a')('█'));

  const bottomShadow = ' ' + chalk.hex('#1a1a1a')('▀'.repeat(width + 1));
  result.push(bottomShadow);

  return result;
}

export function renderModal(
  base: string[],
  content: string[],
  screenW: number,
  screenH: number,
  opts: BoxOptions = {}
): string {
  const maxModalWidth = Math.max(4, Math.min(screenW - 2, Math.floor(screenW * 0.88)));
  const minModalWidth = Math.max(4, Math.min(opts.minWidth || 50, maxModalWidth));
  const maxW = Math.max(minModalWidth, maxModalWidth);
  const boxed = box(content, maxW, opts);
  const overlay = maxW + 1 <= screenW ? dropShadow(boxed, maxW) : boxed;
  const overlayHeight = overlay.length;

  const startY = Math.max(0, Math.floor((screenH - overlayHeight) / 2));

  const result = [...base];

  while (result.length < screenH) result.push(' '.repeat(screenW));

  for (let i = 0; i < overlayHeight; i++) {
    const y = startY + i;
    if (y < result.length) {
      result[y] = center(overlay[i], screenW);
    }
  }

  return result.join('\n');
}

export function horizontalLine(
  width: number,
  style: 'light' | 'heavy' | 'double' = 'light',
  color: string = colors.textMuted
): string {
  let char = borders.horizontal;
  if (style === 'heavy') char = BORDER_CHARS.heavy.horizontal;
  if (style === 'double') char = BORDER_CHARS.double.horizontal;
  return chalk.hex(color)(char.repeat(Math.max(0, width)));
}

export function progressBar(current: number, total: number, width: number): string {
  const percentage = Math.min(1, Math.max(0, current / total));
  const filled = Math.round(percentage * width);
  const empty = width - filled;

  return (
    chalk.hex(colors.success)(progressChars.filled.repeat(filled)) +
    chalk.hex(colors.textDim)(progressChars.empty.repeat(empty))
  );
}

export function percentageBar(value: number, width: number, color: string): string {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  return (
    chalk.hex(color)(progressChars.filled.repeat(filled)) +
    chalk.hex(colors.textDim)(progressChars.empty.repeat(empty)) +
    ' ' +
    chalk.hex(color)(`${Math.round(value)}%`)
  );
}

export function gradientText(text: string, startColor: string, endColor: string): string {
  const chars = text.split('');
  return chars
    .map((char, i) => {
      const color = i % 2 === 0 ? startColor : endColor;
      return chalk.hex(color)(char);
    })
    .join('');
}

export function rainbow(text: string): string {
  const rainbowColors = [
    colors.error,
    colors.orange,
    colors.warning,
    colors.success,
    colors.cyan,
    colors.primary,
    colors.purple,
  ];

  return text
    .split('')
    .map((char, i) => chalk.hex(rainbowColors[i % rainbowColors.length])(char))
    .join('');
}

export function badge(text: string, bgColor: string, fgColor: string = '#000000'): string {
  return chalk.bgHex(bgColor).hex(fgColor).bold(` ${text} `);
}

export function difficultyBadge(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return badge('Easy', colors.success);
    case 'medium':
      return badge('Medium', colors.warning);
    case 'hard':
      return badge('Hard', colors.error);
    default:
      return badge(difficulty, colors.textMuted);
  }
}

export function statusIcon(status: string | null): string {
  switch (status) {
    case 'ac':
      return chalk.hex(colors.success)(icons.check);
    case 'notac':
      return chalk.hex(colors.warning)('○');
    default:
      return chalk.hex(colors.textDim)(' ');
  }
}

export function keyHint(key: string, label: string): string {
  return (
    chalk.hex(colors.textMuted)('[') +
    chalk.hex(colors.primary)(key) +
    chalk.hex(colors.textMuted)('] ') +
    chalk.hex(colors.text)(label)
  );
}

export function keyHints(hints: Array<{ key: string; label: string }>): string {
  return hints.map((h) => keyHint(h.key, h.label)).join('  ');
}

export function renderScreenTitle(title: string, subtitle: string, width: number): string[] {
  const maxWidth = Math.max(20, width);
  const titleLine = chalk.hex(colors.primary).bold(` ${title} `);
  const subtitleLine = chalk.hex(colors.textMuted)(truncate(subtitle, Math.max(8, maxWidth - 2)));
  return [center(titleLine, maxWidth), center(subtitleLine, maxWidth)];
}

export function renderSectionHeader(label: string, width: number): string {
  const safeWidth = Math.max(10, width);
  const prefix = chalk.hex(colors.primary).bold(` ${label} `);
  const remaining = Math.max(0, safeWidth - visibleLength(prefix));
  return prefix + chalk.hex(colors.textMuted)(borders.horizontal.repeat(remaining));
}

export function renderFooterHints(
  hints: Array<{ key: string; label: string }>,
  width: number,
  mode: 'normal' | 'compact' = 'normal'
): string[] {
  const safeWidth = Math.max(20, width);
  const normalized = mode === 'compact' ? hints.slice(0, 3) : hints;
  const hintText = keyHints(normalized);
  const wrapped = wrapLines([hintText], safeWidth);
  return wrapped.map((line) => center(line, safeWidth));
}

export function splitPane(
  leftLines: string[],
  rightLines: string[],
  width: number,
  height: number,
  ratio = 0.5
): string[] {
  const safeWidth = Math.max(20, width);
  const safeHeight = Math.max(1, height);
  const leftWidth = Math.max(8, Math.floor(safeWidth * ratio));
  const rightWidth = Math.max(8, safeWidth - leftWidth - 1);
  const left = [...leftLines];
  const right = [...rightLines];
  const lines: string[] = [];

  while (left.length < safeHeight) left.push('');
  while (right.length < safeHeight) right.push('');

  for (let i = 0; i < safeHeight; i++) {
    const leftCell = padEnd(truncate(left[i] ?? '', leftWidth), leftWidth);
    const rightCell = padEnd(truncate(right[i] ?? '', rightWidth), rightWidth);
    lines.push(leftCell + chalk.hex(colors.border)(borders.vertical) + rightCell);
  }

  return lines;
}

export const LEETCODE_LOGO = [
  '██╗     ███████╗███████╗████████╗ ██████╗ ██████╗ ██████╗ ███████╗',
  '██║     ██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗██╔════╝',
  '██║     █████╗  █████╗     ██║   ██║     ██║   ██║██║  ██║█████╗  ',
  '██║     ██╔══╝  ██╔══╝     ██║   ██║     ██║   ██║██║  ██║██╔══╝  ',
  '███████╗███████╗███████╗   ██║   ╚██████╗╚██████╔╝██████╔╝███████╗',
  '╚══════╝╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝',
];

export const LEETCODE_LOGO_SMALL = [
  '╦  ╔═╗╔═╗╔╦╗╔═╗╔═╗╔╦╗╔═╗',
  '║  ║╣ ║╣  ║ ║  ║ ║ ║║║╣ ',
  '╩═╝╚═╝╚═╝ ╩ ╚═╝╚═╝═╩╝╚═╝',
];

export function renderLogo(width: number): string[] {
  const logo = width >= 80 ? LEETCODE_LOGO : LEETCODE_LOGO_SMALL;
  return logo.map((line) => center(chalk.hex(colors.primary)(line), width));
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;

export function spinner(): string {
  const frame = SPINNER_FRAMES[spinnerIndex % SPINNER_FRAMES.length];
  spinnerIndex++;
  return chalk.hex(colors.primary)(frame);
}

export function tableRow(
  cells: Array<{ content: string; width: number; align?: 'left' | 'right' | 'center' }>,
  selected: boolean = false
): string {
  const row = cells
    .map((cell) => {
      let content = cell.content;
      const stripped = stripAnsi(content);

      if (stripped.length > cell.width) {
        content = truncate(content, cell.width);
      }

      switch (cell.align) {
        case 'right':
          return padStart(content, cell.width);
        case 'center':
          return center(content, cell.width);
        default:
          return padEnd(content, cell.width);
      }
    })
    .join('');

  if (selected) {
    return chalk.bgHex(colors.bgHighlight)(row);
  }
  return row;
}

export function wrapLines(lines: readonly string[], maxWidth: number): string[] {
  const safeMaxWidth = Math.max(1, maxWidth);
  const result: string[] = [];

  for (const line of lines) {
    const stripped = stripAnsi(line);
    if (stripped.length <= safeMaxWidth) {
      result.push(line);
      continue;
    }

    const words = line.split(' ');
    let currentLine = '';
    let currentLen = 0;

    for (const word of words) {
      const wordLen = stripAnsi(word).length;

      if (wordLen > safeMaxWidth) {
        if (currentLen > 0) {
          result.push(currentLine);
          currentLine = '';
          currentLen = 0;
        }

        let remainingWord = word;
        while (stripAnsi(remainingWord).length > 0) {
          const chunk = remainingWord.slice(0, safeMaxWidth);

          result.push(chunk);
          remainingWord = remainingWord.slice(safeMaxWidth);
        }
        continue;
      }

      const spacer = currentLine ? 1 : 0;
      if (currentLen + wordLen + spacer <= safeMaxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
        currentLen += wordLen + spacer;
      } else {
        result.push(currentLine);
        currentLine = word;
        currentLen = wordLen;
      }
    }
    if (currentLine) result.push(currentLine);
  }
  return result;
}
