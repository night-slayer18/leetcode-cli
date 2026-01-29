// Editor utility - cross-platform file opening
import { spawn } from 'child_process';
import open from 'open';
import { config } from '../storage/config.js';

const TERMINAL_EDITORS = ['vim', 'nvim', 'vi', 'nano', 'emacs', 'micro', 'helix'];

const VSCODE_EDITORS = ['code', 'code-insiders', 'cursor', 'codium', 'vscodium'];

export async function openInEditor(filePath: string, workDir?: string): Promise<void> {
  const editor = config.getEditor() ?? process.env.EDITOR ?? 'code';
  const workspace = workDir ?? config.getWorkDir();

  if (TERMINAL_EDITORS.includes(editor)) {
    const child = spawn(editor, [filePath], {
      stdio: 'inherit',
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
    if (VSCODE_EDITORS.includes(editor)) {
      const child = spawn(editor, ['-r', workspace, '-g', filePath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return;
    }

    await open(filePath, { app: { name: editor } });
  } catch {
    throw new Error(
      `Failed to open editor '${editor}'. Make sure it is installed and in your PATH.`
    );
  }
}
