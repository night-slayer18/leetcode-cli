

import type { KeyEvent } from '../types.js';

const KEY_SEQUENCES: Record<string, string> = {
  '\x1b[A': 'up',
  '\x1b[B': 'down',
  '\x1b[C': 'right',
  '\x1b[D': 'left',
  '\x1b[5~': 'pageup',
  '\x1b[6~': 'pagedown',
  '\x1b[H': 'home',
  '\x1b[F': 'end',
  '\x1b[2~': 'insert',
  '\x1b[3~': 'delete',
  '\x1b': 'escape',
  '\r': 'return',
  '\n': 'return',
  '\x7f': 'backspace',
  '\b': 'backspace',
  ' ': 'space',
  '\t': 'tab',
};

export function parseKeyEvent(data: Buffer | string): KeyEvent {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const seq = buf.toString();

  const ctrl = buf.length === 1 && buf[0] < 27;

  const meta = buf.length === 2 && buf[0] === 27;

  let name: string;

  if (KEY_SEQUENCES[seq]) {
    name = KEY_SEQUENCES[seq];
  } else if (ctrl && buf.length === 1) {
    
    name = String.fromCharCode(buf[0] + 96);
  } else if (meta && buf.length === 2) {
    
    name = String.fromCharCode(buf[1]);
  } else {
    
    name = seq;
  }

  const shift = /^[A-Z]$/.test(name);

  return {
    name,
    sequence: seq,
    ctrl,
    meta,
    shift,
  };
}

export function isKey(event: KeyEvent, name: string): boolean {
  return event.name === name;
}

export function isCtrlKey(event: KeyEvent, letter: string): boolean {
  return event.ctrl && event.name === letter.toLowerCase();
}

export function isChar(event: KeyEvent, char: string): boolean {
  return event.sequence === char && !event.ctrl && !event.meta;
}

export function isPrintableChar(event: KeyEvent): boolean {
  return (
    event.sequence.length === 1 &&
    !event.ctrl &&
    !event.meta &&
    event.sequence.charCodeAt(0) >= 32 &&
    event.sequence.charCodeAt(0) <= 126
  );
}
