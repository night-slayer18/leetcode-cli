// Config command - manage CLI configuration
import inquirer from 'inquirer';
import chalk from 'chalk';
import { config } from '../storage/config.js';
import { credentials } from '../storage/credentials.js';
import type { SupportedLanguage } from '../types.js';

interface ConfigOptions {
  lang?: string;
  editor?: string;
  workdir?: string;
  repo?: string;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'typescript',
  'javascript',
  'python3',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'kotlin',
  'swift',
];

export async function configCommand(options: ConfigOptions): Promise<void> {
  // If no options provided, show current config
  if (!options.lang && !options.editor && !options.workdir) {
    showCurrentConfig();
    return;
  }

  // Set options
  if (options.lang) {
    const langInput = options.lang.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(langInput as SupportedLanguage)) {
      console.log(chalk.red(`Unsupported language: ${options.lang}`));
      console.log(chalk.gray(`Supported: ${SUPPORTED_LANGUAGES.join(', ')}`));
      return;
    }
    // Safe to cast after validation
    const lang = langInput as SupportedLanguage;
    config.setLanguage(lang);
    console.log(chalk.green(`✓ Default language set to ${lang}`));
  }

  if (options.editor) {
    config.setEditor(options.editor);
    console.log(chalk.green(`✓ Editor set to ${options.editor}`));
  }

  if (options.workdir) {
    config.setWorkDir(options.workdir);
    console.log(chalk.green(`✓ Work directory set to ${options.workdir}`));
  }

  if (options.repo !== undefined) {
    if (options.repo.trim() === '') {
      config.deleteRepo();
      console.log(chalk.green('✓ Repository URL cleared'));
    } else {
      config.setRepo(options.repo);
      console.log(chalk.green(`✓ Repository URL set to ${options.repo}`));
    }
  }
}

export async function configInteractiveCommand(): Promise<void> {
  const currentConfig = config.getConfig();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Default programming language:',
      choices: SUPPORTED_LANGUAGES,
      default: currentConfig.language,
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

  console.log();
  console.log(chalk.green('✓ Configuration saved'));
  showCurrentConfig();
}

function showCurrentConfig(): void {
  const currentConfig = config.getConfig();
  const creds = credentials.get();

  console.log();
  console.log(chalk.bold('LeetCode CLI Configuration'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log();
  console.log(chalk.gray('Config file:'), config.getPath());
  console.log();
  console.log(chalk.gray('Language:    '), chalk.white(currentConfig.language));
  console.log(chalk.gray('Editor:      '), chalk.white(currentConfig.editor ?? '(not set)'));
  console.log(chalk.gray('Work Dir:    '), chalk.white(currentConfig.workDir));
  console.log(chalk.gray('Repo URL:    '), chalk.white(currentConfig.repo ?? '(not set)'));
  console.log(chalk.gray('Logged in:   '), creds ? chalk.green('Yes') : chalk.yellow('No'));
}
