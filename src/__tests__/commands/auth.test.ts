// Authentication commands tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCredentialsStorage } from '../mocks/storage.js';
import { createMockLeetCodeClient } from '../mocks/leetcodeClient.js';
import { outputContains, getConsoleOutput } from '../setup.js';

// We need to mock modules before importing the commands
vi.mock('../../storage/credentials.js', () => ({
  credentials: createMockCredentialsStorage(),
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: createMockLeetCodeClient(),
}));

// Mock inquirer for login prompts
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({
      session: 'test-session',
      csrfToken: 'test-csrf',
    }),
  },
}));

// Mock ora spinner
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Import after mocking
import { loginCommand, logoutCommand, whoamiCommand } from '../../commands/login.js';
import { credentials } from '../../storage/credentials.js';
import { leetcodeClient } from '../../api/client.js';

describe('Authentication Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginCommand', () => {
    it('should save credentials on successful login', async () => {
      vi.mocked(leetcodeClient.checkAuth).mockResolvedValue({
        isSignedIn: true,
        username: 'TestUser',
      });

      await loginCommand();

      expect(credentials.set).toHaveBeenCalled();
    });

    it('should not save credentials on failed login', async () => {
      vi.mocked(leetcodeClient.checkAuth).mockResolvedValue({
        isSignedIn: false,
        username: null,
      });

      await loginCommand();

      expect(credentials.set).not.toHaveBeenCalled();
    });
  });

  describe('logoutCommand', () => {
    it('should clear credentials', async () => {
      await logoutCommand();

      expect(credentials.clear).toHaveBeenCalled();
    });
  });

  describe('whoamiCommand', () => {
    it('should show username when logged in', async () => {
      vi.mocked(credentials.get).mockReturnValue({
        session: 'test',
        csrfToken: 'test',
      });
      vi.mocked(leetcodeClient.checkAuth).mockResolvedValue({
        isSignedIn: true,
        username: 'TestUser',
      });

      await whoamiCommand();

      // Check that checkAuth was called
      expect(leetcodeClient.checkAuth).toHaveBeenCalled();
    });

    it('should show not logged in message when no credentials', async () => {
      vi.mocked(credentials.get).mockReturnValue(null);

      await whoamiCommand();

      expect(outputContains('Not logged in')).toBe(true);
    });
  });
});
