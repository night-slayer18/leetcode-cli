// Workspace management - isolated contexts for problem-solving
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { isValidWorkspaceName } from '../utils/validation.js';

export interface WorkspaceConfig {
  workDir: string;
  lang: string;
  editor?: string;
  syncRepo?: string;
}

export interface WorkspaceRegistry {
  active: string;
  workspaces: string[];
}

const LEETCODE_DIR = join(homedir(), '.leetcode');
const WORKSPACES_FILE = join(LEETCODE_DIR, 'workspaces.json');
const WORKSPACES_DIR = join(LEETCODE_DIR, 'workspaces');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadRegistry(): WorkspaceRegistry {
  if (existsSync(WORKSPACES_FILE)) {
    return JSON.parse(readFileSync(WORKSPACES_FILE, 'utf-8'));
  }
  return { active: 'default', workspaces: [] };
}

function saveRegistry(registry: WorkspaceRegistry): void {
  ensureDir(LEETCODE_DIR);
  writeFileSync(WORKSPACES_FILE, JSON.stringify(registry, null, 2));
}

function normalizeWorkspaceName(name: string): string | null {
  const trimmed = name.trim();
  return isValidWorkspaceName(trimmed) ? trimmed : null;
}

export const workspaceStorage = {
  /**
   * Initialize workspaces on first run - migrate existing config to "default" workspace
   */
  ensureInitialized(): void {
    const registry = loadRegistry();
    const validWorkspaces = registry.workspaces
      .map((name) => normalizeWorkspaceName(name))
      .filter((name): name is string => name !== null);

    let shouldSave = false;
    if (validWorkspaces.length !== registry.workspaces.length) {
      registry.workspaces = [...new Set(validWorkspaces)];
      shouldSave = true;
    }

    // If no workspaces exist, create "default"
    if (registry.workspaces.length === 0) {
      this.create('default', {
        workDir: join(homedir(), 'leetcode'),
        lang: 'typescript',
      });
      registry.workspaces = ['default'];
      registry.active = 'default';
      saveRegistry(registry);
      return;
    }

    const activeName = normalizeWorkspaceName(registry.active);
    if (!activeName || !registry.workspaces.includes(activeName)) {
      registry.active = registry.workspaces[0];
      shouldSave = true;
    } else if (activeName !== registry.active) {
      registry.active = activeName;
      shouldSave = true;
    }

    if (shouldSave) {
      saveRegistry(registry);
    }
  },

  /**
   * Get the currently active workspace name
   */
  getActive(): string {
    this.ensureInitialized();
    return loadRegistry().active;
  },

  /**
   * Set the active workspace
   */
  setActive(name: string): boolean {
    const wsName = normalizeWorkspaceName(name);
    if (!wsName) {
      return false;
    }

    const registry = loadRegistry();
    if (!registry.workspaces.includes(wsName)) {
      return false;
    }
    registry.active = wsName;
    saveRegistry(registry);
    return true;
  },

  /**
   * List all workspace names
   */
  list(): string[] {
    this.ensureInitialized();
    return loadRegistry().workspaces;
  },

  /**
   * Check if a workspace exists
   */
  exists(name: string): boolean {
    const wsName = normalizeWorkspaceName(name);
    if (!wsName) {
      return false;
    }

    this.ensureInitialized();
    return loadRegistry().workspaces.includes(wsName);
  },

  /**
   * Create a new workspace
   */
  create(name: string, config: WorkspaceConfig): boolean {
    const wsName = normalizeWorkspaceName(name);
    if (!wsName) {
      return false;
    }

    const registry = loadRegistry();

    if (registry.workspaces.includes(wsName)) {
      return false; // Already exists
    }

    // Create workspace directory
    const wsDir = join(WORKSPACES_DIR, wsName);
    ensureDir(wsDir);
    ensureDir(join(wsDir, 'snapshots'));

    // Write config
    const configPath = join(wsDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Initialize empty timer and collab
    writeFileSync(
      join(wsDir, 'timer.json'),
      JSON.stringify({ solveTimes: {}, activeTimer: null }, null, 2)
    );
    writeFileSync(join(wsDir, 'collab.json'), JSON.stringify({ session: null }, null, 2));

    // Update registry
    registry.workspaces.push(wsName);
    saveRegistry(registry);

    return true;
  },

  /**
   * Delete a workspace
   */
  delete(name: string): boolean {
    const wsName = normalizeWorkspaceName(name);
    if (!wsName || wsName === 'default') {
      return false; // Can't delete default
    }

    const registry = loadRegistry();
    if (!registry.workspaces.includes(wsName)) {
      return false;
    }

    // Remove from registry (don't delete files to be safe)
    registry.workspaces = registry.workspaces.filter((w) => w !== wsName);

    // If deleting active workspace, switch to default
    if (registry.active === wsName) {
      registry.active = 'default';
    }

    saveRegistry(registry);
    return true;
  },

  /**
   * Get the directory path for a workspace
   */
  getWorkspaceDir(name?: string): string {
    const wsName = name ? normalizeWorkspaceName(name) || 'default' : this.getActive();
    return join(WORKSPACES_DIR, wsName);
  },

  /**
   * Get config for a workspace
   */
  getConfig(name?: string): WorkspaceConfig {
    const wsName = name ? normalizeWorkspaceName(name) || 'default' : this.getActive();
    const configPath = join(WORKSPACES_DIR, wsName, 'config.json');

    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }

    // Default config
    return {
      workDir: join(homedir(), 'leetcode'),
      lang: 'typescript',
    };
  },

  /**
   * Update config for a workspace
   */
  setConfig(config: Partial<WorkspaceConfig>, name?: string): void {
    const wsName = name ? normalizeWorkspaceName(name) || 'default' : this.getActive();
    const wsDir = join(WORKSPACES_DIR, wsName);
    ensureDir(wsDir);

    const currentConfig = this.getConfig(wsName);
    const newConfig = { ...currentConfig, ...config };

    writeFileSync(join(wsDir, 'config.json'), JSON.stringify(newConfig, null, 2));
  },

  /**
   * Get snapshots directory for active workspace
   */
  getSnapshotsDir(): string {
    return join(this.getWorkspaceDir(), 'snapshots');
  },

  /**
   * Get timer file path for active workspace
   */
  getTimerPath(): string {
    return join(this.getWorkspaceDir(), 'timer.json');
  },

  /**
   * Get collab file path for active workspace
   */
  getCollabPath(): string {
    return join(this.getWorkspaceDir(), 'collab.json');
  },
};
