// Collab storage - collaboration session - workspace-aware
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { workspaceStorage } from './workspaces.js';

export interface CollabSession {
  roomCode: string;
  problemId: string;
  isHost: boolean;
  username: string;
}

interface CollabSchema {
  session: CollabSession | null;
}

function getCollabPath(): string {
  return workspaceStorage.getCollabPath();
}

function loadCollab(): CollabSchema {
  const path = getCollabPath();
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return { session: null };
}

function saveCollab(data: CollabSchema): void {
  const collabPath = getCollabPath();
  const dir = dirname(collabPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(collabPath, JSON.stringify(data, null, 2));
}

export const collabStorage = {
  getSession(): CollabSession | null {
    return loadCollab().session;
  },

  setSession(session: CollabSession | null): void {
    saveCollab({ session });
  },

  getPath(): string {
    return getCollabPath();
  },
};
