import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { config } from '../storage/config.js';

function isGitInstalled(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function isMapRepo(workDir: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: workDir, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function isGhInstalled(): boolean {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function getRemoteUrl(workDir: string): string | null {
  try {
    const url = execSync('git config --get remote.origin.url', { cwd: workDir, encoding: 'utf-8' });
    return url.trim();
  } catch (error) {
    return null;
  }
}

async function setupGitRepo(workDir: string): Promise<boolean> {
  const { init } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'init',
      message: 'Work directory is not a git repository. Initialize?',
      default: true,
    },
  ]);

  if (!init) {
    console.log(chalk.yellow('Skipping basic git initialization.'));
    return false;
  }

  const spinner = ora('Initializing git repository...').start();
  try {
    execSync('git init', { cwd: workDir });
    spinner.succeed('Initialized git repository');
    return true;
  } catch (error) {
    spinner.fail('Failed to initialize git repository');
    throw error;
  }
}

async function setupRemote(workDir: string): Promise<string> {
  const spinner = ora();
  let repoUrl = config.getRepo();

  // 1. Try to get invalid remote from config
  if (!repoUrl) {
    // 2. Check if we should use `gh repo create`
    if (isGhInstalled()) {
      const { createGh } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createGh',
          message: 'Create a new private GitHub repository?',
          default: true,
        },
      ]);

      if (createGh) {
        spinner.start('Creating GitHub repository...');
        try {
          const repoName = workDir.split('/').pop() || 'leetcode-solutions';
          execSync(`gh repo create ${repoName} --private --source=. --remote=origin`, { cwd: workDir });
          spinner.succeed('Created and linked GitHub repository');
          
          // Fetch the URL to save it
           repoUrl = getRemoteUrl(workDir) || '';
           if(repoUrl) {
               config.setRepo(repoUrl);
           }
           return repoUrl;
        } catch (error) {
          spinner.fail('Failed to create GitHub repository');
          console.log(chalk.red(error));
           // Fallback to manual entry
        }
      }
    }

    // 3. Fallback: Manual URL entry
    if (!repoUrl) {
       console.log(chalk.yellow('\nPlease create a new repository on your Git provider and copy the URL.'));
        const { url } = await inquirer.prompt([
            {
            type: 'input',
            name: 'url',
            message: 'Enter remote repository URL:',
            validate: (input) => input.length > 0 ? true : 'URL cannot be empty',
            },
        ]);
        repoUrl = url;
    }
  }
  
  // Save to config if we have one now
  if(repoUrl) {
      config.setRepo(repoUrl);
  }

  // 4. Add remote if missing
  const currentRemote = getRemoteUrl(workDir);
  if (!currentRemote && repoUrl) {
      try {
          execSync(`git remote add origin ${repoUrl}`, { cwd: workDir });
          console.log(chalk.green('✓ Added remote origin'));
      } catch (e) {
          console.log(chalk.red('Failed to add remote origin'));
      }
  }

  return repoUrl || '';
}

export async function syncCommand(): Promise<void> {
  const workDir = config.getWorkDir();
  
  if (!existsSync(workDir)) {
    console.log(chalk.red(`Work directory does not exist: ${workDir}`));
    return;
  }

  if (!isGitInstalled()) {
    console.log(chalk.red('Git is not installed. Please install Git to use command.'));
    return;
  }

  // 1. Ensure Git Repo
  if (!isMapRepo(workDir)) {
    const initialized = await setupGitRepo(workDir);
    if (!initialized) return;
  }

  // 2. Ensure Remote
  await setupRemote(workDir);

  // 3. Sync
  const spinner = ora('Syncing solutions...').start();
  try {
    // Check for changes
    const status = execSync('git status --porcelain', { cwd: workDir, encoding: 'utf-8' });
    
    if (!status) {
      spinner.info('No changes to sync');
      return;
    }

    // Add
    execSync('git add .', { cwd: workDir });

    // Commit
    const lines = status.trim().split('\n');
    const count = lines.length;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const message = `Sync: ${count} solutions - ${timestamp}`;
    
    execSync(`git commit -m "${message}"`, { cwd: workDir });

    // Try pushing to main or master
    try {
        execSync('git push -u origin main', { cwd: workDir, stdio: 'ignore' });
    } catch {
         try {
             execSync('git push -u origin master', { cwd: workDir, stdio: 'ignore' });
         } catch (e) {
             throw new Error('Failed to push to remote. Please check your git credentials and branch status.');
         }
    }

    spinner.succeed('Successfully synced solutions to remote');

  } catch (error: any) {
    spinner.fail('Sync failed');
    if(error.message) {
        console.log(chalk.red(error.message));
    }
  }
}
