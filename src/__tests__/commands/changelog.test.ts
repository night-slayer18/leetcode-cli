// Changelog command tests - integration tests that hit real GitHub API
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';
import { changelogCommand } from '../../commands/changelog.js';

describe('Changelog Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('display changelog', () => {
    it('should display changelog header', async () => {
      await changelogCommand(undefined, { latest: true });
      
      expect(outputContains('Release Notes') || outputContains('LeetCode CLI')).toBe(true);
    }, 15000); // Increased timeout for network call

    it('should show specific version when provided', async () => {
      await changelogCommand('2.0.0');
      
      // Should show v2.0.0 content
      expect(outputContains('Breaking Change') || outputContains('2.0.0')).toBe(true);
    }, 15000);

    it('should handle version not found', async () => {
      await changelogCommand('99.0.0');
      
      expect(outputContains('not found') || outputContains('Available versions')).toBe(true);
    }, 15000);
  });

  describe('filtering', () => {
    it('should filter to breaking changes with --breaking flag', async () => {
      await changelogCommand(undefined, { breaking: true });
      
      // Should only show versions with breaking changes
      expect(outputContains('Breaking') || outputContains('2.0.0')).toBe(true);
    }, 15000);

    it('should show only latest with --latest flag', async () => {
      await changelogCommand(undefined, { latest: true });
      
      // Should show latest version
      expect(outputContains('Release Notes') || outputContains('v2')).toBe(true);
    }, 15000);
  });
});
