// Test command - run solution against test cases
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import { config } from '../storage/config.js';
import { displayTestResult } from '../utils/display.js';
import { findSolutionFile, findFileByName, getLangSlugFromExtension } from '../utils/fileUtils.js';
import { isProblemId, isFileName, isPathInsideWorkDir } from '../utils/validation.js';

interface TestOptions {
  testcase?: string;
  visualize?: boolean;
}

export async function testCommand(fileOrId: string, options: TestOptions): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  let filePath = fileOrId;
  const workDir = config.getWorkDir();

  if (isProblemId(fileOrId)) {
    const found = await findSolutionFile(workDir, fileOrId);
    if (!found) {
      console.log(chalk.red(`No solution file found for problem ${fileOrId}`));
      console.log(chalk.gray(`Looking in: ${workDir}`));
      console.log(chalk.gray(`Run "leetcode pick ${fileOrId}" first to create a solution file.`));
      return;
    }
    filePath = found;
    console.log(chalk.gray(`Found: ${filePath}`));
  } else if (isFileName(fileOrId)) {
    const found = await findFileByName(workDir, fileOrId);
    if (!found) {
      console.log(chalk.red(`File not found: ${fileOrId}`));
      console.log(chalk.gray(`Looking in: ${workDir}`));
      return;
    }
    filePath = found;
    console.log(chalk.gray(`Found: ${filePath}`));
  }

  if (!existsSync(filePath)) {
    console.log(chalk.red(`File not found: ${filePath}`));
    return;
  }

  // Security check: Ensure file is inside workDir to prevent path traversal attacks
  if (!isPathInsideWorkDir(filePath, workDir)) {
    console.log(chalk.red('⚠️  Security Error: File path is outside the configured workspace'));
    console.log(chalk.gray(`File: ${filePath}`));
    console.log(chalk.gray(`Workspace: ${workDir}`));
    console.log(
      chalk.yellow('\nFor security reasons, you can only test files from within your workspace.')
    );
    console.log(chalk.gray('Use "leetcode config workdir <path>" to change your workspace.'));
    return;
  }

  const spinner = ora({ text: 'Reading solution file...', spinner: 'dots' }).start();

  try {
    const fileName = basename(filePath);
    const match = fileName.match(/^(\d+)\.([^.]+)\./);

    if (!match) {
      spinner.fail('Invalid filename format');
      console.log(chalk.gray('Expected format: {id}.{title-slug}.{ext}'));
      console.log(chalk.gray('Example: 1.two-sum.ts'));
      return;
    }

    const titleSlug = match[2];
    const ext = fileName.split('.').pop()!;

    const lang = getLangSlugFromExtension(ext);
    if (!lang) {
      spinner.fail(`Unsupported file extension: .${ext}`);
      return;
    }

    const code = await readFile(filePath, 'utf-8');

    spinner.text = 'Fetching problem details...';

    const problem = await leetcodeClient.getProblem(titleSlug);

    const testcases = options.testcase ?? problem.exampleTestcases ?? problem.sampleTestCase;

    spinner.text = 'Running tests...';

    const result = await leetcodeClient.testSolution(
      titleSlug,
      code,
      lang,
      testcases,
      problem.questionId
    );

    spinner.stop();
    displayTestResult(result, options.visualize ? problem.topicTags : undefined);
  } catch (error) {
    spinner.fail('Test failed');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
