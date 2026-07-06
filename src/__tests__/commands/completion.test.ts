import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Import setup helpers
import { mockConsole } from '../setup.js';
import { completionCommand } from '../../commands/completion.js';

describe('Completion Command', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.clearAllMocks();
  });

  it('should generate zsh autocompletion script', async () => {
    await completionCommand('zsh');

    const output = mockConsole.logs.join('\n');
    expect(output).toContain('#compdef leetcode');
    expect(output).toContain('_leetcode()');
    expect(output).toContain('workspace subcommand');
  });

  it('should generate bash autocompletion script', async () => {
    await completionCommand('bash');

    const output = mockConsole.logs.join('\n');
    expect(output).toContain('_leetcode_completion()');
    expect(output).toContain('complete -F _leetcode_completion leetcode');
  });

  it('should generate fish autocompletion script', async () => {
    await completionCommand('fish');

    const output = mockConsole.logs.join('\n');
    expect(output).toContain('complete -c leetcode -f');
    expect(output).toContain('__fish_seen_subcommand_from');
  });

  it('should exit and print error for unsupported shell', async () => {
    await completionCommand('invalid_shell');

    expect(process.exit).toHaveBeenCalledWith(1);
    const errors = mockConsole.errors.join('\n');
    expect(errors).toContain('Unsupported shell: invalid_shell');
  });
});
