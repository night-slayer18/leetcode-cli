// Stat command - show user statistics
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { displayUserStats } from '../utils/display.js';

export async function statCommand(username?: string): Promise<void> {
  const credentials = config.getCredentials();
  
  if (!credentials && !username) {
    console.log(chalk.yellow('Please login first or provide a username: leetcode stat [username]'));
    return;
  }

  if (credentials) {
    leetcodeClient.setCredentials(credentials);
  }

  const spinner = ora('Fetching statistics...').start();

  try {
    // If no username provided, get current user
    let targetUsername = username;
    
    if (!targetUsername && credentials) {
      const { isSignedIn, username: currentUser } = await leetcodeClient.checkAuth();
      if (!isSignedIn || !currentUser) {
        spinner.fail('Session expired');
        console.log(chalk.yellow('Please run "leetcode login" to re-authenticate.'));
        return;
      }
      targetUsername = currentUser;
    }

    if (!targetUsername) {
      spinner.fail('No username available');
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
