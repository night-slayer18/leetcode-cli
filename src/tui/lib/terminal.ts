

import ansiEscapes from 'ansi-escapes';

export const ENTER_ALT_SCREEN = '\x1b[?1049h';
export const EXIT_ALT_SCREEN = '\x1b[?1049l';
export const HIDE_CURSOR = '\x1b[?25l';
export const SHOW_CURSOR = '\x1b[?25h';
export const CLEAR_SCREEN = '\x1bc';

export function enterAltScreen(): void {
  process.stdout.write(ENTER_ALT_SCREEN);
  process.stdout.write(HIDE_CURSOR);
}

export function exitAltScreen(): void {
  process.stdout.write(SHOW_CURSOR);
  process.stdout.write(EXIT_ALT_SCREEN);
  
  process.stdout.write('\x1b[0m'); 
}

export function exitAltScreenAsync(): Promise<void> {
  return new Promise((resolve) => {
    process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN + '\x1b[0m', () => {
      resolve();
    });
  });
}

export function clearScreen(): void {
  process.stdout.write(ansiEscapes.cursorTo(0, 0));
  process.stdout.write(ansiEscapes.eraseScreen);
}

export function moveCursor(x: number, y: number): void {
  process.stdout.write(ansiEscapes.cursorTo(x, y));
}

export function writeAt(x: number, y: number, text: string): void {
  process.stdout.write(ansiEscapes.cursorTo(x, y));
  process.stdout.write(text);
}

export function eraseLine(y: number): void {
  process.stdout.write(ansiEscapes.cursorTo(0, y));
  process.stdout.write(ansiEscapes.eraseLine);
}

export function getTerminalSize(): { width: number; height: number } {
  return {
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24,
  };
}

export function enableRawMode(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
}

export function disableRawMode(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}
