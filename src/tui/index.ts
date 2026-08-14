import { runApp } from './runtime.js';
import { createInitialModel } from './types.js';
import { applyTheme, primeAutoTheme } from './theme.js';
import { config } from '../storage/config.js';

interface LaunchOptions {
  username?: string;
}

export async function launchTUI(options: LaunchOptions = {}): Promise<void> {
  const { username } = options;
  const theme = config.getTheme();
  if (theme === 'auto') {
    await primeAutoTheme();
  }
  applyTheme(theme);
  const initialModel = createInitialModel(username);
  await runApp(initialModel);
}
