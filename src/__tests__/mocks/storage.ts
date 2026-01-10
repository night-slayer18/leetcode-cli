// Mock storage modules
import { vi } from 'vitest';
import type { SupportedLanguage } from '../../types.js';

// Mock config
export const mockConfig = {
  language: 'typescript' as SupportedLanguage,
  workDir: '/tmp/leetcode-test',
  editor: 'code',
  repo: undefined as string | undefined,
};

export function createMockConfigStorage() {
  return {
    getConfig: vi.fn().mockReturnValue(mockConfig),
    getLanguage: vi.fn().mockReturnValue(mockConfig.language),
    getWorkDir: vi.fn().mockReturnValue(mockConfig.workDir),
    getEditor: vi.fn().mockReturnValue(mockConfig.editor),
    getRepo: vi.fn().mockReturnValue(mockConfig.repo),
    setLanguage: vi.fn(),
    setWorkDir: vi.fn(),
    setEditor: vi.fn(),
    setRepo: vi.fn(),
    deleteRepo: vi.fn(),
    getPath: vi.fn().mockReturnValue('/tmp/.leetcode/config.json'),
  };
}

// Mock credentials
export const mockCredentials = {
  session: 'mock-session-token',
  csrfToken: 'mock-csrf-token',
};

export function createMockCredentialsStorage() {
  let storedCredentials: typeof mockCredentials | null = mockCredentials;
  
  return {
    get: vi.fn(() => storedCredentials),
    set: vi.fn((creds) => { storedCredentials = creds; }),
    clear: vi.fn(() => { storedCredentials = null; }),
    getPath: vi.fn().mockReturnValue('/tmp/.leetcode/credentials.json'),
  };
}

// Mock collab storage
export const mockCollabSession = {
  roomCode: 'ABC123',
  problemId: '1',
  isHost: true,
  username: 'TestUser',
};

export function createMockCollabStorage() {
  let session: typeof mockCollabSession | null = null;
  
  return {
    getSession: vi.fn(() => session),
    setSession: vi.fn((s) => { session = s; }),
  };
}

// Mock timer storage
export function createMockTimerStorage() {
  let activeTimer: { problemId: string; startedAt: string; durationMinutes: number } | null = null;
  const solveTimes: Record<string, unknown[]> = {};
  
  return {
    startTimer: vi.fn((problemId, title, difficulty, duration) => {
      activeTimer = { problemId, startedAt: new Date().toISOString(), durationMinutes: duration };
    }),
    getActiveTimer: vi.fn(() => activeTimer),
    stopTimer: vi.fn(() => {
      if (!activeTimer) return null;
      const result = { durationSeconds: 120 };
      activeTimer = null;
      return result;
    }),
    recordSolveTime: vi.fn(),
    getSolveTimes: vi.fn((id) => solveTimes[id] || []),
    getAllSolveTimes: vi.fn(() => solveTimes),
    getStats: vi.fn(() => ({ totalProblems: 10, totalTime: 3600, avgTime: 360 })),
  };
}
