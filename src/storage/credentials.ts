// Credentials storage - login session and CSRF token
import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import type { LeetCodeCredentials } from '../types.js';

interface CredentialsSchema {
  session?: string;
  csrfToken?: string;
}

const credentialsStore = new Conf<CredentialsSchema>({
  configName: 'credentials',
  cwd: join(homedir(), '.leetcode'),
  defaults: {},
});

export const credentials = {
  get(): LeetCodeCredentials | null {
    const session = credentialsStore.get('session');
    const csrfToken = credentialsStore.get('csrfToken');

    if (!session || !csrfToken) return null;
    return { session, csrfToken };
  },

  set(creds: LeetCodeCredentials): void {
    credentialsStore.set('session', creds.session);
    credentialsStore.set('csrfToken', creds.csrfToken);
  },

  clear(): void {
    credentialsStore.clear();
  },

  getPath(): string {
    return credentialsStore.path;
  },
};
