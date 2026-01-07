// Stat command - show user statistics
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import { displayUserStats } from '../utils/display.js';
import { renderHeatmap, renderSkillStats, renderTrendChart } from '../utils/stats-display.js';

interface StatOptions {
  calendar?: boolean;
  skills?: boolean;
  trend?: boolean;
}

export async function statCommand(username?: string, options: StatOptions = {}): Promise<void> {
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

    // Default view: summary stats
    if (!options.calendar && !options.skills && !options.trend) {
      displayUserStats(
        profile.username,
        profile.realName,
        profile.ranking,
        profile.acSubmissionNum,
        profile.streak,
        profile.totalActiveDays
      );
      return;
    }

    // Calendar / Heatmap
    if (options.calendar) {
      if (profile.submissionCalendar) {
        renderHeatmap(profile.submissionCalendar);
      } else {
        console.log(chalk.yellow('Calendar data not available.'));
      }
    }

    // Trend chart
    if (options.trend) {
      if (profile.submissionCalendar) {
        renderTrendChart(profile.submissionCalendar);
      } else {
        console.log(chalk.yellow('Calendar data not available.'));
      }
    }

    // Skills
    if (options.skills) {
      spinner.start('Fetching skill stats...');
      const skills = await leetcodeClient.getSkillStats(targetUsername);
      spinner.stop();
      renderSkillStats(skills.fundamental, skills.intermediate, skills.advanced);
    }
  } catch (error) {
    spinner.fail('Failed to fetch statistics');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
