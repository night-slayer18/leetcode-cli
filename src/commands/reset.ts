// Reset command - restore an existing solution file to the original LeetCode stub
import { writeFile } from 'fs/promises';
import { basename } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
import { config } from '../storage/config.js';
import { findSolutionFile, detectLanguageFromFile } from '../utils/fileUtils.js';
import { generateSolutionFile, getPremiumPlaceholderCode } from '../utils/templates.js';
import { isPathInsideWorkDir } from '../utils/validation.js';
import { resolveSupportedLanguageFromLeetCodeSlug } from '../utils/languages.js';

export async function resetCommand(idOrSlug: string): Promise<boolean> {
  const { authorized } = await requireAuth();
  if (!authorized) return false;

  const spinner = ora({ text: 'Fetching problem details...', spinner: 'dots' }).start();

  try {
    const problem = /^\d+$/.test(idOrSlug)
      ? await leetcodeClient.getProblemById(idOrSlug)
      : await leetcodeClient.getProblem(idOrSlug);

    const workDir = config.getWorkDir();
    const filePath = await findSolutionFile(workDir, problem.questionFrontendId);

    if (!filePath) {
      spinner.fail(`No solution file found for problem ${problem.questionFrontendId}`);
      console.log(chalk.gray(`Looking in: ${workDir}`));
      console.log(
        chalk.gray(
          `Run "leetcode pick ${problem.questionFrontendId}" first to create a solution file.`
        )
      );
      return false;
    }

    if (!isPathInsideWorkDir(filePath, workDir)) {
      spinner.fail('Security Error: File path is outside the configured workspace');
      console.log(chalk.gray(`File: ${filePath}`));
      console.log(chalk.gray(`Workspace: ${workDir}`));
      return false;
    }

    const language = detectLanguageFromFile(filePath);
    if (!language) {
      spinner.fail(`Unsupported file extension: ${basename(filePath)}`);
      return false;
    }

    spinner.text = 'Generating solution stub...';

    const snippets = problem.codeSnippets ?? [];
    const template =
      snippets.find(
        (snippet) => resolveSupportedLanguageFromLeetCodeSlug(snippet.langSlug) === language
      ) ?? null;

    let code: string;
    if (snippets.length === 0) {
      code = getPremiumPlaceholderCode(language, problem.title);
    } else if (!template) {
      spinner.fail(`No code template available for ${language}`);
      console.log(chalk.gray(`Available languages: ${snippets.map((s) => s.langSlug).join(', ')}`));
      return false;
    } else {
      code = template.code;
    }

    const content = generateSolutionFile(
      problem.questionFrontendId,
      problem.titleSlug,
      problem.title,
      problem.difficulty,
      code,
      language,
      problem.content ?? undefined
    );

    await writeFile(filePath, content, 'utf-8');

    spinner.succeed(`Reset ${chalk.green(basename(filePath))}`);
    console.log(chalk.gray(`Path: ${filePath}`));
    return true;
  } catch (error) {
    spinner.fail('Failed to reset solution');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
    return false;
  }
}
