// Authentication utilities
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';

export async function validateSession(): Promise<boolean> {
  const credentials = config.getCredentials();
  if (!credentials) return false;

  try {
    leetcodeClient.setCredentials(credentials);
    const { isSignedIn } = await leetcodeClient.checkAuth();
    return isSignedIn;
  } catch {
    return false;
  }
}

export async function requireAuth(): Promise<{ authorized: boolean; username?: string }> {
  const credentials = config.getCredentials();
  
  if (!credentials) {
    console.log(chalk.yellow('⚠️  Please login first: leetcode login'));
    return { authorized: false };
  }

  try {
    leetcodeClient.setCredentials(credentials);
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
  const credentials = config.getCredentials();
  
  if (!credentials) {
    return false;
  }

  leetcodeClient.setCredentials(credentials);
  return true;
}

export async function getCurrentUsername(): Promise<string | null> {
  const credentials = config.getCredentials();
  if (!credentials) return null;

  try {
    leetcodeClient.setCredentials(credentials);
    const { isSignedIn, username } = await leetcodeClient.checkAuth();
    return isSignedIn ? username ?? null : null;
  } catch {
    return null;
  }
}
