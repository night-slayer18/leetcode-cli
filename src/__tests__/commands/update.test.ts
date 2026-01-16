// Update command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock got for npm registry calls
vi.mock('got', () => ({
  default: vi.fn(() => ({
    json: () => Promise.resolve({ version: '2.0.1' }),
  })),
}));

// Mock version storage
vi.mock('../../storage/version.js', () => ({
  versionStorage: {
    shouldCheck: vi.fn(() => true),
    getCached: vi.fn(() => null),
    updateCache: vi.fn(),
    clearCache: vi.fn(),
  },
}));

// Mock fs for package.json reading
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    readFileSync: vi.fn((path: string) => {
      if (path.includes('package.json')) {
        return JSON.stringify({ version: '2.0.1' });
      }
      return '';
    }),
    existsSync: vi.fn(() => true),
  };
});

// Import after mocking
import { updateCommand } from '../../commands/update.js';
import { versionStorage } from '../../storage/version.js';
import got from 'got';

describe('Update Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('version check', () => {
    it('should show up to date when versions match', async () => {
      // Current version matches latest
      await updateCommand({});
      
      expect(outputContains("You're on the latest version")).toBe(true);
    });

    it('should use cache when available and not expired', async () => {
      vi.mocked(versionStorage.shouldCheck).mockReturnValue(false);
      vi.mocked(versionStorage.getCached).mockReturnValue({
        lastCheck: Date.now(),
        latestVersion: '2.0.1',
        hasBreakingChanges: false,
      });

      await updateCommand({});

      // Should not call npm registry
      expect(got).not.toHaveBeenCalled();
    });

    it('should clear cache with force flag', async () => {
      await updateCommand({ force: true });

      expect(versionStorage.clearCache).toHaveBeenCalled();
    });
  });
});
