import { stdin, stdout } from 'node:process';
import ansiEscapes from 'ansi-escapes';
import cliCursor from 'cli-cursor';
import type { AppModel, AppMsg, Command } from './types.js';
import { update } from './update.js';
import { view } from './view.js';
import { executeCommand } from './commands/effects.js';
import { parseKeyEvent } from './lib/keys.js';
import { enterAltScreen, exitAltScreen, enableRawMode, disableRawMode } from './lib/terminal.js';
import { notesCommand } from '../commands/notes.js';

let currentModel: AppModel;
let isRunning = false;

export function dispatch(msg: AppMsg): void {
  if (!isRunning) return;

  const [newModel, cmd] = update(msg, currentModel);
  currentModel = newModel;

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

          lastRenderedOutput = '';
          stdout.write(ansiEscapes.cursorTo(0, 0));
          stdout.write(ansiEscapes.eraseScreen);
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

function render(): void {
  if (!isRunning) return;
  const output = view(currentModel);

  if (output === lastRenderedOutput) return;
  lastRenderedOutput = output;

  stdout.write(ansiEscapes.cursorTo(0, 0));
  stdout.write(ansiEscapes.eraseScreen);
  stdout.write(output);
}

function handleInput(data: Buffer | string): void {
  const keyEvent = parseKeyEvent(data);
  dispatch({ type: 'KEY_PRESS', key: keyEvent });
}

let isCleanedUp = false;

function cleanup(): void {
  if (isCleanedUp) return;
  isCleanedUp = true;
  isRunning = false;
  exitAltScreen();
  cliCursor.show();
  disableRawMode();
}

function suspendTUI(): void {
  exitAltScreen();
  cliCursor.show();
  disableRawMode();
  stdin.pause();
}

function resumeTUI(): void {
  enterAltScreen();
  cliCursor.hide();
  enableRawMode();
  stdin.resume();
}

export async function runApp(initialModel: AppModel): Promise<void> {
  currentModel = initialModel;
  isRunning = true;

  enterAltScreen();
  cliCursor.hide();
  enableRawMode();

  stdin.on('data', handleInput);

  stdout.on('resize', () => {
    dispatch({
      type: 'RESIZE',
      width: stdout.columns || 80,
      height: stdout.rows || 24,
    });
  });

  dispatch({ type: 'INIT' });

  const gracefulExit = () => {
    cleanup();
    process.exit(0);
  };

  process.on('SIGINT', gracefulExit);
  process.on('SIGTERM', gracefulExit);

  process.on('exit', () => cleanup());

  await new Promise<void>((resolve) => {});
}

export function forceExit(): void {
  cleanup();
  process.exit(0);
}
