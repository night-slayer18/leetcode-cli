// Today command - show today's progress summary
import chalk from 'chalk';
import ora from 'ora';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';

export async function todayCommand(): Promise<void> {
  const { authorized, username } = await requireAuth();

  if (!authorized || !username) {
    return;
  }

  const spinner = ora({ text: 'Fetching your progress...', spinner: 'dots' }).start();

  try {
    const [profile, daily] = await Promise.all([
      leetcodeClient.getUserProfile(username),
      leetcodeClient.getDailyChallenge(),
    ]);

    spinner.stop();

    console.log();
    console.log(chalk.bold.cyan(`📊 Today's Summary`), chalk.gray(`- ${username}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();

    console.log(
      chalk.yellow(`🔥 Current Streak: ${profile.streak} day${profile.streak !== 1 ? 's' : ''}`)
    );
    console.log(chalk.gray(`   Total Active Days: ${profile.totalActiveDays}`));
    console.log();

    const total = profile.acSubmissionNum.find((s) => s.difficulty === 'All');
    const easy = profile.acSubmissionNum.find((s) => s.difficulty === 'Easy');
    const medium = profile.acSubmissionNum.find((s) => s.difficulty === 'Medium');
    const hard = profile.acSubmissionNum.find((s) => s.difficulty === 'Hard');

    console.log(chalk.white('📈 Problems Solved:'));
    console.log(
      `   ${chalk.green('Easy')}: ${easy?.count ?? 0}  |  ${chalk.yellow('Medium')}: ${medium?.count ?? 0}  |  ${chalk.red('Hard')}: ${hard?.count ?? 0}`
    );
    console.log(`   ${chalk.bold('Total')}: ${total?.count ?? 0}`);
    console.log();

    console.log(chalk.bold.yellow("🎯 Today's Challenge:"));
    console.log(`   ${daily.question.questionFrontendId}. ${daily.question.title}`);
    console.log(`   ${colorDifficulty(daily.question.difficulty)}`);

    const status = daily.question.status;
    if (status === 'ac') {
      console.log(chalk.green('   ✓ Completed!'));
    } else if (status === 'notac') {
      console.log(chalk.yellow('   ○ Attempted'));
    } else {
      console.log(chalk.gray('   - Not started'));
    }

    console.log();
    console.log(
      chalk.gray(`   leetcode pick ${daily.question.questionFrontendId} # Start working on it`)
    );
  } catch (error) {
    spinner.fail('Failed to fetch progress');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

function colorDifficulty(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return chalk.green(difficulty);
    case 'medium':
      return chalk.yellow(difficulty);
    case 'hard':
      return chalk.red(difficulty);
    default:
      return difficulty;
  }
}
