// List command - list LeetCode problems
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { displayProblemList } from '../utils/display.js';
import type { ProblemListFilters } from '../types.js';

interface ListOptions {
  difficulty?: string;
  status?: string;
  tag?: string[];
  search?: string;
  limit?: string;
  page?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const credentials = config.getCredentials();
  
  if (credentials) {
    leetcodeClient.setCredentials(credentials);
  }

  const spinner = ora('Fetching problems...').start();

  try {
    const filters: ProblemListFilters = {};
    const limit = parseInt(options.limit ?? '20', 10);
    const page = parseInt(options.page ?? '1', 10);

    filters.limit = limit;
    filters.skip = (page - 1) * limit;

    if (options.difficulty) {
      const diffMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
        easy: 'EASY',
        e: 'EASY',
        medium: 'MEDIUM',
        m: 'MEDIUM',
        hard: 'HARD',
        h: 'HARD',
      };
      filters.difficulty = diffMap[options.difficulty.toLowerCase()];
    }

    if (options.status) {
      const statusMap: Record<string, 'NOT_STARTED' | 'AC' | 'TRIED'> = {
        todo: 'NOT_STARTED',
        solved: 'AC',
        ac: 'AC',
        attempted: 'TRIED',
        tried: 'TRIED',
      };
      filters.status = statusMap[options.status.toLowerCase()];
    }

    if (options.tag?.length) {
      filters.tags = options.tag;
    }

    if (options.search) {
      filters.searchKeywords = options.search;
    }

    const { total, problems } = await leetcodeClient.getProblems(filters);
    
    spinner.stop();

    if (problems.length === 0) {
      console.log(chalk.yellow('No problems found matching your criteria.'));
      return;
    }

    displayProblemList(problems, total);

    if (page * limit < total) {
      console.log(chalk.gray(`\nPage ${page} of ${Math.ceil(total / limit)}. Use --page to navigate.`));
    }
  } catch (error) {
    spinner.fail('Failed to fetch problems');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
