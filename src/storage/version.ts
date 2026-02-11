// Version check storage - caches npm registry results to avoid excessive API calls
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface VersionCache {
  lastCheck: number; // Unix timestamp
  latestVersion: string;
  hasBreakingChanges: boolean;
}

const LEETCODE_DIR = join(homedir(), '.leetcode');
const VERSION_FILE = join(LEETCODE_DIR, 'version-cache.json');
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function ensureDir(): void {
  if (!existsSync(LEETCODE_DIR)) {
    mkdirSync(LEETCODE_DIR, { recursive: true });
  }
}

function loadCache(): VersionCache | null {
  if (existsSync(VERSION_FILE)) {
    try {
      return JSON.parse(readFileSync(VERSION_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

function saveCache(cache: VersionCache): void {
  ensureDir();
  writeFileSync(VERSION_FILE, JSON.stringify(cache, null, 2));
}

export const versionStorage = {
  /**
   * Check if we should fetch new version info (24h since last check)
   */
  shouldCheck(): boolean {
    const cache = loadCache();
    if (!cache) return true;
    return Date.now() - cache.lastCheck > CHECK_INTERVAL_MS;
  },

  /**
   * Get cached latest version info
   */
  getCached(): VersionCache | null {
    return loadCache();
  },

  /**
   * Update the cached version info
   */
  updateCache(latestVersion: string, hasBreakingChanges: boolean): void {
    saveCache({
      lastCheck: Date.now(),
      latestVersion,
      hasBreakingChanges,
    });
  },

  /**
   * Force clear the cache (for --force flag)
   */
  clearCache(): void {
    if (existsSync(VERSION_FILE)) {
      try {
        unlinkSync(VERSION_FILE);
      } catch {
        // Ignore cleanup errors and let the next write replace stale data.
      }
    }
  },
};
