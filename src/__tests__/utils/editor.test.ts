import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const { editorMock, workDirMock, spawnMock, openMock } = vi.hoisted(() => ({
  editorMock: vi.fn(() => 'zed'),
  workDirMock: vi.fn(() => '/tmp/leetcode'),
  spawnMock: vi.fn(),
  openMock: vi.fn(),
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getEditor: editorMock,
    getWorkDir: workDirMock,
  },
}));

vi.mock('child_process', () => ({ spawn: spawnMock }));
vi.mock('open', () => ({ default: openMock }));

import { openInEditor } from '../../utils/editor.js';

function createChildProcess() {
  return Object.assign(new EventEmitter(), { unref: vi.fn() });
}

describe('openInEditor', () => {
  it.each(['zed', 'zeditor', 'zed.exe'])('launches %s with only the file path', async (editor) => {
    const child = createChildProcess();
    editorMock.mockReturnValueOnce(editor);
    spawnMock.mockReturnValueOnce(child);

    const opening = openInEditor('/tmp/leetcode/Easy/Array/1.two-sum.ts', '/tmp/leetcode');
    child.emit('spawn');
    await opening;

    expect(spawnMock).toHaveBeenCalledWith(
      editor,
      ['/tmp/leetcode/Easy/Array/1.two-sum.ts'],
      { detached: true, stdio: 'ignore' }
    );
    expect(child.unref).toHaveBeenCalledOnce();
    expect(openMock).not.toHaveBeenCalled();
  });

  it('reports a missing Zed executable with the friendly editor message', async () => {
    const child = createChildProcess();
    editorMock.mockReturnValueOnce('zed');
    spawnMock.mockReturnValueOnce(child);

    const opening = openInEditor('/tmp/solution.ts');
    child.emit('error', new Error('spawn zed ENOENT'));

    await expect(opening).rejects.toThrow(
      "Failed to open editor 'zed'. Make sure it is installed and in your PATH."
    );
    expect(child.unref).toHaveBeenCalledOnce();
  });

  it('preserves the existing VS Code launch arguments', async () => {
    const child = createChildProcess();
    editorMock.mockReturnValueOnce('code');
    spawnMock.mockReturnValueOnce(child);

    const opening = openInEditor('/tmp/solution.ts', '/tmp/leetcode');
    child.emit('spawn');
    await opening;

    expect(spawnMock).toHaveBeenCalledWith(
      'code',
      ['-r', '/tmp/leetcode', '-g', '/tmp/solution.ts'],
      { detached: true, stdio: 'ignore' }
    );
    expect(child.unref).toHaveBeenCalledOnce();
  });

  it('uses the configured editor before EDITOR', async () => {
    const previousEditor = process.env.EDITOR;
    process.env.EDITOR = 'code';
    editorMock.mockReturnValueOnce('zed');
    const child = createChildProcess();
    spawnMock.mockReturnValueOnce(child);

    const opening = openInEditor('/tmp/solution.ts');
    child.emit('spawn');
    await opening;

    expect(spawnMock).toHaveBeenCalledWith('zed', ['/tmp/solution.ts'], {
      detached: true,
      stdio: 'ignore',
    });

    if (previousEditor === undefined) delete process.env.EDITOR;
    else process.env.EDITOR = previousEditor;
  });
});
