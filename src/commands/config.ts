// Config command - manage CLI configuration
import inquirer from 'inquirer';
import chalk from 'chalk';
import { config } from '../storage/config.js';
import { credentials } from '../storage/credentials.js';
import { SUPPORTED_LANGUAGES, normalizeLanguageInput } from '../utils/languages.js';
import {
  DEFAULT_LEETCODE_SITE,
  getLeetCodeSiteLabel,
  normalizeLeetCodeSiteInput,
  SUPPORTED_LEETCODE_SITES,
} from '../utils/site.js';

interface ConfigOptions {
  lang?: string;
  editor?: string;
  workdir?: string;
  repo?: string | boolean;
  site?: string;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  const hasRepoOption = options.repo !== undefined;

  if (!options.lang && !options.editor && !options.workdir && !hasRepoOption && !options.site) {
    await showCurrentConfig();
    return;
  }

  if (options.lang) {
    const normalizedLanguage = normalizeLanguageInput(options.lang);
    if (!normalizedLanguage) {
      console.log(chalk.red(`Unsupported language: ${options.lang}`));
      console.log(chalk.gray(`Supported: ${SUPPORTED_LANGUAGES.join(', ')}`));
      return;
    }

    config.setLanguage(normalizedLanguage);
    console.log(chalk.green(`✓ Default language set to ${normalizedLanguage}`));
  }

  if (options.editor) {
    config.setEditor(options.editor);
    console.log(chalk.green(`✓ Editor set to ${options.editor}`));
  }

  if (options.workdir) {
    config.setWorkDir(options.workdir);
    console.log(chalk.green(`✓ Work directory set to ${options.workdir}`));
  }

  if (hasRepoOption) {
    if (options.repo === true || (typeof options.repo === 'string' && options.repo.trim() === '')) {
      config.deleteRepo();
      console.log(chalk.green('✓ Repository URL cleared'));
    } else if (typeof options.repo === 'string') {
      config.setRepo(options.repo);
      console.log(chalk.green(`✓ Repository URL set to ${options.repo}`));
    }
  }

  if (options.site) {
    const normalizedSite = normalizeLeetCodeSiteInput(options.site);
    if (!normalizedSite) {
      console.log(chalk.red(`Unsupported site: ${options.site}`));
      console.log(chalk.gray(`Supported: ${SUPPORTED_LEETCODE_SITES.join(', ')}`));
      return;
    }

    const currentSite = config.getSite();
    if (currentSite !== normalizedSite) {
      if (process.stdout.isTTY) {
        const confirm = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: chalk.yellow(`Warning: Switching sites will clear your credentials. Proceed?`),
            default: false,
          },
        ]);

        if (!confirm.proceed) {
          console.log(chalk.gray('Change aborted. Staying on ' + currentSite));
          return;
        }
      }

      await credentials.clear();
      console.log(
        chalk.yellow(
          `⚠️  Logged out — run "leetcode login" to authenticate with ${normalizedSite}.`
        )
      );
    }

    config.setSite(normalizedSite);
    console.log(chalk.green(`✓ Site set to ${normalizedSite}`));
  }
}

export async function configInteractiveCommand(): Promise<void> {
  const currentConfig = config.getConfig();
  const workspace = config.getActiveWorkspace();
  const currentSite = normalizeLeetCodeSiteInput(currentConfig.site ?? '') ?? DEFAULT_LEETCODE_SITE;

  console.log();
  console.log(chalk.bold.cyan(`📁 Configuring workspace: ${workspace}`));
  console.log(chalk.gray('─'.repeat(40)));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Default programming language:',
      choices: SUPPORTED_LANGUAGES,
      default: currentConfig.language,
    },
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
    {
      type: 'input',
      name: 'editor',
      message: 'Editor command (e.g., code, vim, nvim):',
      default: currentConfig.editor ?? 'code',
    },
    {
      type: 'input',
      name: 'workDir',
      message: 'Working directory for solution files:',
      default: currentConfig.workDir,
    },
    {
      type: 'input',
      name: 'repo',
      message: 'Git repository URL (optional):',
      default: currentConfig.repo,
    },
  ]);

  config.setLanguage(answers.language);
  config.setEditor(answers.editor);
  config.setWorkDir(answers.workDir);
  if (answers.repo) {
    config.setRepo(answers.repo);
  } else {
    config.deleteRepo();
  }

  if (answers.site !== currentSite) {
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: chalk.yellow(`Warning: Switching sites will clear your credentials. Proceed?`),
        default: false,
      },
    ]);

    if (confirm.proceed) {
      config.setSite(answers.site);
      await credentials.clear();
      console.log();
      console.log(
        chalk.yellow(`⚠️  Logged out — run "leetcode login" to authenticate with ${answers.site}.`)
      );
    } else {
      console.log();
      console.log(chalk.gray('Site change aborted. Staying on ' + currentSite));
    }
  } else {
    config.setSite(answers.site);
  }

  console.log();
  console.log(chalk.green('✓ Configuration saved'));
  await showCurrentConfig();
}

async function showCurrentConfig(): Promise<void> {
  const currentConfig = config.getConfig();
  const creds = await credentials.get();
  const workspace = config.getActiveWorkspace();
  const site = normalizeLeetCodeSiteInput(currentConfig.site ?? '') ?? DEFAULT_LEETCODE_SITE;

  console.log();
  console.log(chalk.bold.cyan(`📁 Workspace: ${workspace}`));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();
  console.log(chalk.gray('Config file:'), config.getPath());
  console.log();
  console.log(chalk.gray('Language:    '), chalk.white(currentConfig.language));
  console.log(chalk.gray('Site:        '), chalk.white(site));
  console.log(chalk.gray('Editor:      '), chalk.white(currentConfig.editor ?? '(not set)'));
  console.log(chalk.gray('Work Dir:    '), chalk.white(currentConfig.workDir));
  console.log(chalk.gray('Repo URL:    '), chalk.white(currentConfig.repo ?? '(not set)'));
  console.log(chalk.gray('Logged in:   '), creds ? chalk.green('Yes') : chalk.yellow('No'));
}
