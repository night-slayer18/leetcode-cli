import { stdin, stdout } from 'node:process';
import ansiEscapes from 'ansi-escapes';
import cliCursor from 'cli-cursor';
import type { AppModel, AppMsg, Command } from './types.js';
import { update } from './update.js';
import { view } from './view.js';
import { executeCommand, shutdownEffects } from './commands/effects.js';
import { parseKeyEvent } from './lib/keys.js';
import { enterAltScreen, exitAltScreen, enableRawMode, disableRawMode } from './lib/terminal.js';
import { notesCommand } from '../commands/notes.js';

let currentModel: AppModel;
let isRunning = false;
let shouldFullRender = true;
let appResolve: (() => void) | null = null;
let isSuspended = false;
let resizeHandler: (() => void) | null = null;
let sigintHandler: (() => void) | null = null;
let sigtermHandler: (() => void) | null = null;

export function dispatch(msg: AppMsg): void {
  if (!isRunning) return;

  const previousScreen = currentModel.screenState.screen;
  const [newModel, cmd] = update(msg, currentModel);
  currentModel = newModel;

  if (previousScreen !== newModel.screenState.screen) {
    shouldFullRender = true;
    lastRenderedOutput = '';
    lastRenderedLines = [];
  }

  if (cmd.type !== 'CMD_NONE') {
    if (cmd.type === 'CMD_OPEN_EDITOR') {
      suspendTUI();
      notesCommand(cmd.id, 'edit', { silent: true })
        .catch((err) => {
          dispatch({
            type: 'GLOBAL_ERROR',
            error: err instanceof Error ? err.message : 'Failed to open editor',
          });
        })
        .finally(() => {
          resumeTUI();
          shouldFullRender = true;
          lastRenderedLines = [];
          currentModel = { ...currentModel, needsRender: true };

          dispatch({ type: 'PROBLEM_VIEW_NOTE' });

          render();
        });
    } else {
      executeCommand(cmd, dispatch);
    }
  }

  if (currentModel.needsRender) {
    render();
    currentModel = { ...currentModel, needsRender: false };
  }
}

let lastRenderedOutput = '';
let lastRenderedLines: string[] = [];
const ANSI_RESET = '\x1b[0m';

function render(): void {
  if (!isRunning) return;
  const nextOutput = view(currentModel);
  if (nextOutput === lastRenderedOutput) return;
  lastRenderedOutput = nextOutput;

  const nextLines = nextOutput.split('\n');

  if (shouldFullRender || lastRenderedLines.length === 0) {
    stdout.write(ANSI_RESET);
    stdout.write(ansiEscapes.cursorTo(0, 0));
    stdout.write(ansiEscapes.eraseScreen);
    stdout.write(nextOutput);
    stdout.write(ANSI_RESET);
    shouldFullRender = false;
    lastRenderedLines = nextLines;
    return;
  }

  const maxLines = Math.max(lastRenderedLines.length, nextLines.length);
  const chunks: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const prev = lastRenderedLines[i] ?? '';
    const next = nextLines[i] ?? '';
    if (prev === next) continue;

    chunks.push(ANSI_RESET);
    chunks.push(ansiEscapes.cursorTo(0, i));
    chunks.push(ansiEscapes.eraseLine);
    if (next.length > 0) chunks.push(next);
    chunks.push(ANSI_RESET);
  }

  if (chunks.length > 0) {
    stdout.write(chunks.join(''));
  }

  lastRenderedLines = nextLines;
}

function handleInput(data: Buffer | string): void {
  if (isSuspended || !isRunning) return;
  const keyEvent = parseKeyEvent(data);
  dispatch({ type: 'KEY_PRESS', key: keyEvent });
}

let isCleanedUp = false;

function cleanup(): void {
  if (isCleanedUp) return;
  isCleanedUp = true;
  isRunning = false;
  isSuspended = false;

  stdin.off('data', handleInput);

  if (resizeHandler) {
    stdout.off('resize', resizeHandler);
    resizeHandler = null;
  }
  if (sigintHandler) {
    process.off('SIGINT', sigintHandler);
    sigintHandler = null;
  }
  if (sigtermHandler) {
    process.off('SIGTERM', sigtermHandler);
    sigtermHandler = null;
  }

  shutdownEffects();
  stdout.write(ANSI_RESET);
  exitAltScreen();
  cliCursor.show();
  disableRawMode();
  stdin.pause();

  appResolve?.();
  appResolve = null;
}

function suspendTUI(): void {
  if (isSuspended) return;
  isSuspended = true;

  stdout.write(ANSI_RESET);
  exitAltScreen();
  cliCursor.show();
  disableRawMode();
  stdin.pause();
}

function resumeTUI(): void {
  if (!isRunning || !isSuspended) return;
  isSuspended = false;

  enterAltScreen();
  cliCursor.hide();
  enableRawMode();
  stdin.resume();
  shouldFullRender = true;
}

export async function runApp(initialModel: AppModel): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('TUI requires an interactive terminal');
  }

  const done = new Promise<void>((resolve) => {
    appResolve = resolve;
  });

  currentModel = initialModel;
  isRunning = true;
  isCleanedUp = false;
  shouldFullRender = true;
  lastRenderedOutput = '';
  lastRenderedLines = [];

  enterAltScreen();
  cliCursor.hide();
  enableRawMode();

  stdin.on('data', handleInput);

  resizeHandler = () => {
    dispatch({
      type: 'RESIZE',
      width: stdout.columns || 80,
      height: stdout.rows || 24,
    });
    shouldFullRender = true;
  };
  stdout.on('resize', resizeHandler);

  dispatch({ type: 'INIT' });

  sigintHandler = () => {
    requestExit();
  };
  sigtermHandler = () => {
    requestExit();
  };
  process.on('SIGINT', sigintHandler);
  process.on('SIGTERM', sigtermHandler);

  return await done;
}

export function requestExit(): void {
  cleanup();
}
