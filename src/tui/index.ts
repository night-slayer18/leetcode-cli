

import { runApp } from './runtime.js';
import { createInitialModel } from './types.js';

interface LaunchOptions {
  username?: string;
}

export async function launchTUI(options: LaunchOptions = {}): Promise<void> {
  const { username } = options;
  const initialModel = createInitialModel(username);
  await runApp(initialModel);
}
