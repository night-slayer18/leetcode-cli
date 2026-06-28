import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import * as credentialStore from '../storage/credentials.js';
import type { LeetCodeCredentials, LeetCodeSite } from '../types.js';
import { config } from '../storage/config.js';
import {
  DEFAULT_LEETCODE_SITE,
  getLeetCodeSiteLabel,
  normalizeLeetCodeSiteInput,
  SUPPORTED_LEETCODE_SITES,
} from '../utils/site.js';
import { configureLeetCodeClientSite } from '../utils/auth.js';

const { credentials } = credentialStore;

function getConfiguredSite(): LeetCodeSite {
  const configWithSite = config as unknown as {
    getSite?: () => string;
    getConfig?: () => { site?: string };
  };

  const fromGetter =
    typeof configWithSite.getSite === 'function' ? configWithSite.getSite() : undefined;
  if (typeof fromGetter === 'string') {
    return normalizeLeetCodeSiteInput(fromGetter) ?? DEFAULT_LEETCODE_SITE;
  }

  const fromConfig = configWithSite.getConfig?.()?.site;
  if (typeof fromConfig === 'string') {
    return normalizeLeetCodeSiteInput(fromConfig) ?? DEFAULT_LEETCODE_SITE;
  }

  return DEFAULT_LEETCODE_SITE;
}

function persistConfiguredSite(site: LeetCodeSite): void {
  const configWithSite = config as unknown as {
    setSite?: (value: LeetCodeSite) => void;
  };

  if (typeof configWithSite.setSite === 'function') {
    configWithSite.setSite(site);
  }
}

function getDomainForSite(site: LeetCodeSite): string {
  return site === 'leetcode.cn' ? 'leetcode.cn' : 'leetcode.com';
}

export async function loginCommand(): Promise<void> {
  const currentStatus = await credentials.status();

  if (currentStatus.mode === 'env-readonly') {
    configureLeetCodeClientSite();

    const envCreds = await credentials.get();
    if (!envCreds) {
      console.log(
        chalk.yellow('Environment credential mode is active but credentials are unavailable.')
      );
      return;
    }

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
      console.log(
        chalk.gray('Environment credential mode is read-only. Nothing was written to disk.')
      );
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

  const currentSite = getConfiguredSite();
  const siteAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'site',
      message: 'LeetCode site:',
      choices: SUPPORTED_LEETCODE_SITES.map((site) => ({
        name: getLeetCodeSiteLabel(site),
        value: site,
      })),
      default: currentSite,
    },
  ]);

  const selectedSite =
    normalizeLeetCodeSiteInput(String(siteAnswer.site ?? currentSite)) ?? DEFAULT_LEETCODE_SITE;

  persistConfiguredSite(selectedSite);
  configureLeetCodeClientSite(selectedSite);

  const domain = getDomainForSite(selectedSite);

  console.log(chalk.yellow('To login, provide your LeetCode session cookies.'));
  console.log(chalk.gray(`1. Open https://${domain} in your browser`));
  console.log(chalk.gray('2. Login to your account'));
  console.log(chalk.gray(`3. Open DevTools (F12) → Application → Cookies → ${domain}`));
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

    const result = await credentials.set(creds);
    if (!result.ok) {
      spinner.fail('Authenticated, but failed to save credentials');
      console.log(chalk.red(result.message));
      return;
    }

    spinner.succeed(`Logged in to ${chalk.cyan(selectedSite)} as ${chalk.green(username)}`);
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
  configureLeetCodeClientSite();

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
