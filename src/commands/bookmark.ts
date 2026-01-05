// Bookmark command - manage problem bookmarks
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { bookmarks } from '../storage/bookmarks.js';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { validateProblemId } from '../utils/validation.js';

type BookmarkAction = 'add' | 'remove' | 'list' | 'clear';

export async function bookmarkCommand(action: string, id?: string): Promise<void> {
  const validActions: BookmarkAction[] = ['add', 'remove', 'list', 'clear'];
  
  if (!validActions.includes(action as BookmarkAction)) {
    console.log(chalk.red(`Invalid action: ${action}`));
    console.log(chalk.gray('Valid actions: add, remove, list, clear'));
    return;
  }

  switch (action as BookmarkAction) {
    case 'add':
      if (!id) {
        console.log(chalk.red('Please provide a problem ID to bookmark'));
        return;
      }
      if (!validateProblemId(id)) {
        console.log(chalk.red(`Invalid problem ID: ${id}`));
        console.log(chalk.gray('Problem ID must be a positive integer'));
        return;
      }
      if (bookmarks.add(id)) {
        console.log(chalk.green(`✓ Bookmarked problem ${id}`));
      } else {
        console.log(chalk.yellow(`Problem ${id} is already bookmarked`));
      }
      break;

    case 'remove':
      if (!id) {
        console.log(chalk.red('Please provide a problem ID to remove'));
        return;
      }
      if (bookmarks.remove(id)) {
        console.log(chalk.green(`✓ Removed bookmark for problem ${id}`));
      } else {
        console.log(chalk.yellow(`Problem ${id} is not bookmarked`));
      }
      break;

    case 'list':
      await listBookmarks();
      break;

    case 'clear':
      const count = bookmarks.count();
      if (count === 0) {
        console.log(chalk.yellow('No bookmarks to clear'));
      } else {
        bookmarks.clear();
        console.log(chalk.green(`✓ Cleared ${count} bookmark${count !== 1 ? 's' : ''}`));
      }
      break;
  }
}

async function listBookmarks(): Promise<void> {
  const bookmarkList = bookmarks.list();

  if (bookmarkList.length === 0) {
    console.log(chalk.yellow('📌 No bookmarked problems'));
    console.log(chalk.gray('Use "leetcode bookmark add <id>" to bookmark a problem'));
    return;
  }

  console.log();
  console.log(chalk.bold.cyan(`📌 Bookmarked Problems (${bookmarkList.length})`));
  console.log();

  const credentials = config.getCredentials();
  if (credentials) {
    leetcodeClient.setCredentials(credentials);
    
    const spinner = ora({ text: 'Fetching problem details...', spinner: 'dots' }).start();
    
    try {
      const table = new Table({
        head: [
          chalk.cyan('ID'),
          chalk.cyan('Title'),
          chalk.cyan('Difficulty'),
          chalk.cyan('Status'),
        ],
        colWidths: [8, 45, 12, 10],
        style: { head: [], border: [] },
      });

      for (const id of bookmarkList) {
        try {
          const problem = await leetcodeClient.getProblemById(id);
          if (problem) {
            table.push([
              problem.questionFrontendId,
              problem.title.length > 42 ? problem.title.slice(0, 39) + '...' : problem.title,
              colorDifficulty(problem.difficulty),
              problem.status === 'ac' ? chalk.green('✓') : chalk.gray('-'),
            ]);
          } else {
            table.push([id, chalk.gray('(not found)'), '-', '-']);
          }
        } catch {
          table.push([id, chalk.gray('(error fetching)'), '-', '-']);
        }
      }

      spinner.stop();
      console.log(table.toString());
    } catch {
      spinner.stop();
      console.log(chalk.gray('IDs: ') + bookmarkList.join(', '));
    }
  } else {
    console.log(chalk.gray('IDs: ') + bookmarkList.join(', '));
    console.log();
    console.log(chalk.gray('Login to see problem details'));
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
