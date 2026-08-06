// Configuration management - delegates to workspace storage
import { join } from 'path';
import type { LeetCodeSite, SupportedLanguage, ThemeName, UserConfig } from '../types.js';
import { workspaceStorage } from './workspaces.js';
import { DEFAULT_LEETCODE_SITE, normalizeLeetCodeSiteInput } from '../utils/site.js';

const DEFAULT_THEME: ThemeName = 'auto';

export const config = {
  getConfig(): UserConfig {
    const wsConfig = workspaceStorage.getConfig();
    return {
      language: wsConfig.lang as SupportedLanguage,
      editor: wsConfig.editor,
      workDir: wsConfig.workDir,
      repo: wsConfig.syncRepo,
      site: normalizeLeetCodeSiteInput(wsConfig.site ?? '') ?? DEFAULT_LEETCODE_SITE,
      theme: wsConfig.theme ?? DEFAULT_THEME,
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

  setSite(site: LeetCodeSite): void {
    workspaceStorage.setConfig({ site });
  },

  setTheme(theme: ThemeName): void {
    workspaceStorage.setConfig({ theme });
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

  getSite(): LeetCodeSite {
    return (
      normalizeLeetCodeSiteInput(workspaceStorage.getConfig().site ?? '') ?? DEFAULT_LEETCODE_SITE
    );
  },

  getTheme(): ThemeName {
    return workspaceStorage.getConfig().theme ?? DEFAULT_THEME;
  },

  getPath(): string {
    return join(workspaceStorage.getWorkspaceDir(), 'config.json');
  },

  // New workspace-aware methods
  getActiveWorkspace(): string {
    return workspaceStorage.getActive();
  },
};
