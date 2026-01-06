// Daily command - get daily challenge
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import { displayDailyChallenge } from '../utils/display.js';

interface DailyOptions {
  pick?: boolean;
  lang?: string;
}

export async function dailyCommand(): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  const spinner = ora('Fetching daily challenge...').start();

  try {
    const daily = await leetcodeClient.getDailyChallenge();

    spinner.stop();
    displayDailyChallenge(daily.date, daily.question);

    console.log();
    console.log(chalk.gray('Run the following to start working on this problem:'));
    console.log(chalk.cyan(`  leetcode pick ${daily.question.titleSlug}`));
  } catch (error) {
    spinner.fail('Failed to fetch daily challenge');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
