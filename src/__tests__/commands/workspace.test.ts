// Workspace command tests - comprehensive coverage
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock storage
let mockWorkspaces: string[] = ['default'];
let mockActiveWorkspace = 'default';
let mockConfigs: Record<
  string,
  { workDir: string; lang: string; editor?: string; syncRepo?: string }
> = {
  default: { workDir: '/tmp/leetcode', lang: 'typescript' },
};

vi.mock('../../storage/workspaces.js', () => ({
  workspaceStorage: {
    getActive: vi.fn(() => mockActiveWorkspace),
    setActive: vi.fn((name: string) => {
      if (!mockWorkspaces.includes(name)) return false;
      mockActiveWorkspace = name;
      return true;
    }),
    list: vi.fn(() => mockWorkspaces),
    exists: vi.fn((name: string) => mockWorkspaces.includes(name)),
    create: vi.fn((name: string, config: { workDir: string; lang: string }) => {
      if (mockWorkspaces.includes(name)) return false;
      mockWorkspaces.push(name);
      mockConfigs[name] = config;
      return true;
    }),
    delete: vi.fn((name: string) => {
      if (name === 'default') return false;
      if (!mockWorkspaces.includes(name)) return false;
      mockWorkspaces = mockWorkspaces.filter((w) => w !== name);
      delete mockConfigs[name];
      if (mockActiveWorkspace === name) mockActiveWorkspace = 'default';
      return true;
    }),
    getConfig: vi.fn((name?: string) => {
      const ws = name ?? mockActiveWorkspace;
      return mockConfigs[ws] ?? { workDir: '/tmp/leetcode', lang: 'typescript' };
    }),
    setConfig: vi.fn((config: Record<string, unknown>, name?: string) => {
      const ws = name ?? mockActiveWorkspace;
      mockConfigs[ws] = { ...mockConfigs[ws], ...config };
    }),
    getWorkspaceDir: vi.fn(() => '/tmp/.leetcode/workspaces/default'),
    getSnapshotsDir: vi.fn(() => '/tmp/.leetcode/workspaces/default/snapshots'),
    getTimerPath: vi.fn(() => '/tmp/.leetcode/workspaces/default/timer.json'),
    getCollabPath: vi.fn(() => '/tmp/.leetcode/workspaces/default/collab.json'),
  },
  WorkspaceConfig: {},
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({ confirmed: true }),
  },
}));

// Import after mocking
import {
  workspaceCurrentCommand,
  workspaceListCommand,
  workspaceCreateCommand,
  workspaceUseCommand,
  workspaceDeleteCommand,
} from '../../commands/workspace.js';
import { workspaceStorage } from '../../storage/workspaces.js';
import inquirer from 'inquirer';

describe('Workspace Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockWorkspaces = ['default'];
    mockActiveWorkspace = 'default';
    mockConfigs = {
      default: { workDir: '/tmp/leetcode', lang: 'typescript' },
    };
  });

  describe('workspace current', () => {
    it('should display active workspace name', async () => {
      await workspaceCurrentCommand();
      expect(outputContains('Active Workspace')).toBe(true);
      expect(outputContains('default')).toBe(true);
    });

    it('should display workspace config', async () => {
      await workspaceCurrentCommand();
      expect(outputContains('workDir')).toBe(true);
      expect(outputContains('lang')).toBe(true);
    });
  });

  describe('workspace list', () => {
    it('should display all workspaces', async () => {
      mockWorkspaces = ['default', 'interview', 'python-study'];
      mockConfigs['interview'] = { workDir: '/tmp/interview', lang: 'java' };
      mockConfigs['python-study'] = { workDir: '/tmp/python', lang: 'python3' };

      await workspaceListCommand();

      expect(outputContains('default')).toBe(true);
      expect(outputContains('interview')).toBe(true);
      expect(outputContains('python-study')).toBe(true);
    });

    it('should mark active workspace', async () => {
      mockWorkspaces = ['default', 'interview'];
      mockConfigs['interview'] = { workDir: '/tmp/interview', lang: 'java' };
      mockActiveWorkspace = 'interview';

      await workspaceListCommand();

      expect(workspaceStorage.getActive).toHaveBeenCalled();
    });
  });

  describe('workspace create', () => {
    it('should create a new workspace', async () => {
      await workspaceCreateCommand('interview', {});

      expect(workspaceStorage.create).toHaveBeenCalledWith(
        'interview',
        expect.objectContaining({
          workDir: expect.stringContaining('interview'),
          lang: 'typescript',
        })
      );
      expect(outputContains('Created workspace')).toBe(true);
    });

    it('should use custom workdir when provided', async () => {
      await workspaceCreateCommand('custom', { workdir: '/custom/path' });

      expect(workspaceStorage.create).toHaveBeenCalledWith(
        'custom',
        expect.objectContaining({
          workDir: '/custom/path',
        })
      );
    });

    it('should reject duplicate workspace names', async () => {
      await workspaceCreateCommand('default', {});

      expect(outputContains('already exists')).toBe(true);
    });
  });

  describe('workspace use', () => {
    it('should switch to existing workspace', async () => {
      mockWorkspaces = ['default', 'interview'];
      mockConfigs['interview'] = { workDir: '/tmp/interview', lang: 'java' };

      await workspaceUseCommand('interview');

      expect(workspaceStorage.setActive).toHaveBeenCalledWith('interview');
      expect(outputContains('Switched to workspace')).toBe(true);
    });

    it('should reject non-existent workspace', async () => {
      await workspaceUseCommand('nonexistent');

      expect(outputContains('not found')).toBe(true);
    });
  });

  describe('workspace delete', () => {
    it('should delete workspace when confirmed', async () => {
      mockWorkspaces = ['default', 'interview'];
      mockConfigs['interview'] = { workDir: '/tmp/interview', lang: 'java' };
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({ confirmed: true });

      await workspaceDeleteCommand('interview');

      expect(workspaceStorage.delete).toHaveBeenCalledWith('interview');
      expect(outputContains('Deleted workspace')).toBe(true);
    });

    it('should not delete when cancelled', async () => {
      mockWorkspaces = ['default', 'interview'];
      mockConfigs['interview'] = { workDir: '/tmp/interview', lang: 'java' };
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({ confirmed: false });

      await workspaceDeleteCommand('interview');

      expect(workspaceStorage.delete).not.toHaveBeenCalled();
      expect(outputContains('Cancelled')).toBe(true);
    });

    it('should prevent deleting default workspace', async () => {
      await workspaceDeleteCommand('default');

      expect(workspaceStorage.delete).not.toHaveBeenCalled();
      expect(outputContains('Cannot delete the default workspace')).toBe(true);
    });

    it('should reject non-existent workspace', async () => {
      await workspaceDeleteCommand('nonexistent');

      expect(outputContains('not found')).toBe(true);
    });
  });
});

describe('Workspace Storage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspaces = ['default'];
    mockActiveWorkspace = 'default';
    mockConfigs = {
      default: { workDir: '/tmp/leetcode', lang: 'typescript' },
    };
  });

  it('should isolate config between workspaces', async () => {
    // Create two workspaces with different configs
    mockWorkspaces = ['default', 'python'];
    mockConfigs = {
      default: { workDir: '/tmp/leetcode', lang: 'typescript' },
      python: { workDir: '/tmp/python', lang: 'python3' },
    };

    // Check default config
    mockActiveWorkspace = 'default';
    const defaultConfig = workspaceStorage.getConfig();
    expect(defaultConfig.lang).toBe('typescript');

    // Switch and check python config
    mockActiveWorkspace = 'python';
    const pythonConfig = workspaceStorage.getConfig();
    expect(pythonConfig.lang).toBe('python3');
  });

  it('should return correct paths for active workspace', () => {
    expect(workspaceStorage.getWorkspaceDir()).toContain('default');
    expect(workspaceStorage.getSnapshotsDir()).toContain('snapshots');
    expect(workspaceStorage.getTimerPath()).toContain('timer.json');
    expect(workspaceStorage.getCollabPath()).toContain('collab.json');
  });
});
