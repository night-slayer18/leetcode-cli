// Submissions command - view and download past submissions
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { displaySubmissionsList } from '../utils/display.js';
import { LANG_SLUG_MAP, LANGUAGE_EXTENSIONS } from '../utils/templates.js';
import type { SupportedLanguage } from '../types.js';

interface SubmissionsOptions {
  limit?: string;
  last?: boolean;
  download?: boolean;
}

export async function submissionsCommand(idOrSlug: string, options: SubmissionsOptions): Promise<void> {
  const credentials = config.getCredentials();
  
  if (!credentials) {
    console.log(chalk.red('Please login first to view submissions.'));
    return;
  }
  leetcodeClient.setCredentials(credentials);

  const spinner = ora('Fetching problem info...').start();

  try {
    // 1. Resolve Problem to get Slug (and details for file path)
    let problem;
    if (/^\d+$/.test(idOrSlug)) {
      problem = await leetcodeClient.getProblemById(idOrSlug);
    } else {
      problem = await leetcodeClient.getProblem(idOrSlug);
    }

    if (!problem) {
      spinner.fail(`Problem "${idOrSlug}" not found`);
      return;
    }

    const slug = problem.titleSlug;
    spinner.text = 'Fetching submissions...';

    // 2. Fetch Submissions
    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const submissions = await leetcodeClient.getSubmissionList(slug, limit);
    
    spinner.stop();

    if (submissions.length === 0) {
      console.log(chalk.yellow('No submissions found.'));
      return;
    }

    // 3. Handle --last (Filter view)
    if (options.last) {
      const lastAC = submissions.find(s => s.statusDisplay === 'Accepted');
      if (lastAC) {
        console.log(chalk.bold('Last Accepted Submission:'));
        displaySubmissionsList([lastAC]);
      } else {
        console.log(chalk.yellow('No accepted submissions found in recent history.'));
      }
    } else {
      displaySubmissionsList(submissions);
    }

    // 4. Handle --download
    if (options.download) {
      const downloadSpinner = ora('Downloading submission...').start();
      
      const lastAC = submissions.find(s => s.statusDisplay === 'Accepted');
      if (!lastAC) {
        downloadSpinner.fail('No accepted submission found to download.');
        return;
      }

      // Fetch code
      const details = await leetcodeClient.getSubmissionDetails(parseInt(lastAC.id, 10));
      
      // Determine File Path
      const workDir = config.getWorkDir();
      const difficulty = problem.difficulty;
      const category = problem.topicTags.length > 0 
        ? problem.topicTags[0].name.replace(/[^\w\s-]/g, '').trim() 
        : 'Uncategorized';
      
      const targetDir = join(workDir, difficulty, category);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      // Map language to extension
      // details.lang.name is internal slug like 'cpp'
      const langSlug = details.lang.name;
      const supportedLang = LANG_SLUG_MAP[langSlug] ?? 'txt';
      const ext = LANGUAGE_EXTENSIONS[supportedLang as SupportedLanguage] ?? langSlug;
      
      const fileName = `${problem.questionFrontendId}.${problem.titleSlug}.submission-${lastAC.id}.${ext}`;
      const filePath = join(targetDir, fileName);

      // Verify if file exists?
      // Since specific submission ID is in name, overwriting is unlikely unless re-downloading same one.
      // Overwrite is fine.

      await writeFile(filePath, details.code, 'utf-8');
      
      downloadSpinner.succeed(`Downloaded to ${chalk.green(fileName)}`);
      console.log(chalk.gray(`Path: ${filePath}`));
    }

  } catch (error) {
    spinner.fail('Failed to fetch submissions');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
