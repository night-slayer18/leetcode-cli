// Submit command - submit solution to LeetCode
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import { config } from '../storage/config.js';
import { timerStorage } from '../storage/timer.js';
import { displaySubmissionResult } from '../utils/display.js';
import { findSolutionFile, findFileByName, getLangSlugFromExtension } from '../utils/fileUtils.js';
import { isProblemId, isFileName } from '../utils/validation.js';

/**
 * Submit command - submit solution to LeetCode
 * @param fileOrId - Problem ID, filename, or file path
 */
export async function submitCommand(fileOrId: string): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  let filePath = fileOrId;

  // Resolve file path based on input type
  if (isProblemId(fileOrId)) {
    // Input is a problem ID - find by ID
    const workDir = config.getWorkDir();
    const found = await findSolutionFile(workDir, fileOrId);
    if (!found) {
      console.log(chalk.red(`No solution file found for problem ${fileOrId}`));
      console.log(chalk.gray(`Looking in: ${workDir}`));
      console.log(chalk.gray(`Run "leetcode pick ${fileOrId}" first to create a solution file.`));
      return;
    }
    filePath = found;
    console.log(chalk.gray(`Found: ${filePath}`));
  } else if (isFileName(fileOrId)) {
    // Input is a filename - find by name
    const workDir = config.getWorkDir();
    const found = await findFileByName(workDir, fileOrId);
    if (!found) {
      console.log(chalk.red(`File not found: ${fileOrId}`));
      console.log(chalk.gray(`Looking in: ${workDir}`));
      return;
    }
    filePath = found;
    console.log(chalk.gray(`Found: ${filePath}`));
  }

  // Validate file exists
  if (!existsSync(filePath)) {
    console.log(chalk.red(`File not found: ${filePath}`));
    return;
  }

  const spinner = ora({ text: 'Reading solution file...', spinner: 'dots' }).start();

  try {
    // Parse filename to get problem info
    const fileName = basename(filePath);
    const match = fileName.match(/^(\d+)\.([^.]+)\./);

    if (!match) {
      spinner.fail('Invalid filename format');
      console.log(chalk.gray('Expected format: {id}.{title-slug}.{ext}'));
      console.log(chalk.gray('Example: 1.two-sum.ts'));
      return;
    }

    const [, problemId, titleSlug] = match;
    const ext = fileName.split('.').pop()!;

    // Get language slug from extension
    const lang = getLangSlugFromExtension(ext);
    if (!lang) {
      spinner.fail(`Unsupported file extension: .${ext}`);
      return;
    }

    // Read solution code
    const code = await readFile(filePath, 'utf-8');

    spinner.text = 'Fetching problem details...';

    // Get problem to retrieve question ID
    const problem = await leetcodeClient.getProblem(titleSlug);

    spinner.text = 'Submitting solution...';

    const result = await leetcodeClient.submitSolution(
      titleSlug,
      code,
      lang,
      problem.questionId
    );

    spinner.stop();
    displaySubmissionResult(result);

    // Record timer if active and submission was accepted
    if (result.status_msg === 'Accepted') {
      const activeTimer = timerStorage.getActiveTimer();
      if (activeTimer && activeTimer.problemId === problemId) {
        const timerResult = timerStorage.stopTimer();
        if (timerResult) {
          timerStorage.recordSolveTime(
            problemId,
            problem.title,
            problem.difficulty,
            timerResult.durationSeconds,
            activeTimer.durationMinutes
          );
          
          const mins = Math.floor(timerResult.durationSeconds / 60);
          const secs = timerResult.durationSeconds % 60;
          const timeStr = `${mins}m ${secs}s`;
          const withinLimit = timerResult.durationSeconds <= activeTimer.durationMinutes * 60;
          
          console.log();
          console.log(chalk.bold('⏱️  Timer Result:'));
          console.log(
            `   Solved in ${withinLimit ? chalk.green(timeStr) : chalk.yellow(timeStr)}` +
            ` (limit: ${activeTimer.durationMinutes}m)`
          );
          if (withinLimit) {
            console.log(chalk.green('   ✓ Within time limit!'));
          } else {
            console.log(chalk.yellow('   ⚠ Exceeded time limit'));
          }
        }
      }
    }
  } catch (error) {
    spinner.fail('Submission failed');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
