// Stat command - show user statistics
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import { displayUserStats } from '../utils/display.js';

export async function statCommand(username?: string): Promise<void> {
  const { authorized, username: currentUser } = await requireAuth();
  if (!authorized) return;

  const spinner = ora('Fetching statistics...').start();

  try {
    const targetUsername = username || currentUser;
    
    if (!targetUsername) {
      spinner.fail('No username found');
      return;
    }

    const profile = await leetcodeClient.getUserProfile(targetUsername);

    spinner.stop();
    displayUserStats(
      profile.username,
      profile.realName,
      profile.ranking,
      profile.acSubmissionNum,
      profile.streak,
      profile.totalActiveDays
    );
  } catch (error) {
    spinner.fail('Failed to fetch statistics');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
