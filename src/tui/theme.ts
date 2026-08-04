export type ThemeName = 'dark' | 'light' | 'auto';

export const SUPPORTED_THEMES: readonly ThemeName[] = ['dark', 'light', 'auto'];

export interface Palette {
  primary: string;
  primaryDark: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  text: string;
  textMuted: string;
  textDim: string;
  bg: string;
  panel: string;
  border: string;
  borderFocus: string;
  textBright: string;
  bgHighlight: string;
  cyan: string;
  orange: string;
  purple: string;
}

export const darkPalette: Palette = {
  primary: '#00B8D4',
  primaryDark: '#006064',
  secondary: '#FF4081',
  success: '#00E676',
  warning: '#FFEA00',
  error: '#FF1744',
  info: '#2979FF',
  text: '#FFFFFF',
  textMuted: '#90A4AE',
  textDim: '#546E7A',
  bg: '#000000',
  panel: '#1A1A1A',
  border: '#37474F',
  borderFocus: '#00B8D4',
  textBright: '#FFFFFF',
  bgHighlight: '#263238',
  cyan: '#00E5FF',
  orange: '#FF9800',
  purple: '#9C27B0',
};

export const lightPalette: Palette = {
  primary: '#00838F',
  primaryDark: '#004D5A',
  secondary: '#C2185B',
  success: '#1B7A2E',
  warning: '#B26A00',
  error: '#C62828',
  info: '#1565C0',
  text: '#1C1C1C',
  textMuted: '#4A5860',
  textDim: '#78909C',
  bg: '#FFFFFF',
  panel: '#F5F7F8',
  border: '#B0BEC5',
  borderFocus: '#00838F',
  textBright: '#000000',
  bgHighlight: '#E1ECF0',
  cyan: '#00838F',
  orange: '#E65100',
  purple: '#6A1B9A',
};

/**
 * The active palette. Consumers destructure `colors` at import time, so
 * we keep the same object identity and mutate fields when the theme changes.
 */
export const colors: Palette = { ...darkPalette };

let cachedAutoTheme: 'dark' | 'light' | null = null;

function parseOsc11(response: string): 'dark' | 'light' | null {
  // Terminals reply with: \x1b]11;rgb:RRRR/GGGG/BBBB\x07  (or ST \x1b\\)
  const match = response.match(/rgb:([0-9a-f]+)\/([0-9a-f]+)\/([0-9a-f]+)/i);
  if (!match) return null;

  const scale = (h: string) => {
    const n = Number.parseInt(h, 16);
    if (!Number.isFinite(n)) return NaN;
    // Normalize regardless of channel width (2, 4, ... hex digits).
    return n / (16 ** h.length - 1);
  };
  const r = scale(match[1]);
  const g = scale(match[2]);
  const b = scale(match[3]);
  if (![r, g, b].every(Number.isFinite)) return null;

  // Perceived luminance (Rec. 709).
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? 'light' : 'dark';
}

/**
 * Ask the terminal for its background color via OSC 11. Times out quickly so
 * unsupported terminals fall through to COLORFGBG / dark.
 */
export async function detectTerminalTheme(timeoutMs = 100): Promise<'dark' | 'light' | null> {
  const { stdin, stdout } = process;
  if (!stdin.isTTY || !stdout.isTTY) return null;

  return new Promise((resolve) => {
    let buffer = '';
    let done = false;
    const wasRaw = stdin.isRaw;

    const finish = (result: 'dark' | 'light' | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      stdin.removeListener('data', onData);
      try {
        stdin.setRawMode(wasRaw);
      } catch {
        // ignore
      }
      if (!wasRaw) stdin.pause();
      resolve(result);
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const parsed = parseOsc11(buffer);
      if (parsed) finish(parsed);
      else if (buffer.length > 128) finish(null);
    };

    try {
      stdin.setRawMode(true);
    } catch {
      resolve(null);
      return;
    }
    stdin.resume();
    stdin.on('data', onData);

    const timer = setTimeout(() => finish(null), timeoutMs);
    stdout.write('\x1b]11;?\x1b\\');
  });
}

function resolveFromEnv(): 'dark' | 'light' | null {
  // COLORFGBG is set by rxvt-style terminals as "fg;bg" (e.g. "15;0" dark, "0;15" light).
  const raw = process.env.COLORFGBG;
  if (!raw) return null;
  const parts = raw.split(';');
  const bg = parts[parts.length - 1];
  const n = Number.parseInt(bg, 10);
  if (!Number.isFinite(n)) return null;
  return n >= 7 && n <= 15 ? 'light' : 'dark';
}

/**
 * Run terminal-theme detection once and cache it. Call this before
 * `applyTheme('auto')` so the async probe can inform the palette choice.
 */
export async function primeAutoTheme(): Promise<void> {
  if (cachedAutoTheme) return;
  const detected = await detectTerminalTheme();
  cachedAutoTheme = detected ?? resolveFromEnv() ?? 'dark';
}

function resolveAuto(): 'dark' | 'light' {
  return cachedAutoTheme ?? resolveFromEnv() ?? 'dark';
}

export function resolveTheme(name: ThemeName | undefined): 'dark' | 'light' {
  if (name === 'light') return 'light';
  if (name === 'dark') return 'dark';
  return resolveAuto();
}

export function applyTheme(name: ThemeName | undefined): void {
  const resolved = resolveTheme(name);
  const source = resolved === 'light' ? lightPalette : darkPalette;
  Object.assign(colors, source);
}

export function normalizeThemeInput(input: string): ThemeName | null {
  const normalized = input.trim().toLowerCase();
  return (SUPPORTED_THEMES as readonly string[]).includes(normalized)
    ? (normalized as ThemeName)
    : null;
}

export const icons = {
  check: '✔',
  cross: '✖',
  dot: '•',
  star: '★',
  heart: '♥',
  warning: '⚠',
  info: 'ℹ',
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  line: '─',
  corner: '└',
  stats: '📊',
  gear: '⚙',
  user: '👤',
  clock: '⏱',
  calendar: '📅',
  lock: '🔒',
  folder: '📂',
  target: '🎯',
  fire: '🔥',
  arrow: '→',
  code: '📝',
};

export const borders = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  leftT: '├',
  rightT: '┤',
  topT: '┬',
  bottomT: '┴',
  cross: '┼',

  roundTopLeft: '╭',
  roundTopRight: '╮',
  roundBottomLeft: '╰',
  roundBottomRight: '╯',

  heavyHorizontal: '━',
  heavyVertical: '┃',
};

export const layout = {
  padding: 1,
  margin: 1,
  indent: '  ',
  tableColumns: {
    selector: 2,
    status: 3,
    id: 6,
    difficulty: 10,
    acceptance: 8,
    premium: 2,
  },
};

export const fonts = {};

export const progressChars = {
  bar: ['░', '▒', '▓', '█'],
  braille: ['⡀', '⣀', '⣄', '⣤', '⣦', '⣶', '⣷', '⣿'],
  filled: '█',
  empty: '░',
};
