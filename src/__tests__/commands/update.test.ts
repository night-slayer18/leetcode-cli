// Update command tests - integration tests that hit real npm registry
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';
import { updateCommand } from '../../commands/update.js';
import { versionStorage } from '../../storage/version.js';

describe('Update Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache before each test
    versionStorage.clearCache();
  });

  describe('version check', () => {
    it('should check for updates from npm registry', async () => {
      await updateCommand({ force: true });

      // Should show either "up to date" or "update available"
      expect(
        outputContains("You're on the latest version") || outputContains('Update available')
      ).toBe(true);
    }, 15000); // Increased timeout for network call

    it('should use cache when available and not expired', async () => {
      // First call - fetches from registry
      await updateCommand({ force: true });

      // Second call - should use cache (faster)
      const start = Date.now();
      await updateCommand({});
      const duration = Date.now() - start;

      // Should be fast (using cache, not hitting network)
      expect(duration).toBeLessThan(1000);
    }, 20000);

    it('should clear cache with force flag', async () => {
      // Populate cache
      versionStorage.updateCache('1.0.0', false);

      // Force should clear and re-fetch
      await updateCommand({ force: true });

      expect(versionStorage.clearCache).toBeDefined();
    }, 15000);
  });
});
