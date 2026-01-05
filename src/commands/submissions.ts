
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from '../utils/auth.js';
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
  const { authorized } = await requireAuth();
  if (!authorized) return;

  const spinner = ora('Fetching problem info...').start();

  try {
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


    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const submissions = await leetcodeClient.getSubmissionList(slug, limit);
    
    spinner.stop();

    if (submissions.length === 0) {
      console.log(chalk.yellow('No submissions found.'));
      return;
    }


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


    if (options.download) {
      const downloadSpinner = ora('Downloading submission...').start();
      
      const lastAC = submissions.find(s => s.statusDisplay === 'Accepted');
      if (!lastAC) {
        downloadSpinner.fail('No accepted submission found to download.');
        return;
      }


      const details = await leetcodeClient.getSubmissionDetails(parseInt(lastAC.id, 10));
      

      const workDir = config.getWorkDir();
      const difficulty = problem.difficulty;
      const category = problem.topicTags.length > 0 
        ? problem.topicTags[0].name.replace(/[^\w\s-]/g, '').trim() 
        : 'Uncategorized';
      
      const targetDir = join(workDir, difficulty, category);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      const langSlug = details.lang.name;
      const supportedLang = LANG_SLUG_MAP[langSlug] ?? 'txt';
      const ext = LANGUAGE_EXTENSIONS[supportedLang as SupportedLanguage] ?? langSlug;
      
      const fileName = `${problem.questionFrontendId}.${problem.titleSlug}.submission-${lastAC.id}.${ext}`;
      const filePath = join(targetDir, fileName);

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
