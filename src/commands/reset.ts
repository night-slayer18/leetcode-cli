// Reset command - restore an existing solution file to the original LeetCode stub
import { readFile, realpath, writeFile } from 'fs/promises';
import { basename, extname } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { requireAuth } from '../utils/auth.js';
import { config } from '../storage/config.js';
import { snapshotStorage } from '../storage/snapshots.js';
import { findSolutionFile, detectLanguageFromFile } from '../utils/fileUtils.js';
import { generateSolutionFile, getPremiumPlaceholderCode } from '../utils/templates.js';
import { isPathInsideWorkDir } from '../utils/validation.js';
import {
  resolveLanguageInput,
  resolveSupportedLanguageFromLeetCodeSlug,
} from '../utils/languages.js';
import { resolveProblem } from '../utils/problem-resolver.js';

interface ResetOptions {
  lang?: string;
}

export async function resetCommand(idOrSlug: string, options: ResetOptions = {}): Promise<boolean> {
  const { authorized } = await requireAuth();
  if (!authorized) return false;

  const spinner = ora({ text: 'Fetching problem details...', spinner: 'dots' }).start();

  const problem = await resolveProblem(idOrSlug, { spinner });
  if (!problem) return false;

  try {
    const { input, language: lookupLang } = resolveLanguageInput(options.lang);
    if (!lookupLang) {
      spinner.fail(`Unsupported language: ${input}`);
      return false;
    }

    const workDir = config.getWorkDir();
    const filePath = await findSolutionFile(workDir, problem.questionFrontendId, lookupLang);

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

    const [realFilePath, realWorkDir] = await Promise.all([realpath(filePath), realpath(workDir)]);

    if (!isPathInsideWorkDir(realFilePath, realWorkDir)) {
      spinner.fail('Security Error: File path is outside the configured workspace');
      console.log(chalk.gray(`File: ${filePath}`));
      console.log(chalk.gray(`Workspace: ${workDir}`));
      return false;
    }

    const language = detectLanguageFromFile(filePath);
    if (!language) {
      spinner.fail(`Unsupported file extension: ${extname(filePath) || '(none)'}`);
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

    const currentCode = await readFile(filePath, 'utf-8');
    const backupName = `backup-before-reset-${Date.now()}`;
    const backup = snapshotStorage.save(
      problem.questionFrontendId,
      problem.title,
      currentCode,
      language,
      backupName
    );

    if ('error' in backup) {
      spinner.fail('Failed to create reset backup');
      console.log(chalk.red(backup.error));
      return false;
    }

    await writeFile(filePath, content, 'utf-8');

    spinner.succeed(`Reset ${chalk.green(basename(filePath))}`);
    console.log(chalk.gray(`Path: ${filePath}`));
    console.log(chalk.gray(`Backup: ${backup.name}`));
    return true;
  } catch (error) {
    spinner.fail('Failed to reset solution');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
    return false;
  }
}
