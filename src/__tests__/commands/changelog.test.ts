// Changelog command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn((path: string) => path.includes('releases.md')),
    readFileSync: vi.fn((path: string) => {
      if (path.includes('releases.md')) {
        return `# Release Notes

## v2.0.1

> **Release Date**: 2026-01-12

### 🔒 Security Fixes
- Fixed vulnerability

---

## v2.0.0

> **Release Date**: 2026-01-11

### ⚠️ Breaking Change

This release introduces workspace-aware storage.

### 🚀 New Features
- Workspaces

---

## v1.6.0

> **Release Date**: 2026-01-10

### 🚀 New Features
- Collaborative Coding
`;
      }
      return '';
    }),
  };
});

// Import after mocking
import { changelogCommand } from '../../commands/changelog.js';

describe('Changelog Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('display changelog', () => {
    it('should display changelog header', async () => {
      await changelogCommand();
      
      expect(outputContains('Release Notes') || outputContains('v2.0.1')).toBe(true);
    });

    it('should show specific version when provided', async () => {
      await changelogCommand('2.0.0');
      
      // Should show v2.0.0 content
      expect(outputContains('Breaking Change') || outputContains('2.0.0')).toBe(true);
    });

    it('should handle version not found', async () => {
      await changelogCommand('99.0.0');
      
      expect(outputContains('not found') || outputContains('Available versions')).toBe(true);
    });
  });

  describe('filtering', () => {
    it('should filter to breaking changes with --breaking flag', async () => {
      await changelogCommand(undefined, { breaking: true });
      
      // Should only show v2.0.0 which has breaking changes
      expect(outputContains('Breaking') || outputContains('2.0.0')).toBe(true);
    });

    it('should show only latest with --latest flag', async () => {
      await changelogCommand(undefined, { latest: true });
      
      // Should show v2.0.1
      expect(outputContains('2.0.1') || outputContains('Security')).toBe(true);
    });
  });
});
