// Workspace command - manage problem-solving contexts
import chalk from 'chalk';
import { workspaceStorage, WorkspaceConfig } from '../storage/workspaces.js';
import inquirer from 'inquirer';
import { homedir } from 'os';
import { join } from 'path';
import { isValidWorkspaceName } from '../utils/validation.js';

export async function workspaceCurrentCommand(): Promise<void> {
  const active = workspaceStorage.getActive();
  const config = workspaceStorage.getConfig(active);

  console.log();
  console.log(chalk.bold.cyan(`📁 Active Workspace: ${active}`));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  workDir:  ${chalk.white(config.workDir)}`);
  console.log(`  lang:     ${chalk.white(config.lang)}`);
  if (config.editor) console.log(`  editor:   ${chalk.white(config.editor)}`);
  if (config.syncRepo) console.log(`  syncRepo: ${chalk.white(config.syncRepo)}`);
  console.log();
}

export async function workspaceListCommand(): Promise<void> {
  const workspaces = workspaceStorage.list();
  const active = workspaceStorage.getActive();

  console.log();
  console.log(chalk.bold('Workspaces:'));
  console.log();

  for (const ws of workspaces) {
    const config = workspaceStorage.getConfig(ws);
    const marker = ws === active ? chalk.green('▸ ') : '  ';
    const name = ws === active ? chalk.green.bold(ws) : ws;
    console.log(`${marker}${name}`);
    console.log(`    ${chalk.gray(config.workDir)}`);
  }
  console.log();
}

export async function workspaceCreateCommand(
  name: string,
  options: { workdir?: string }
): Promise<void> {
  const workspaceName = name.trim();
  if (!isValidWorkspaceName(workspaceName)) {
    console.log(chalk.red('Invalid workspace name.'));
    console.log(chalk.gray('Use 1-64 characters: letters, numbers, "-" or "_".'));
    return;
  }

  if (workspaceStorage.exists(workspaceName)) {
    console.log(chalk.red(`Workspace "${workspaceName}" already exists`));
    return;
  }

  const workDir = options.workdir ?? join(homedir(), 'leetcode', workspaceName);

  const config: WorkspaceConfig = {
    workDir,
    lang: 'typescript',
  };

  const success = workspaceStorage.create(workspaceName, config);

  if (success) {
    console.log(chalk.green(`✓ Created workspace "${workspaceName}"`));
    console.log(`  workDir: ${chalk.gray(workDir)}`);
    console.log();
    console.log(chalk.gray(`Switch to it: leetcode workspace use ${workspaceName}`));
  } else {
    console.log(chalk.red('Failed to create workspace'));
  }
}

export async function workspaceUseCommand(name: string): Promise<void> {
  const workspaceName = name.trim();
  if (!isValidWorkspaceName(workspaceName)) {
    console.log(chalk.red('Invalid workspace name.'));
    return;
  }

  if (!workspaceStorage.exists(workspaceName)) {
    console.log(chalk.red(`Workspace "${workspaceName}" not found`));
    console.log(chalk.gray('Use `leetcode workspace list` to see available workspaces'));
    return;
  }

  const success = workspaceStorage.setActive(workspaceName);

  if (success) {
    const config = workspaceStorage.getConfig(workspaceName);
    console.log(chalk.green(`✓ Switched to workspace "${workspaceName}"`));
    console.log(`  workDir: ${chalk.gray(config.workDir)}`);
  } else {
    console.log(chalk.red('Failed to switch workspace'));
  }
}

export async function workspaceDeleteCommand(name: string): Promise<void> {
  const workspaceName = name.trim();
  if (!isValidWorkspaceName(workspaceName)) {
    console.log(chalk.red('Invalid workspace name.'));
    return;
  }

  if (workspaceName === 'default') {
    console.log(chalk.red('Cannot delete the default workspace'));
    return;
  }

  if (!workspaceStorage.exists(workspaceName)) {
    console.log(chalk.red(`Workspace "${workspaceName}" not found`));
    return;
  }

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Delete workspace "${workspaceName}"? (files in workDir will NOT be deleted)`,
      default: false,
    },
  ]);

  if (!confirmed) {
    console.log(chalk.gray('Cancelled'));
    return;
  }

  const success = workspaceStorage.delete(workspaceName);

  if (success) {
    console.log(chalk.green(`✓ Deleted workspace "${workspaceName}"`));
  } else {
    console.log(chalk.red('Failed to delete workspace'));
  }
}
