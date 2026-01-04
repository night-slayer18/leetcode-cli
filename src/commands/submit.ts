// Submit command - submit solution to LeetCode
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { displaySubmissionResult } from '../utils/display.js';

// Recursively find a file matching the problem ID
async function findSolutionFile(dir: string, problemId: string): Promise<string | null> {
  if (!existsSync(dir)) return null;
  
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findSolutionFile(fullPath, problemId);
      if (found) return found;
    } else if (entry.name.startsWith(`${problemId}.`)) {
      return fullPath;
    }
  }
  return null;
}

// Recursively find a file by exact filename
async function findFileByName(dir: string, fileName: string): Promise<string | null> {
  if (!existsSync(dir)) return null;
  
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findFileByName(fullPath, fileName);
      if (found) return found;
    } else if (entry.name === fileName) {
      return fullPath;
    }
  }
  return null;
}

export async function submitCommand(fileOrId: string): Promise<void> {
  const credentials = config.getCredentials();
  
  if (!credentials) {
    console.log(chalk.yellow('Please login first: leetcode login'));
    return;
  }

  leetcodeClient.setCredentials(credentials);

  let filePath = fileOrId;
  
  // If input looks like a problem ID (just numbers), find the file by ID
  if (/^\d+$/.test(fileOrId)) {
    const workDir = config.getWorkDir();
    const found = await findSolutionFile(workDir, fileOrId);
    if (!found) {
      console.log(chalk.red(`No solution file found for problem ${fileOrId}`));
      console.log(chalk.gray(`Looking in: ${workDir}`));
      console.log(chalk.gray('Run "leetcode pick ' + fileOrId + '" first to create a solution file.'));
      return;
    }
    filePath = found;
    console.log(chalk.gray(`Found: ${filePath}`));
  } 
  // If input looks like a filename (has dots but no slashes), find by filename
  else if (!fileOrId.includes('/') && !fileOrId.includes('\\') && fileOrId.includes('.')) {
    const workDir = config.getWorkDir();
    const found = await findFileByName(workDir, fileOrId);
    if (!found) {
      console.log(chalk.red(`File not found: ${fileOrId}`));
      console.log(chalk.gray(`Looking in: ${workDir}`));
      return;
    }
    filePath = found;
    console.log(chalk.gray(`Found: ${filePath}`));
  }

  // Validate file exists
  if (!existsSync(filePath)) {
    console.log(chalk.red(`File not found: ${filePath}`));
    return;
  }

  const spinner = ora('Reading solution file...').start();

  try {
    // Parse filename to get problem info
    const fileName = basename(filePath);
    const match = fileName.match(/^(\d+)\.([^.]+)\./);
    
    if (!match) {
      spinner.fail('Invalid filename format');
      console.log(chalk.gray('Expected format: {id}.{title-slug}.{ext}'));
      console.log(chalk.gray('Example: 1.two-sum.ts'));
      return;
    }

    const [, problemId, titleSlug] = match;
    const ext = fileName.split('.').pop()!;
    
    // Map extension to LeetCode language slug
    const langMap: Record<string, string> = {
      ts: 'typescript',
      js: 'javascript',
      py: 'python3',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'golang',
      rs: 'rust',
      kt: 'kotlin',
      swift: 'swift',
    };

    const lang = langMap[ext];
    if (!lang) {
      spinner.fail(`Unsupported file extension: .${ext}`);
      return;
    }

    // Read solution code
    const code = await readFile(filePath, 'utf-8');

    spinner.text = 'Fetching problem details...';

    // Get problem to retrieve question ID
    const problem = await leetcodeClient.getProblem(titleSlug);

    spinner.text = 'Submitting solution...';

    const result = await leetcodeClient.submitSolution(
      titleSlug,
      code,
      lang,
      problem.questionId
    );

    spinner.stop();
    displaySubmissionResult(result);
  } catch (error) {
    spinner.fail('Submission failed');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
