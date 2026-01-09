// Collab command - Collaborative coding mode
import chalk from 'chalk';
import ora from 'ora';
import { readFile } from 'fs/promises';
import { collabService } from '../services/collab.js';
import { pickCommand } from './pick.js';
import { requireAuth } from '../utils/auth.js';
import { config } from '../storage/config.js';
import { findSolutionFile } from '../utils/fileUtils.js';

export async function collabHostCommand(problemId: string): Promise<void> {
  const { authorized, username } = await requireAuth();
  if (!authorized || !username) return;

  const spinner = ora('Creating collaboration room...').start();

  try {
    const result = await collabService.createRoom(problemId, username);

    if ('error' in result) {
      spinner.fail(result.error);
      return;
    }

    spinner.succeed('Room created!');

    console.log();
    console.log(chalk.bold.cyan('👥 Collaborative Coding Session'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(chalk.white(`Room Code: ${chalk.bold.green(result.roomCode)}`));
    console.log(chalk.white(`Problem: ${problemId}`));
    console.log();
    console.log(chalk.gray('Share this code with your partner:'));
    console.log(chalk.yellow(`  leetcode collab join ${result.roomCode}`));
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('After solving, sync and compare:'));
    console.log(chalk.gray('  leetcode collab sync     - Upload your solution'));
    console.log(chalk.gray('  leetcode collab compare  - See both solutions'));
    console.log(chalk.gray('  leetcode collab status   - Check room status'));
    console.log(chalk.gray('  leetcode collab leave    - End session'));
    console.log();

    // Pick the problem and open in editor
    await pickCommand(problemId, { open: true });

  } catch (error) {
    spinner.fail('Failed to create room');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

export async function collabJoinCommand(roomCode: string): Promise<void> {
  const { authorized, username } = await requireAuth();
  if (!authorized || !username) return;

  const spinner = ora(`Joining room ${roomCode}...`).start();

  try {
    const result = await collabService.joinRoom(roomCode.toUpperCase(), username);

    if ('error' in result) {
      spinner.fail(result.error);
      return;
    }

    spinner.succeed('Joined room!');

    console.log();
    console.log(chalk.bold.cyan('👥 Collaborative Coding Session'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(chalk.white(`Room Code: ${chalk.bold.green(roomCode.toUpperCase())}`));
    console.log(chalk.white(`Problem: ${result.problemId}`));
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('After solving, sync and compare:'));
    console.log(chalk.gray('  leetcode collab sync     - Upload your solution'));
    console.log(chalk.gray('  leetcode collab compare  - See both solutions'));
    console.log(chalk.gray('  leetcode collab status   - Check room status'));
    console.log(chalk.gray('  leetcode collab leave    - End session'));
    console.log();

    // Pick the problem and open in editor
    await pickCommand(result.problemId, { open: true });

  } catch (error) {
    spinner.fail('Failed to join room');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

export async function collabSyncCommand(): Promise<void> {
  const session = collabService.getSession();
  
  if (!session) {
    console.log(chalk.yellow('No active collaboration session.'));
    console.log(chalk.gray('Use `leetcode collab host <id>` or `leetcode collab join <code>` first.'));
    return;
  }

  const spinner = ora('Syncing your code...').start();

  const workDir = config.getWorkDir();
  const filePath = await findSolutionFile(workDir, session.problemId);

  if (!filePath) {
    spinner.fail(`No solution file found for problem ${session.problemId}`);
    return;
  }

  const code = await readFile(filePath, 'utf-8');
  const result = await collabService.syncCode(code);

  if (result.success) {
    spinner.succeed('Code synced successfully!');
    console.log(chalk.gray(`Uploaded ${code.split('\n').length} lines from ${filePath}`));
  } else {
    spinner.fail(result.error || 'Sync failed');
  }
}

export async function collabCompareCommand(): Promise<void> {
  const session = collabService.getSession();
  
  if (!session) {
    console.log(chalk.yellow('No active collaboration session.'));
    console.log(chalk.gray('Use `leetcode collab host <id>` or `leetcode collab join <code>` first.'));
    return;
  }

  const spinner = ora('Fetching solutions...').start();

  // Get my code
  const workDir = config.getWorkDir();
  const filePath = await findSolutionFile(workDir, session.problemId);

  if (!filePath) {
    spinner.fail(`No solution file found for problem ${session.problemId}`);
    return;
  }

  const myCode = await readFile(filePath, 'utf-8');
  
  // Get partner's code
  const partnerResult = await collabService.getPartnerCode();

  if ('error' in partnerResult) {
    spinner.fail(partnerResult.error);
    return;
  }

  spinner.stop();

  if (!partnerResult.code) {
    console.log(chalk.yellow('Partner has not synced their code yet.'));
    console.log(chalk.gray('Ask them to run `leetcode collab sync`.'));
    return;
  }

  // Display sequential comparison
  console.log();
  console.log(chalk.bold.cyan('📊 Solution Comparison'));
  console.log(chalk.gray('─'.repeat(60)));

  // Your solution
  console.log();
  console.log(chalk.bold.green(`▸ Your Solution (${session.username})`));
  console.log(chalk.gray('─'.repeat(60)));
  const myLines = myCode.split('\n');
  for (let i = 0; i < myLines.length; i++) {
    const lineNum = String(i + 1).padStart(3, ' ');
    console.log(`${chalk.gray(lineNum)} ${myLines[i]}`);
  }

  // Partner's solution  
  console.log();
  console.log(chalk.bold.blue(`▸ ${partnerResult.username}'s Solution`));
  console.log(chalk.gray('─'.repeat(60)));
  const partnerLines = partnerResult.code.split('\n');
  for (let i = 0; i < partnerLines.length; i++) {
    const lineNum = String(i + 1).padStart(3, ' ');
    console.log(`${chalk.gray(lineNum)} ${partnerLines[i]}`);
  }

  console.log();
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray(`Your code: ${myLines.length} lines | Partner: ${partnerLines.length} lines`));
  console.log();
}

export async function collabLeaveCommand(): Promise<void> {
  const session = collabService.getSession();
  
  if (!session) {
    console.log(chalk.yellow('No active collaboration session.'));
    return;
  }

  await collabService.leaveRoom();
  console.log(chalk.green('✓ Left the collaboration session.'));
}

export async function collabStatusCommand(): Promise<void> {
  const session = collabService.getSession();
  
  if (!session) {
    console.log(chalk.yellow('No active collaboration session.'));
    console.log(chalk.gray('Use `leetcode collab host <id>` or `leetcode collab join <code>` to start.'));
    return;
  }

  const status = await collabService.getRoomStatus();

  if ('error' in status) {
    console.log(chalk.red(status.error));
    return;
  }

  console.log();
  console.log(chalk.bold.cyan('👥 Collaboration Status'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  Room: ${chalk.green(session.roomCode)}`);
  console.log(`  Problem: ${session.problemId}`);
  console.log(`  Role: ${session.isHost ? 'Host' : 'Guest'}`);
  console.log();
  console.log(chalk.bold('  Participants:'));
  console.log(`    Host: ${status.host} ${status.hasHostCode ? chalk.green('✓ synced') : chalk.gray('pending')}`);
  console.log(`    Guest: ${status.guest || chalk.gray('(waiting...)')} ${status.hasGuestCode ? chalk.green('✓ synced') : chalk.gray('pending')}`);
  console.log();
}
