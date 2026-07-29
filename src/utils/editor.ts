// Editor utility - cross-platform file opening
import { spawn } from 'child_process';
import open from 'open';
import { config } from '../storage/config.js';

const TERMINAL_EDITORS = ['vim', 'nvim', 'vi', 'nano', 'emacs', 'micro', 'helix'];

const VSCODE_EDITORS = ['code', 'code-insiders', 'cursor', 'codium', 'vscodium'];

const ZED_EDITORS = ['zed', 'zeditor', 'zed.exe'];

function spawnDetached(editor: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(editor, args, {
      detached: true,
      stdio: 'ignore',
    });

    child.once('error', reject);
    child.once('spawn', resolve);
    child.unref();
  });
}

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
    if (ZED_EDITORS.includes(editor)) {
      await spawnDetached(editor, [filePath]);
      return;
    }

    if (VSCODE_EDITORS.includes(editor)) {
      await spawnDetached(editor, ['-r', workspace, '-g', filePath]);
      return;
    }

    await open(filePath, { app: { name: editor } });
  } catch {
    throw new Error(
      `Failed to open editor '${editor}'. Make sure it is installed and in your PATH.`
    );
  }
}
