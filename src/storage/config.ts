// Configuration management using 'conf' package
import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import type { LeetCodeCredentials, SupportedLanguage, UserConfig } from '../types.js';

interface ConfigSchema {
  credentials: LeetCodeCredentials | null;
  config: UserConfig;
}

const schema = {
  credentials: {
    type: 'object' as const,
    nullable: true,
    properties: {
      csrfToken: { type: 'string' },
      session: { type: 'string' },
    },
  },
  config: {
    type: 'object' as const,
    properties: {
      language: { type: 'string', default: 'typescript' },
      editor: { type: 'string' },
      workDir: { type: 'string', default: join(homedir(), 'leetcode') },
      repo: { type: 'string' },
    },
    default: {
      language: 'typescript' as SupportedLanguage,
      workDir: join(homedir(), 'leetcode'),
    },
  },
};

const configStore = new Conf<ConfigSchema>({
  projectName: 'leetcode-cli',
  cwd: join(homedir(), '.leetcode'),
  schema,
});

export const config = {
  // Credentials
  getCredentials(): LeetCodeCredentials | null {
    return configStore.get('credentials') ?? null;
  },

  setCredentials(credentials: LeetCodeCredentials): void {
    configStore.set('credentials', credentials);
  },

  clearCredentials(): void {
    configStore.delete('credentials');
  },

  // User Config
  getConfig(): UserConfig {
    return configStore.get('config');
  },

  setLanguage(language: SupportedLanguage): void {
    configStore.set('config.language', language);
  },

  setEditor(editor: string): void {
    configStore.set('config.editor', editor);
  },

  setWorkDir(workDir: string): void {
    configStore.set('config.workDir', workDir);
  },

  setRepo(repo: string): void {
    configStore.set('config.repo', repo);
  },

  // Get specific config values
  getLanguage(): SupportedLanguage {
    return configStore.get('config.language') as SupportedLanguage;
  },

  getEditor(): string | undefined {
    return configStore.get('config.editor');
  },

  getWorkDir(): string {
    return configStore.get('config.workDir');
  },

  getRepo(): string | undefined {
    return configStore.get('config.repo');
  },

  // Clear all config
  clear(): void {
    configStore.clear();
  },

  // Get config file path (for debugging)
  getPath(): string {
    return configStore.path;
  },
};
