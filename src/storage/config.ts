// Configuration management - ONLY for config command settings
import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import type { SupportedLanguage, UserConfig } from '../types.js';

interface ConfigSchema {
  language: SupportedLanguage;
  editor?: string;
  workDir: string;
  repo?: string;
}

const configStore = new Conf<ConfigSchema>({
  configName: 'config',
  cwd: join(homedir(), '.leetcode'),
  defaults: {
    language: 'typescript' as SupportedLanguage,
    workDir: join(homedir(), 'leetcode'),
  },
});

export const config = {
  getConfig(): UserConfig {
    return {
      language: configStore.get('language'),
      editor: configStore.get('editor'),
      workDir: configStore.get('workDir'),
      repo: configStore.get('repo'),
    };
  },

  setLanguage(language: SupportedLanguage): void {
    configStore.set('language', language);
  },

  setEditor(editor: string): void {
    configStore.set('editor', editor);
  },

  setWorkDir(workDir: string): void {
    configStore.set('workDir', workDir);
  },

  setRepo(repo: string): void {
    configStore.set('repo', repo);
  },

  deleteRepo(): void {
    configStore.delete('repo');
  },

  getLanguage(): SupportedLanguage {
    return configStore.get('language');
  },

  getEditor(): string | undefined {
    return configStore.get('editor');
  },

  getWorkDir(): string {
    return configStore.get('workDir');
  },

  getRepo(): string | undefined {
    return configStore.get('repo');
  },

  getPath(): string {
    return configStore.path;
  },
};
