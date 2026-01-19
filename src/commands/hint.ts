// Hint command - display problem hints progressively
import chalk from 'chalk';
import ora from 'ora';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import striptags from 'striptags';

export async function hintCommand(idOrSlug: string, options: { all?: boolean }): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  const spinner = ora('Fetching problem hints...').start();

  try {
    let problem;

    // Check if it's a numeric ID or a title slug
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

    // Display problem title
    console.log();
    console.log(chalk.bold.cyan(`${problem.questionFrontendId}. ${problem.title}`));
    console.log();

    const hints = problem.hints || [];

    if (hints.length === 0) {
      console.log(chalk.yellow('⚠ No hints available for this problem.'));
      console.log(chalk.gray('Try working through the problem description and examples first!'));
      return;
    }

    if (options.all) {
      // Show all hints at once
      hints.forEach((hint, index) => {
        displayHint(hint, index + 1, hints.length);
      });
    } else {
      // Show hints one at a time with prompts
      await showHintsProgressively(hints);
    }
  } catch (error) {
    spinner.fail('Failed to fetch problem hints');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

function displayHint(hint: string, number: number, total: number): void {
  const cleanedHint = cleanHtml(hint);

  console.log(chalk.bold.yellow(`💡 Hint ${number}/${total}`));
  console.log(chalk.white(cleanedHint));
  console.log();
}

function cleanHtml(html: string): string {
  const formatted = html
    .replace(/<code>/g, chalk.cyan('`'))
    .replace(/<\/code>/g, chalk.cyan('`'))
    .replace(/<b>/g, chalk.bold(''))
    .replace(/<\/b>/g, '')
    .replace(/<i>/g, chalk.italic(''))
    .replace(/<\/i>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n');

  return (striptags(formatted) ?? '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();
}

async function showHintsProgressively(hints: string[]): Promise<void> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askForNextHint = (index: number): Promise<void> => {
    return new Promise((resolve) => {
      if (index >= hints.length) {
        console.log(chalk.green('✓ All hints revealed! Good luck solving the problem!'));
        rl.close();
        resolve();
        return;
      }

      displayHint(hints[index], index + 1, hints.length);

      if (index < hints.length - 1) {
        rl.question(
          chalk.gray(
            `Press Enter for next hint (${hints.length - index - 1} remaining), or 'q' to quit: `
          ),
          (answer) => {
            if (answer.toLowerCase() === 'q') {
              console.log(
                chalk.gray('\nGood luck! You can always run this command again for more hints.')
              );
              rl.close();
              resolve();
            } else {
              resolve(askForNextHint(index + 1));
            }
          }
        );
      } else {
        console.log(chalk.green('✓ All hints revealed! Good luck solving the problem!'));
        rl.close();
        resolve();
      }
    });
  };

  await askForNextHint(0);
}
