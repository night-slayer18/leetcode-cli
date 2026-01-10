// Timer command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock storage
let mockActiveTimer: { problemId: string; title: string; difficulty: string; startedAt: string; durationMinutes: number } | null = null;

vi.mock('../../storage/timer.js', () => ({
  timerStorage: {
    startTimer: vi.fn((problemId, title, difficulty, duration) => {
      mockActiveTimer = { problemId, title, difficulty, startedAt: new Date().toISOString(), durationMinutes: duration };
    }),
    getActiveTimer: vi.fn(() => mockActiveTimer),
    stopTimer: vi.fn(() => {
      if (!mockActiveTimer) return null;
      mockActiveTimer = null;
      return { durationSeconds: 120 };
    }),
    recordSolveTime: vi.fn(),
    getSolveTimes: vi.fn((problemId) => {
      if (problemId === '1') {
        return [{ title: 'Two Sum', durationSeconds: 600, timerMinutes: 20, solvedAt: new Date().toISOString() }];
      }
      return [];
    }),
    getAllSolveTimes: vi.fn(() => ({
      '1': [{ title: 'Two Sum', durationSeconds: 600, timerMinutes: 20, solvedAt: new Date().toISOString() }],
    })),
    getStats: vi.fn(() => ({ totalProblems: 10, totalTime: 3600, avgTime: 360 })),
  },
}));

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({ language: 'typescript', workDir: '/tmp/leetcode' })),
    getLanguage: vi.fn(() => 'typescript'),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
  },
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getProblemById: vi.fn().mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
    }),
    getProblem: vi.fn().mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
    }),
  },
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
import { timerCommand } from '../../commands/timer.js';
import { timerStorage } from '../../storage/timer.js';

describe('Timer Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTimer = null;
  });

  describe('start timer', () => {
    it('should start timer for a problem by ID', async () => {
      await timerCommand('1', {});

      expect(timerStorage.startTimer).toHaveBeenCalled();
    });

    it('should start timer for a problem by slug', async () => {
      await timerCommand('two-sum', {});

      expect(timerStorage.startTimer).toHaveBeenCalled();
    });

    it('should use custom duration with --minutes', async () => {
      await timerCommand('1', { minutes: 30 });

      expect(timerStorage.startTimer).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        30
      );
    });

    it('should use default duration based on difficulty', async () => {
      await timerCommand('1', {}); // Easy = 20 minutes

      expect(timerStorage.startTimer).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        20 // Default for Easy
      );
    });

    it('should show warning when timer already active', async () => {
      mockActiveTimer = { 
        problemId: '2', 
        title: 'Add Two Numbers', 
        difficulty: 'Medium', 
        startedAt: new Date().toISOString(), 
        durationMinutes: 40 
      };

      await timerCommand('1', {});

      // Should not start new timer
      expect(timerStorage.startTimer).not.toHaveBeenCalled();
      expect(outputContains('active timer')).toBe(true);
    });

    it('should show usage when no ID provided and not stopping/stats', async () => {
      await timerCommand(undefined, {});

      expect(outputContains('Please provide a problem ID')).toBe(true);
    });
  });

  describe('stop timer', () => {
    it('should stop active timer with --stop', async () => {
      mockActiveTimer = { 
        problemId: '1', 
        title: 'Two Sum', 
        difficulty: 'Easy', 
        startedAt: new Date().toISOString(), 
        durationMinutes: 20 
      };

      await timerCommand('', { stop: true });

      expect(timerStorage.stopTimer).toHaveBeenCalled();
    });

    it('should show message when no active timer to stop', async () => {
      mockActiveTimer = null;

      await timerCommand('', { stop: true });

      expect(outputContains('No active timer')).toBe(true);
    });
  });

  describe('stats', () => {
    it('should show overall timer stats with --stats', async () => {
      await timerCommand('', { stats: true });

      expect(timerStorage.getStats).toHaveBeenCalled();
    });

    it('should show stats for specific problem with --stats <id>', async () => {
      await timerCommand('1', { stats: true });

      expect(timerStorage.getSolveTimes).toHaveBeenCalledWith('1');
    });

    it('should show message when no stats for problem', async () => {
      await timerCommand('999', { stats: true });

      expect(timerStorage.getSolveTimes).toHaveBeenCalledWith('999');
      expect(outputContains('No solve times')).toBe(true);
    });
  });
});

