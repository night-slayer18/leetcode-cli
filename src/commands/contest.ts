// Contest command - browse contests and generate a solution for a contest problem
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import type { Contest, ContestDetail } from '../types.js';
import { requireAuth } from '../utils/auth.js';
import { pickCommand } from './pick.js';

export interface ContestOptions {
  lang?: string;
  open?: boolean;
}

const LEETCODE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isPromptCancellation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ExitPromptError' || error.message.toLowerCase().includes('force closed'))
  );
}

function getContestLabel(contest: Contest): string {
  return contest.titleSlug === contest.title
    ? contest.title
    : `${contest.title} (${contest.titleSlug})`;
}

function getQuestionChoices(contest: ContestDetail): Array<{ name: string; value: string }> {
  return contest.questions.map((question, index) => ({
    name: `${index + 1}. ${question.title} (${question.titleSlug})`,
    value: question.titleSlug,
  }));
}

export async function contestCommand(
  contestSlug?: string,
  options: ContestOptions = {}
): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  let spinner = ora({ text: 'Fetching contests...', spinner: 'dots' }).start();
  let spinnerRunning = true;
  let operation = 'fetch contests';
  let selectedContestSlug = contestSlug;

  const stopSpinner = (): void => {
    if (spinnerRunning) {
      spinner.stop();
      spinnerRunning = false;
    }
  };

  const failSpinner = (message: string): void => {
    if (spinnerRunning) {
      spinner.fail(message);
      spinnerRunning = false;
    }
  };

  try {
    if (!selectedContestSlug) {
      const contests = await leetcodeClient.getContests();
      stopSpinner();

      if (contests.length === 0) {
        console.log(chalk.yellow('No contests are available.'));
        return;
      }

      operation = 'select contest';
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'contestSlug',
          message: 'Select a contest:',
          choices: contests.map((contest) => ({
            name: getContestLabel(contest),
            value: contest.titleSlug,
          })),
        },
      ]);

      selectedContestSlug = answer.contestSlug;
      if (typeof selectedContestSlug !== 'string' || selectedContestSlug.length === 0) {
        console.log(chalk.yellow('Contest selection cancelled.'));
        return;
      }
    }

    stopSpinner();
    operation = 'fetch contest';
    spinner = ora({ text: 'Fetching contest problems...', spinner: 'dots' }).start();
    spinnerRunning = true;
    const contest = await leetcodeClient.getContest(selectedContestSlug);
    stopSpinner();

    if (!contest) {
      console.log(chalk.yellow(`Contest "${selectedContestSlug}" is unavailable.`));
      return;
    }

    const choices = getQuestionChoices(contest);
    if (choices.length === 0) {
      console.log(chalk.yellow(`Contest "${getContestLabel(contest)}" has no problems available.`));
      return;
    }

    operation = 'select contest problem';
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'questionSlug',
        message: `Select a problem from ${getContestLabel(contest)}:`,
        choices,
      },
    ]);

    if (typeof answer.questionSlug !== 'string' || answer.questionSlug.length === 0) {
      console.log(chalk.yellow('Contest problem selection cancelled.'));
      return;
    }

    if (!LEETCODE_SLUG_PATTERN.test(answer.questionSlug)) {
      console.log(
        chalk.yellow(
          `Contest problem "${answer.questionSlug}" is unavailable or has an invalid slug.`
        )
      );
      return;
    }

    await pickCommand(answer.questionSlug, options);
  } catch (error) {
    if (isPromptCancellation(error)) {
      stopSpinner();
      console.log(chalk.yellow('Contest selection cancelled.'));
      return;
    }

    if (operation === 'fetch contest' && error instanceof Error && /not found/i.test(error.message)) {
      failSpinner('Contest unavailable');
      console.log(chalk.yellow(`Contest "${selectedContestSlug ?? ''}" is unavailable.`));
      return;
    }

    failSpinner(`Failed to ${operation}`);
    console.log(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
  }
}
