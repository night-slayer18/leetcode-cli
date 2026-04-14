import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import * as credentialStore from '../storage/credentials.js';
import type { LeetCodeCredentials } from '../types.js';
import { config } from '../storage/config.js';

const { credentials } = credentialStore;

export async function loginCommand(): Promise<void> {
  const currentStatus = await credentials.status();

  if (currentStatus.mode === 'env-readonly') {
    const envCreds = await credentials.get();
    if (!envCreds) {
      console.log(chalk.yellow('Environment credential mode is active but credentials are unavailable.'));
      return;
    }

    const configuredSite = config.getLeetCodeSite();
    (leetcodeClient as { setBaseUrl?: (site: 'com' | 'cn') => void }).setBaseUrl?.(configuredSite);

    const spinner = ora('Validating environment credentials...').start();
    try {
      leetcodeClient.setCredentials(envCreds);
      const { isSignedIn, username } = await leetcodeClient.checkAuth();

      if (!isSignedIn || !username) {
        spinner.fail('Invalid environment credentials');
        console.log(chalk.red('Please check LEETCODE_SESSION and LEETCODE_CSRF_TOKEN.'));
        return;
      }

      spinner.succeed(`Logged in as ${chalk.green(username)}`);
      console.log(chalk.gray('Environment credential mode is read-only. Nothing was written to disk.'));
      return;
    } catch (error) {
      spinner.fail('Authentication failed');
      if (error instanceof Error) {
        console.log(chalk.red(error.message));
      }
      return;
    }
  }

  if (currentStatus.mode === 'keychain' && currentStatus.reason === 'KEYCHAIN_UNAVAILABLE') {
    const message =
      typeof credentialStore.describeCredentialStatus === 'function'
        ? credentialStore.describeCredentialStatus(currentStatus)
        : 'System keychain is unavailable.';
    console.log(chalk.yellow(message));
    return;
  }

  console.log();
  console.log(chalk.cyan('LeetCode CLI Login'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();
  console.log(chalk.yellow('To login, select site and provide your LeetCode session cookies.'));
  console.log(chalk.gray('1. Select your LeetCode site (.com or .cn)'));
  console.log(chalk.gray('2. Login to your account'));
  console.log(chalk.gray('3. Open DevTools (F12) → Application → Cookies'));
  console.log(chalk.gray('4. Copy the values of LEETCODE_SESSION and csrftoken'));
  console.log();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'site',
      message: 'LeetCode site:',
      default: config.getLeetCodeSite(),
      choices: [
        { name: 'leetcode.com (Global)', value: 'com' },
        { name: 'leetcode.cn (China)', value: 'cn' },
      ],
    },
    {
      type: 'password',
      name: 'session',
      message: 'LEETCODE_SESSION:',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'Session token is required',
    },
    {
      type: 'password',
      name: 'csrfToken',
      message: 'csrftoken:',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'CSRF token is required',
    },
  ]);

  const creds: LeetCodeCredentials = {
    session: answers.session.trim(),
    csrfToken: answers.csrfToken.trim(),
  };

  const selectedSite: 'com' | 'cn' = answers.site === 'cn' ? 'cn' : 'com';
  config.setLeetCodeSite(selectedSite);
  (leetcodeClient as { setBaseUrl?: (site: 'com' | 'cn') => void }).setBaseUrl?.(selectedSite);

  const spinner = ora('Verifying credentials...').start();

  try {
    leetcodeClient.setCredentials(creds);
    const { isSignedIn, username } = await leetcodeClient.checkAuth();

    if (!isSignedIn || !username) {
      spinner.fail('Invalid credentials');
      console.log(chalk.red('Please check your session cookies and try again.'));
      return;
    }

    const result = await credentials.set(creds);
    if (!result.ok) {
      spinner.fail('Authenticated, but failed to save credentials');
      console.log(chalk.red(result.message));
      return;
    }

    spinner.succeed(`Logged in as ${chalk.green(username)}`);
    console.log();
    if (result.source === 'keychain') {
      console.log(chalk.green('✓ Credentials saved to system keychain.'));
    } else if (result.source === 'file' && result.path) {
      console.log(chalk.green('✓ Credentials encrypted and saved to ') + chalk.gray(result.path));
    } else {
      console.log(chalk.gray(result.message));
    }
  } catch (error) {
    spinner.fail('Authentication failed');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

export async function logoutCommand(): Promise<void> {
  const result = await credentials.clear();
  if (!result.ok) {
    console.log(chalk.yellow(result.message));
    return;
  }
  console.log(chalk.green('✓ Logged out successfully'));
}

export async function whoamiCommand(): Promise<void> {
  const creds = await credentials.get();

  if (!creds) {
    const status = await credentials.status();
    const message =
      typeof credentialStore.describeCredentialStatus === 'function'
        ? credentialStore.describeCredentialStatus(status)
        : 'Not logged in. Run "leetcode login" to authenticate.';
    console.log(chalk.yellow(message));
    return;
  }

  const spinner = ora('Checking session...').start();

  try {
    const configuredSite = config.getLeetCodeSite();
    (leetcodeClient as { setBaseUrl?: (site: 'com' | 'cn') => void }).setBaseUrl?.(configuredSite);
    leetcodeClient.setCredentials(creds);
    const { isSignedIn, username } = await leetcodeClient.checkAuth();

    if (!isSignedIn || !username) {
      spinner.fail('Session expired');
      console.log(chalk.yellow('Please run "leetcode login" to re-authenticate.'));
      return;
    }

    spinner.succeed(`Logged in as ${chalk.green(username)}`);
  } catch (error) {
    spinner.fail('Failed to check session');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
