// Show command - display problem description
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { displayProblemDetail } from '../utils/display.js';

export async function showCommand(idOrSlug: string): Promise<void> {
  const credentials = config.getCredentials();
  
  if (credentials) {
    leetcodeClient.setCredentials(credentials);
  }

  const spinner = ora('Fetching problem...').start();

  try {
    let problem;

    // Check if it's a numeric ID or a title slug
    if (/^\d+$/.test(idOrSlug)) {
      problem = await leetcodeClient.getProblemById(idOrSlug);
    } else {
      problem = await leetcodeClient.getProblem(idOrSlug);
    }

    spinner.stop();
    displayProblemDetail(problem);
  } catch (error) {
    spinner.fail('Failed to fetch problem');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
