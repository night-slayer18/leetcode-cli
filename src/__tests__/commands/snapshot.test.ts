// Snapshot command tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { outputContains } from '../setup.js';

// Mock storage
let mockSnapshots: Array<{
  id: number;
  name: string;
  fileName: string;
  language: string;
  lines: number;
  createdAt: string;
}> = [];

vi.mock('../../storage/snapshots.js', () => ({
  snapshotStorage: {
    save: vi.fn((problemId, problemTitle, code, lang, name) => {
      const snapshot = {
        id: mockSnapshots.length + 1,
        name: name || `snapshot-${mockSnapshots.length + 1}`,
        fileName: `${mockSnapshots.length + 1}_${name || 'snapshot'}.ts`,
        language: lang,
        lines: code.split('\n').length,
        createdAt: new Date().toISOString(),
      };
      mockSnapshots.push(snapshot);
      return snapshot;
    }),
    list: vi.fn(() => mockSnapshots),
    getMeta: vi.fn((problemId) => ({
      problemId,
      problemTitle: 'Two Sum',
      snapshots: mockSnapshots,
    })),
    get: vi.fn((problemId, idOrName) => {
      const byId = mockSnapshots.find((s) => s.id === parseInt(idOrName, 10));
      if (byId) return byId;
      return mockSnapshots.find((s) => s.name === idOrName) || null;
    }),
    getCode: vi.fn(() => 'function twoSum() { return [0,1]; }'),
    delete: vi.fn((problemId, idOrName) => {
      const snapshot = mockSnapshots.find(
        (s) => s.id === parseInt(idOrName, 10) || s.name === idOrName
      );
      if (!snapshot) return false;
      mockSnapshots = mockSnapshots.filter((s) => s.id !== snapshot.id);
      return true;
    }),
    hasSnapshots: vi.fn(() => mockSnapshots.length > 0),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
  },
}));

vi.mock('../../utils/fileUtils.js', () => ({
  findSolutionFile: vi.fn().mockResolvedValue('/tmp/leetcode/Easy/Array/1.two-sum.ts'),
  getLangSlugFromExtension: vi.fn().mockReturnValue('typescript'),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('function twoSum() { return [0,1]; }'),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('diff', () => ({
  diffLines: vi.fn(() => [
    { value: 'function twoSum() {\n', added: false, removed: false },
    { value: '  return [0,1];\n', added: true },
    { value: '}\n', added: false, removed: false },
  ]),
}));

// Import after mocking
import {
  snapshotSaveCommand,
  snapshotListCommand,
  snapshotRestoreCommand,
  snapshotDiffCommand,
  snapshotDeleteCommand,
} from '../../commands/snapshot.js';
import { snapshotStorage } from '../../storage/snapshots.js';
import { findSolutionFile } from '../../utils/fileUtils.js';

describe('Snapshot Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshots = [];
  });

  describe('snapshotSaveCommand', () => {
    it('should save a snapshot with name', async () => {
      await snapshotSaveCommand('1', 'brute-force');

      expect(findSolutionFile).toHaveBeenCalled();
      expect(snapshotStorage.save).toHaveBeenCalledWith(
        '1',
        expect.anything(),
        expect.anything(),
        'typescript',
        'brute-force'
      );
      expect(outputContains('Snapshot saved')).toBe(true);
    });

    it('should save a snapshot without name', async () => {
      await snapshotSaveCommand('1', undefined);

      expect(snapshotStorage.save).toHaveBeenCalled();
    });

    it('should show error when solution file not found', async () => {
      vi.mocked(findSolutionFile).mockResolvedValueOnce(null);

      await snapshotSaveCommand('1', 'test');

      expect(outputContains('No solution file found')).toBe(true);
    });

    it('should show error when duplicate name exists', async () => {
      // Mock save to return error for duplicate
      vi.mocked(snapshotStorage.save).mockReturnValueOnce({
        error: 'Snapshot with name "brute-force" already exists (ID: 1)',
      });

      await snapshotSaveCommand('1', 'brute-force');

      expect(outputContains('already exists')).toBe(true);
    });
  });

  describe('snapshotListCommand', () => {
    it('should list snapshots', async () => {
      mockSnapshots = [
        {
          id: 1,
          name: 'brute-force',
          fileName: '1_brute-force.ts',
          language: 'typescript',
          lines: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'hash-map',
          fileName: '2_hash-map.ts',
          language: 'typescript',
          lines: 15,
          createdAt: new Date().toISOString(),
        },
      ];

      await snapshotListCommand('1');

      expect(outputContains('Snapshots')).toBe(true);
    });

    it('should show message when no snapshots', async () => {
      mockSnapshots = [];

      await snapshotListCommand('1');

      expect(outputContains('No snapshots found')).toBe(true);
    });
  });

  describe('snapshotRestoreCommand', () => {
    it('should restore a snapshot by ID', async () => {
      mockSnapshots = [
        {
          id: 1,
          name: 'brute-force',
          fileName: '1_brute-force.ts',
          language: 'typescript',
          lines: 10,
          createdAt: new Date().toISOString(),
        },
      ];

      await snapshotRestoreCommand('1', '1');

      expect(snapshotStorage.get).toHaveBeenCalledWith('1', '1');
      expect(snapshotStorage.getCode).toHaveBeenCalled();
      expect(outputContains('Snapshot restored')).toBe(true);
    });

    it('should show error for non-existent snapshot', async () => {
      mockSnapshots = [];

      await snapshotRestoreCommand('1', 'nonexistent');

      expect(outputContains('not found')).toBe(true);
    });
  });

  describe('snapshotDiffCommand', () => {
    it('should show diff between two snapshots', async () => {
      mockSnapshots = [
        {
          id: 1,
          name: 'brute-force',
          fileName: '1_brute-force.ts',
          language: 'typescript',
          lines: 10,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'hash-map',
          fileName: '2_hash-map.ts',
          language: 'typescript',
          lines: 15,
          createdAt: new Date().toISOString(),
        },
      ];

      await snapshotDiffCommand('1', '1', '2');

      expect(snapshotStorage.get).toHaveBeenCalledWith('1', '1');
      expect(snapshotStorage.get).toHaveBeenCalledWith('1', '2');
      expect(outputContains('Diff')).toBe(true);
    });
  });

  describe('snapshotDeleteCommand', () => {
    it('should delete a snapshot', async () => {
      mockSnapshots = [
        {
          id: 1,
          name: 'brute-force',
          fileName: '1_brute-force.ts',
          language: 'typescript',
          lines: 10,
          createdAt: new Date().toISOString(),
        },
      ];

      await snapshotDeleteCommand('1', '1');

      expect(snapshotStorage.delete).toHaveBeenCalledWith('1', '1');
      expect(outputContains('Deleted snapshot')).toBe(true);
    });

    it('should show error when snapshot not found', async () => {
      mockSnapshots = [];

      await snapshotDeleteCommand('1', 'nonexistent');

      expect(outputContains('not found')).toBe(true);
    });
  });
});
