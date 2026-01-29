// Editor utility - cross-platform file opening
import { spawn } from 'child_process';
import open from 'open';
import chalk from 'chalk';
import { config } from '../storage/config.js';

/** Terminal editors that require foreground execution */
const TERMINAL_EDITORS = ['vim', 'nvim', 'vi', 'nano', 'emacs', 'micro', 'helix'];

/** VS Code family editors with workspace support */
const VSCODE_EDITORS = ['code', 'code-insiders', 'cursor', 'codium', 'vscodium'];

/**
 * Opens a file in the user's configured editor.
 *
 * - For terminal editors: prints the command for manual execution
 * - For VS Code family: opens workspace and navigates to file
 * - For other editors: uses `open` package for cross-platform support
 *
 * @param filePath - Absolute path to the file to open
 * @param workDir - Optional workspace directory (used by VS Code editors)
 */
export async function openInEditor(filePath: string, workDir?: string): Promise<void> {
  const editor = config.getEditor() ?? process.env.EDITOR ?? 'code';
  const workspace = workDir ?? config.getWorkDir();

  // Terminal editors need to run in foreground with inherited stdio
  if (TERMINAL_EDITORS.includes(editor)) {
    // We assume the TUI has been suspended by the caller (runtime.ts)
    // and stdin is paused. We need to unpause stdin for the editor if we want it to work?
    // Actually, spawn with 'inherit' passes the real FD.
    const child = spawn(editor, [filePath], {
        stdio: 'inherit'
    });
    
    return new Promise((resolve, reject) => {
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Editor exited with code ${code}`));
        });
        child.on('error', (err) => {
             reject(new Error(`Failed to start editor: ${err.message}`));
        });
    });
  }

  try {
    // VS Code family: open workspace and navigate to file
    if (VSCODE_EDITORS.includes(editor)) {
      const child = spawn(editor, ['-r', workspace, '-g', filePath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return;
    }

    // Other GUI editors: use cross-platform `open` package
    await open(filePath, { app: { name: editor } });
  } catch (error) {
    throw new Error(`Failed to open editor '${editor}'. Make sure it is installed and in your PATH.`);
  }
}
