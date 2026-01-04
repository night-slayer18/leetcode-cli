// Pick command - generate solution file for a problem
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import {
  getCodeTemplate,
  generateSolutionFile,
  getSolutionFileName,
  LANG_SLUG_MAP,
} from '../utils/templates.js';
import type { SupportedLanguage } from '../types.js';

interface PickOptions {
  lang?: string;
  open?: boolean;
}

export async function pickCommand(idOrSlug: string, options: PickOptions): Promise<void> {
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

    spinner.text = 'Generating solution file...';

    // Determine language
    const langInput = options.lang?.toLowerCase() ?? config.getLanguage();
    const language: SupportedLanguage = (LANG_SLUG_MAP[langInput] ?? langInput) as SupportedLanguage;

    // Get code template
    const template = getCodeTemplate(problem.codeSnippets, language);
    
    if (!template) {
      spinner.fail(`No code template available for ${language}`);
      return;
    }

    // Generate solution file content
    const content = generateSolutionFile(
      problem.questionFrontendId,
      problem.titleSlug,
      problem.title,
      problem.difficulty,
      template.code,
      language,
      problem.content
    );

    // Build folder path: workDir/Difficulty/Category/
    const workDir = config.getWorkDir();
    const difficulty = problem.difficulty; // Easy, Medium, Hard
    const category = problem.topicTags.length > 0 
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
        openInEditor(filePath);
      }
      return;
    }

    await writeFile(filePath, content, 'utf-8');
    
    spinner.succeed(`Created ${chalk.green(fileName)}`);
    console.log(chalk.gray(`Path: ${filePath}`));
    console.log();
    console.log(chalk.cyan(`${problem.questionFrontendId}. ${problem.title}`));
    console.log(chalk.gray(`Difficulty: ${problem.difficulty} | Category: ${category}`));

    // Open in editor
    if (options.open !== false) {
      openInEditor(filePath);
    }
  } catch (error) {
    spinner.fail('Failed to create solution file');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}

function openInEditor(filePath: string): void {
  const editor = config.getEditor() ?? process.env.EDITOR ?? 'code';
  const workDir = config.getWorkDir();
  
  // Terminal editors need to run in foreground - skip auto-open
  const terminalEditors = ['vim', 'nvim', 'vi', 'nano', 'emacs', 'micro'];
  if (terminalEditors.includes(editor)) {
    console.log();
    console.log(chalk.gray(`Open with: ${editor} ${filePath}`));
    return;
  }
  
  try {
    // For VS Code family, open the folder and go to the file
    // -r = reuse existing window, -g = go to file
    if (editor === 'code' || editor === 'code-insiders' || editor === 'cursor') {
      const child = spawn(editor, ['-r', workDir, '-g', filePath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    } else {
      // For other GUI editors, just open the file
      const child = spawn(editor, [filePath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    }
  } catch {
    // Silently fail if editor cannot be opened
  }
}

