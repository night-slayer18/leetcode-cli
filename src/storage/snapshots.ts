// Snapshot storage - save/restore solution file versions - workspace-aware
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { LANGUAGE_EXTENSIONS } from '../utils/templates.js';
import type { SupportedLanguage } from '../types.js';
import { workspaceStorage } from './workspaces.js';
import { isValidSnapshotName } from '../utils/validation.js';

export interface Snapshot {
  id: number;
  name: string;
  fileName: string;
  language: string;
  lines: number;
  createdAt: string;
}

export interface SnapshotMeta {
  problemId: string;
  problemTitle: string;
  snapshots: Snapshot[];
}

function getSnapshotsDir(): string {
  return workspaceStorage.getSnapshotsDir();
}

function getSnapshotDir(problemId: string): string {
  return join(getSnapshotsDir(), problemId);
}

function getMetaPath(problemId: string): string {
  return join(getSnapshotDir(problemId), 'meta.json');
}

function getFilesDir(problemId: string): string {
  return join(getSnapshotDir(problemId), 'files');
}

function ensureSnapshotDir(problemId: string): void {
  const dir = getFilesDir(problemId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadMeta(problemId: string): SnapshotMeta {
  const metaPath = getMetaPath(problemId);
  if (existsSync(metaPath)) {
    return JSON.parse(readFileSync(metaPath, 'utf-8'));
  }
  return {
    problemId,
    problemTitle: '',
    snapshots: [],
  };
}

function saveMeta(problemId: string, meta: SnapshotMeta): void {
  ensureSnapshotDir(problemId);
  writeFileSync(getMetaPath(problemId), JSON.stringify(meta, null, 2));
}

export const snapshotStorage = {
  /**
   * Save a snapshot of the solution
   */
  save(
    problemId: string,
    problemTitle: string,
    code: string,
    language: string,
    name?: string
  ): Snapshot | { error: string } {
    ensureSnapshotDir(problemId);
    const meta = loadMeta(problemId);

    // Update problem title if provided
    if (problemTitle) {
      meta.problemTitle = problemTitle;
    }

    // Generate next ID
    const nextId = meta.snapshots.length > 0 ? Math.max(...meta.snapshots.map((s) => s.id)) + 1 : 1;

    // Generate name if not provided
    const snapshotName = (name ?? `snapshot-${nextId}`).trim();
    if (!isValidSnapshotName(snapshotName)) {
      return { error: 'Invalid snapshot name. Use 1-64 characters: letters, numbers, spaces, "-" or "_".' };
    }

    // Check for duplicate name
    const existing = meta.snapshots.find((s) => s.name === snapshotName);
    if (existing) {
      return { error: `Snapshot with name "${snapshotName}" already exists (ID: ${existing.id})` };
    }

    // Get file extension from language
    const ext = LANGUAGE_EXTENSIONS[language as SupportedLanguage] || language;
    const fileName = `${nextId}_${snapshotName}.${ext}`;

    // Save the file
    const filePath = join(getFilesDir(problemId), fileName);
    writeFileSync(filePath, code, 'utf-8');

    // Create snapshot entry
    const snapshot: Snapshot = {
      id: nextId,
      name: snapshotName,
      fileName,
      language,
      lines: code.split('\n').length,
      createdAt: new Date().toISOString(),
    };

    meta.snapshots.push(snapshot);
    saveMeta(problemId, meta);

    return snapshot;
  },

  /**
   * Get all snapshots for a problem
   */
  list(problemId: string): Snapshot[] {
    const meta = loadMeta(problemId);
    return meta.snapshots;
  },

  /**
   * Get snapshot metadata
   */
  getMeta(problemId: string): SnapshotMeta {
    return loadMeta(problemId);
  },

  /**
   * Get a specific snapshot by ID or name
   */
  get(problemId: string, idOrName: string): Snapshot | null {
    const meta = loadMeta(problemId);

    // Try by ID first
    const byId = meta.snapshots.find((s) => s.id === parseInt(idOrName, 10));
    if (byId) return byId;

    // Try by name
    const byName = meta.snapshots.find((s) => s.name === idOrName);
    return byName || null;
  },

  /**
   * Get snapshot code content
   */
  getCode(problemId: string, snapshot: Snapshot): string {
    const filePath = join(getFilesDir(problemId), snapshot.fileName);
    if (!existsSync(filePath)) {
      throw new Error(`Snapshot file not found: ${snapshot.fileName}`);
    }
    return readFileSync(filePath, 'utf-8');
  },

  /**
   * Delete a snapshot
   */
  delete(problemId: string, idOrName: string): boolean {
    const meta = loadMeta(problemId);
    const snapshot = this.get(problemId, idOrName);

    if (!snapshot) {
      return false;
    }

    // Delete the file
    const filePath = join(getFilesDir(problemId), snapshot.fileName);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    // Remove from meta
    meta.snapshots = meta.snapshots.filter((s) => s.id !== snapshot.id);
    saveMeta(problemId, meta);

    return true;
  },

  /**
   * Check if snapshots exist for a problem
   */
  hasSnapshots(problemId: string): boolean {
    return this.list(problemId).length > 0;
  },
};
