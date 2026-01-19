// Login command - authenticate with LeetCode
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { credentials } from '../storage/credentials.js';
import type { LeetCodeCredentials } from '../types.js';

export async function loginCommand(): Promise<void> {
  console.log();
  console.log(chalk.cyan('LeetCode CLI Login'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();
  console.log(chalk.yellow('To login, you need to provide your LeetCode session cookies.'));
  console.log(chalk.gray('1. Open https://leetcode.com in your browser'));
  console.log(chalk.gray('2. Login to your account'));
  console.log(chalk.gray('3. Open DevTools (F12) → Application → Cookies → leetcode.com'));
  console.log(chalk.gray('4. Copy the values of LEETCODE_SESSION and csrftoken'));
  console.log();

  const answers = await inquirer.prompt([
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

  const spinner = ora('Verifying credentials...').start();

  try {
    leetcodeClient.setCredentials(creds);
    const { isSignedIn, username } = await leetcodeClient.checkAuth();

    if (!isSignedIn || !username) {
      spinner.fail('Invalid credentials');
      console.log(chalk.red('Please check your session cookies and try again.'));
      return;
    }

    // Save credentials
    credentials.set(creds);

    spinner.succeed(`Logged in as ${chalk.green(username)}`);
    console.log();
    console.log(chalk.gray(`Credentials saved to ${credentials.getPath()}`));
  } catch (error) {
    spinner.fail('Authentication failed');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

export async function logoutCommand(): Promise<void> {
  credentials.clear();
  console.log(chalk.green('✓ Logged out successfully'));
}

export async function whoamiCommand(): Promise<void> {
  const creds = credentials.get();

  if (!creds) {
    console.log(chalk.yellow('Not logged in. Run "leetcode login" to authenticate.'));
    return;
  }

  const spinner = ora('Checking session...').start();

  try {
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
