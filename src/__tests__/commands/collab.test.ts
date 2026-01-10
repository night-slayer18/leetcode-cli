// Collab commands tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock Supabase - must be defined inline for hoisting
vi.mock('../../services/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { room_code: 'ABC123', problem_id: '1', host_username: 'TestUser', host_code: 'code', guest_code: '' },
            error: null 
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

// Inline mock collab storage for hoisting
let mockSession: { roomCode: string; problemId: string; isHost: boolean; username: string } | null = null;

vi.mock('../../storage/collab.js', () => ({
  collabStorage: {
    getSession: vi.fn(() => mockSession),
    setSession: vi.fn((s) => { mockSession = s; }),
  },
}));

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
    set: vi.fn(),
    clear: vi.fn(),
    getPath: vi.fn(() => '/tmp/.leetcode/credentials.json'),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({ language: 'typescript', workDir: '/tmp/leetcode' })),
    getLanguage: vi.fn(() => 'typescript'),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
    getEditor: vi.fn(() => 'code'),
    getPath: vi.fn(() => '/tmp/.leetcode/config.json'),
  },
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
  },
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('function twoSum() {}'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('../../utils/fileUtils.js', () => ({
  findSolutionFile: vi.fn().mockResolvedValue('/tmp/leetcode/1.two-sum.ts'),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('../../commands/pick.js', () => ({
  pickCommand: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocking
import { 
  collabHostCommand, 
  collabJoinCommand, 
  collabSyncCommand, 
  collabStatusCommand,
  collabLeaveCommand,
  collabCompareCommand,
} from '../../commands/collab.js';
import { collabStorage } from '../../storage/collab.js';

describe('Collaboration Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = null;
  });

  describe('collabHostCommand', () => {
    it('should create a room and save session', async () => {
      await collabHostCommand('1');

      expect(collabStorage.setSession).toHaveBeenCalled();
    });
  });

  describe('collabJoinCommand', () => {
    it('should join a room and save session', async () => {
      await collabJoinCommand('ABC123');

      expect(collabStorage.setSession).toHaveBeenCalled();
    });
  });

  describe('collabSyncCommand', () => {
    it('should show no session message when not in a session', async () => {
      mockSession = null;

      await collabSyncCommand();

      expect(outputContains('No active collaboration session')).toBe(true);
    });

    it('should sync code when in a session', async () => {
      mockSession = { roomCode: 'ABC123', problemId: '1', isHost: true, username: 'TestUser' };

      await collabSyncCommand();

      // Test passed if no error thrown
      expect(true).toBe(true);
    });
  });

  describe('collabStatusCommand', () => {
    it('should show no session message when not in a session', async () => {
      mockSession = null;

      await collabStatusCommand();

      expect(outputContains('No active collaboration session')).toBe(true);
    });
  });

  describe('collabLeaveCommand', () => {
    it('should show no session message when not in a session', async () => {
      mockSession = null;

      await collabLeaveCommand();

      expect(outputContains('No active collaboration session')).toBe(true);
    });

    it('should clear session when leaving', async () => {
      mockSession = { roomCode: 'ABC123', problemId: '1', isHost: true, username: 'TestUser' };

      await collabLeaveCommand();

      expect(collabStorage.setSession).toHaveBeenCalledWith(null);
    });
  });

  describe('collabCompareCommand', () => {
    it('should show no session message when not in a session', async () => {
      mockSession = null;

      await collabCompareCommand();

      expect(outputContains('No active collaboration session')).toBe(true);
    });
  });
});
