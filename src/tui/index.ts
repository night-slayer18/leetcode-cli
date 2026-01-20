/**
 * TUI Entry Point
 * Launches the TUI application with alternate screen buffer
 */
import { render } from 'ink';
import React from 'react';
import { App } from './App.js';

interface LaunchOptions {
  username?: string;
}

// ANSI escape codes for alternate screen buffer
const ENTER_ALT_SCREEN = '\x1b[?1049h';
const EXIT_ALT_SCREEN = '\x1b[?1049l';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const CLEAR_SCREEN = '\x1bc';

export async function launchTUI(options: LaunchOptions = {}) {
  const { username } = options;

  // Enter alternate screen buffer (like vim, htop, less)
  process.stdout.write(ENTER_ALT_SCREEN);
  process.stdout.write(HIDE_CURSOR);
  process.stdout.write(CLEAR_SCREEN);

  // Handle cleanup on exit
  const cleanup = () => {
    process.stdout.write(SHOW_CURSOR);
    process.stdout.write(EXIT_ALT_SCREEN);
  };

  // Handle unexpected exits
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  try {
    const { waitUntilExit } = render(React.createElement(App, { username }), {
      exitOnCtrlC: true,
    });

    await waitUntilExit();
  } finally {
    cleanup();
  }
}
