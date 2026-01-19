// Authentication utilities
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { credentials } from '../storage/credentials.js';

export async function validateSession(): Promise<boolean> {
  const creds = credentials.get();
  if (!creds) return false;

  try {
    leetcodeClient.setCredentials(creds);
    const { isSignedIn } = await leetcodeClient.checkAuth();
    return isSignedIn;
  } catch {
    return false;
  }
}

export async function requireAuth(): Promise<{ authorized: boolean; username?: string }> {
  const creds = credentials.get();

  if (!creds) {
    console.log(chalk.yellow('⚠️  Please login first: leetcode login'));
    return { authorized: false };
  }

  try {
    leetcodeClient.setCredentials(creds);
    const { isSignedIn, username } = await leetcodeClient.checkAuth();

    if (!isSignedIn) {
      console.log(chalk.yellow('⚠️  Session expired. Please run: leetcode login'));
      return { authorized: false };
    }

    return { authorized: true, username: username ?? undefined };
  } catch {
    console.log(chalk.yellow('⚠️  Session validation failed. Please run: leetcode login'));
    return { authorized: false };
  }
}

export function setupClientIfLoggedIn(): boolean {
  const creds = credentials.get();

  if (!creds) {
    return false;
  }

  leetcodeClient.setCredentials(creds);
  return true;
}

export async function getCurrentUsername(): Promise<string | null> {
  const creds = credentials.get();
  if (!creds) return null;

  try {
    leetcodeClient.setCredentials(creds);
    const { isSignedIn, username } = await leetcodeClient.checkAuth();
    return isSignedIn ? (username ?? null) : null;
  } catch {
    return null;
  }
}
