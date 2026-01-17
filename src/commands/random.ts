
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';

import { ProblemListFilters } from '../types.js';
import { showCommand } from './show.js';
import { pickCommand } from './pick.js';

interface RandomOptions {
  difficulty?: string;
  tag?: string;
  pick?: boolean;
  open?: boolean;
}

export async function randomCommand(options: RandomOptions): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  const spinner = ora('Fetching random problem...').start();

  try {
    const filters: ProblemListFilters = {};

    if (options.difficulty) {
      const diffMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
        easy: 'EASY',
        e: 'EASY',
        medium: 'MEDIUM',
        m: 'MEDIUM',
        hard: 'HARD',
        h: 'HARD',
      };
      const diff = diffMap[options.difficulty.toLowerCase()];
      if (diff) {
        filters.difficulty = diff;
      } else {
        spinner.fail(`Invalid difficulty: ${options.difficulty}`);
        return;
      }
    }

    if (options.tag) {
      filters.tags = [options.tag];
    }

    const titleSlug = await leetcodeClient.getRandomProblem(filters);
    
    spinner.succeed('Found random problem!');
    console.log();

    if (options.pick) {
      // Forward to pick command
      await pickCommand(titleSlug, { open: options.open ?? true });
    } else {
      // Forward to show command
      await showCommand(titleSlug);
      
      console.log(chalk.gray('Run following to start solving:'));
      console.log(chalk.cyan(`  leetcode pick ${titleSlug}`));
    }

  } catch (error) {
    spinner.fail('Failed to fetch random problem');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
