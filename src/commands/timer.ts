// Timer command - Interview mode with countdown
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { timerStorage } from '../storage/timer.js';
import { pickCommand } from './pick.js';
import { requireAuth } from '../utils/auth.js';

const DEFAULT_TIMES: Record<string, number> = {
  Easy: 20,
  Medium: 40,
  Hard: 60,
};

interface TimerOptions {
  minutes?: number;
  stats?: boolean;
  stop?: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

export async function timerCommand(idOrSlug: string | undefined, options: TimerOptions): Promise<void> {
  // Handle --stats flag
  if (options.stats) {
    await showTimerStats(idOrSlug);
    return;
  }

  // Handle --stop flag
  if (options.stop) {
    await stopActiveTimer();
    return;
  }

  // For starting a timer, id is required
  if (!idOrSlug) {
    console.log(chalk.yellow('Please provide a problem ID to start the timer.'));
    console.log(chalk.gray('Usage: leetcode timer <id>'));
    console.log(chalk.gray('       leetcode timer --stats'));
    console.log(chalk.gray('       leetcode timer --stop'));
    return;
  }

  const { authorized } = await requireAuth();
  if (!authorized) return;

  // Check for existing active timer
  const activeTimer = timerStorage.getActiveTimer();
  if (activeTimer) {
    const startedAt = new Date(activeTimer.startedAt);
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    
    console.log(chalk.yellow('⚠️  You have an active timer running:'));
    console.log(chalk.white(`   Problem: ${activeTimer.title}`));
    console.log(chalk.white(`   Elapsed: ${formatDuration(elapsed)}`));
    console.log();
    console.log(chalk.gray('Use `leetcode timer --stop` to stop it first.'));
    return;
  }

  const spinner = ora('Fetching problem...').start();

  try {
    let problem;
    if (/^\d+$/.test(idOrSlug)) {
      problem = await leetcodeClient.getProblemById(idOrSlug);
    } else {
      problem = await leetcodeClient.getProblem(idOrSlug);
    }

    if (!problem) {
      spinner.fail(`Problem "${idOrSlug}" not found`);
      return;
    }

    spinner.stop();

    // Determine timer duration
    const durationMinutes = options.minutes ?? DEFAULT_TIMES[problem.difficulty] ?? 30;

    // Start the timer
    timerStorage.startTimer(
      problem.questionFrontendId,
      problem.title,
      problem.difficulty,
      durationMinutes
    );

    console.log();
    console.log(chalk.bold.cyan('⏱️  Interview Mode Started!'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    console.log(chalk.white(`Problem: ${problem.questionFrontendId}. ${problem.title}`));
    console.log(chalk.white(`Difficulty: ${chalk.bold(problem.difficulty)}`));
    console.log(chalk.white(`Time Limit: ${chalk.bold.yellow(durationMinutes + ' minutes')}`));
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.green('✓ Timer is running in background'));
    console.log(chalk.gray('  When you submit successfully, your time will be recorded.'));
    console.log(chalk.gray('  Use `leetcode timer --stop` to cancel.'));
    console.log();

    // Pick the problem (opens editor)
    await pickCommand(idOrSlug, { open: true });

  } catch (error) {
    spinner.fail('Failed to start timer');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

async function stopActiveTimer(): Promise<void> {
  const result = timerStorage.stopTimer();
  
  if (!result) {
    console.log(chalk.yellow('No active timer to stop.'));
    return;
  }

  console.log(chalk.green('⏱️  Timer stopped.'));
  console.log(chalk.gray(`Elapsed time: ${formatDuration(result.durationSeconds)}`));
  console.log(chalk.gray('(Time not recorded since problem was not submitted)'));
}

async function showTimerStats(problemId?: string): Promise<void> {
  if (problemId && /^\d+$/.test(problemId)) {
    // Show stats for specific problem
    const times = timerStorage.getSolveTimes(problemId);
    
    if (times.length === 0) {
      console.log(chalk.yellow(`No solve times recorded for problem ${problemId}`));
      return;
    }

    console.log();
    console.log(chalk.bold(`⏱️  Solve Times for Problem ${problemId}`));
    console.log(chalk.gray('─'.repeat(40)));

    for (const entry of times) {
      const date = new Date(entry.solvedAt).toLocaleDateString();
      const duration = formatDuration(entry.durationSeconds);
      const limit = entry.timerMinutes;
      const withinLimit = entry.durationSeconds <= limit * 60;

      console.log(
        `  ${date}  ${withinLimit ? chalk.green(duration) : chalk.red(duration)}  (limit: ${limit}m)`
      );
    }
  } else {
    // Show overall stats
    const stats = timerStorage.getStats();
    const allTimes = timerStorage.getAllSolveTimes();
    
    console.log();
    console.log(chalk.bold('⏱️  Timer Statistics'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log();
    console.log(`  Problems timed: ${chalk.cyan(stats.totalProblems)}`);
    console.log(`  Total time: ${chalk.cyan(formatDuration(stats.totalTime))}`);
    console.log(`  Average time: ${chalk.cyan(formatDuration(stats.avgTime))}`);
    console.log();

    // Show recent solves
    const recentSolves: { problemId: string; title: string; duration: number; date: string }[] = [];
    
    for (const [id, times] of Object.entries(allTimes)) {
      for (const t of times) {
        recentSolves.push({
          problemId: id,
          title: t.title,
          duration: t.durationSeconds,
          date: t.solvedAt,
        });
      }
    }

    if (recentSolves.length > 0) {
      recentSolves.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log(chalk.bold('  Recent Solves:'));
      for (const solve of recentSolves.slice(0, 5)) {
        const date = new Date(solve.date).toLocaleDateString();
        console.log(
          chalk.gray(`    ${date}  `) +
          chalk.white(`${solve.problemId}. ${solve.title.substring(0, 25)}`) +
          chalk.gray('  ') +
          chalk.cyan(formatDuration(solve.duration))
        );
      }
    }
    console.log();
  }
}
