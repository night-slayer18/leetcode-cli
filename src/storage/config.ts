// Configuration management - delegates to workspace storage
import { join } from 'path';
import type { SupportedLanguage, UserConfig } from '../types.js';
import { workspaceStorage } from './workspaces.js';

export const config = {
  getConfig(): UserConfig {
    const wsConfig = workspaceStorage.getConfig();
    return {
      language: wsConfig.lang as SupportedLanguage,
      editor: wsConfig.editor,
      workDir: wsConfig.workDir,
      repo: wsConfig.syncRepo,
    };
  },

  setLanguage(language: SupportedLanguage): void {
    workspaceStorage.setConfig({ lang: language });
  },

  setEditor(editor: string): void {
    workspaceStorage.setConfig({ editor });
  },

  setWorkDir(workDir: string): void {
    workspaceStorage.setConfig({ workDir });
  },

  setRepo(repo: string): void {
    workspaceStorage.setConfig({ syncRepo: repo });
  },

  deleteRepo(): void {
    const wsConfig = workspaceStorage.getConfig();
    delete wsConfig.syncRepo;
    workspaceStorage.setConfig(wsConfig);
  },

  getLanguage(): SupportedLanguage {
    return workspaceStorage.getConfig().lang as SupportedLanguage;
  },

  getEditor(): string | undefined {
    return workspaceStorage.getConfig().editor;
  },

  getWorkDir(): string {
    return workspaceStorage.getConfig().workDir;
  },

  getRepo(): string | undefined {
    return workspaceStorage.getConfig().syncRepo;
  },

  getPath(): string {
    return join(workspaceStorage.getWorkspaceDir(), 'config.json');
  },

  // New workspace-aware methods
  getActiveWorkspace(): string {
    return workspaceStorage.getActive();
  },
};
