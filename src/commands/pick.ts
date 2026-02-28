// Pick command - generate solution file for a problem
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import {
  getCodeTemplate,
  generateSolutionFile,
  getSolutionFileName,
  getPremiumPlaceholderCode,
} from '../utils/templates.js';
import { openInEditor } from '../utils/editor.js';
import { requireAuth } from '../utils/auth.js';
import { normalizeLanguageInput } from '../utils/languages.js';

export interface PickOptions {
  lang?: string;
  open?: boolean;
}

export async function pickCommand(idOrSlug: string, options: PickOptions): Promise<boolean> {
  const { authorized } = await requireAuth();
  if (!authorized) return false;

  const spinner = ora({ text: 'Fetching problem details...', spinner: 'dots' }).start();

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
      return false;
    }

    spinner.text = 'Generating solution file...';

    // Determine language
    const langInput = options.lang ?? config.getLanguage();
    const language = normalizeLanguageInput(langInput);
    if (!language) {
      spinner.fail(`Unsupported language: ${langInput}`);
      return false;
    }

    // Get code template
    const snippets = problem.codeSnippets ?? [];
    const template = getCodeTemplate(snippets, language);

    // Determine the code to use based on template availability
    let code: string;

    if (snippets.length === 0) {
      // Premium problem - no code snippets available from API
      spinner.warn(chalk.yellow('Premium Problem (No code snippets available)'));
      console.log(chalk.gray('Generating placeholder file with problem info...'));
      code = getPremiumPlaceholderCode(language, problem.title);
    } else if (!template) {
      // Snippets exist but not for the selected language
      spinner.fail(`No code template available for ${language}`);
      console.log(chalk.gray(`Available languages: ${snippets.map((s) => s.langSlug).join(', ')}`));
      return false;
    } else {
      // Normal case - use the template code
      code = template.code;
    }

    // Generate solution file content
    const content = generateSolutionFile(
      problem.questionFrontendId,
      problem.titleSlug,
      problem.title,
      problem.difficulty,
      code,
      language,
      problem.content ?? undefined
    );

    // Build folder path: workDir/Difficulty/Category/
    const workDir = config.getWorkDir();
    const difficulty = problem.difficulty; // Easy, Medium, Hard
    const category =
      problem.topicTags.length > 0
        ? problem.topicTags[0].name.replace(/[^\w\s-]/g, '').trim() // First tag as category
        : 'Uncategorized';

    const targetDir = join(workDir, difficulty, category);

    // Ensure directory exists
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Write file
    const fileName = getSolutionFileName(problem.questionFrontendId, problem.titleSlug, language);
    const filePath = join(targetDir, fileName);

    if (existsSync(filePath)) {
      spinner.warn(`File already exists: ${fileName}`);
      console.log(chalk.gray(`Path: ${filePath}`));

      // Optionally open existing file
      if (options.open !== false) {
        await openInEditor(filePath);
      }
      return true;
    }

    await writeFile(filePath, content, 'utf-8');

    spinner.succeed(`Created ${chalk.green(fileName)}`);
    console.log(chalk.gray(`Path: ${filePath}`));
    console.log();
    console.log(chalk.cyan(`${problem.questionFrontendId}. ${problem.title}`));
    console.log(chalk.gray(`Difficulty: ${problem.difficulty} | Category: ${category}`));

    // Open in editor
    if (options.open !== false) {
      await openInEditor(filePath);
    }
    return true;
  } catch (error) {
    spinner.fail('Failed to fetch problem');

    if (error instanceof Error) {
      // Clean up Zod error messages
      if (error.message.includes('expected object, received null')) {
        console.log(chalk.red(`Problem "${idOrSlug}" not found`));
      } else {
        try {
          const zodError = JSON.parse(error.message);
          if (Array.isArray(zodError)) {
            console.log(chalk.red('API Response Validation Failed'));
          } else {
            console.log(chalk.red(error.message));
          }
        } catch {
          console.log(chalk.red(error.message));
        }
      }
    }
    return false;
  }
}

export async function batchPickCommand(ids: string[], options: PickOptions): Promise<void> {
  if (ids.length === 0) {
    console.log(chalk.yellow('Please provide at least one problem ID'));
    return;
  }

  const { authorized } = await requireAuth();
  if (!authorized) return;

  console.log(chalk.cyan(`📦 Picking ${ids.length} problem${ids.length !== 1 ? 's' : ''}...`));
  console.log();
  console.log();

  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    // Don't open files in batch mode
    const success = await pickCommand(id, { ...options, open: false });
    if (success) {
      succeeded++;
    } else {
      failed++;
    }
    console.log(); // Add spacing between problems
  }

  // Summary
  console.log(chalk.gray('─'.repeat(50)));
  console.log(
    chalk.bold(
      `Done! ${chalk.green(`${succeeded} succeeded`)}${failed > 0 ? `, ${chalk.red(`${failed} failed`)}` : ''}`
    )
  );
}
