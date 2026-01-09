// Collab storage - collaboration session
import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

export interface CollabSession {
  roomCode: string;
  problemId: string;
  isHost: boolean;
  username: string;
}

interface CollabSchema {
  session: CollabSession | null;
}

const collabStore = new Conf<CollabSchema>({
  configName: 'collab',
  cwd: join(homedir(), '.leetcode'),
  defaults: {
    session: null,
  },
});

export const collabStorage = {
  getSession(): CollabSession | null {
    return collabStore.get('session');
  },

  setSession(session: CollabSession | null): void {
    if (session) {
      collabStore.set('session', session);
    } else {
      collabStore.delete('session');
    }
  },

  getPath(): string {
    return collabStore.path;
  },
};
