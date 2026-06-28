import chalk from 'chalk';
import { GITHUB_REPO_URL, openGitHubRepo } from '../utils/star-prompt.js';

export async function starCommand(): Promise<void> {
  console.log();
  console.log(chalk.yellow('⭐ Thanks for supporting leetcode-cli!'));
  console.log(chalk.gray(`Opening ${GITHUB_REPO_URL}`));
  console.log();

  await openGitHubRepo();
}
