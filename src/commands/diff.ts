// Diff command - compare current solution with past submissions or files
import ora from 'ora';
import chalk from 'chalk';
import { leetcodeClient } from '../api/client.js';
import { config } from '../storage/config.js';
import { findSolutionFile } from '../utils/fileUtils.js';
import { requireAuth } from '../utils/auth.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { diffLines } from 'diff';

interface DiffOptions {
  submission?: string;
  file?: string;
  unified?: boolean;
}

function showCodeBlock(code: string, label: string): void {
  const lines = code.split('\n');
  const lineCount = lines.length;
  
  console.log();
  console.log(chalk.bold.cyan(`=== ${label} (${lineCount} lines) ===`));
  console.log(chalk.gray('─'.repeat(60)));
  
  lines.forEach((line, i) => {
    const lineNum = (i + 1).toString().padStart(3);
    console.log(chalk.gray(lineNum + ' │ ') + line);
  });
}

function showUnifiedDiff(sourceCode: string, targetCode: string, sourceLabel: string, targetLabel: string): void {
  const sourceLines = sourceCode.split('\n').length;
  const targetLines = targetCode.split('\n').length;

  console.log();
  console.log(chalk.bold(`📊 Unified Diff: ${sourceLabel} → ${targetLabel}`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log();

  const diff = diffLines(sourceCode, targetCode);

  let added = 0;
  let removed = 0;

  for (const part of diff) {
    const lines = part.value.split('\n').filter(l => l !== '');

    if (part.added) {
      added += lines.length;
      for (const line of lines) {
        console.log(chalk.green('+ ' + line));
      }
    } else if (part.removed) {
      removed += lines.length;
      for (const line of lines) {
        console.log(chalk.red('- ' + line));
      }
    } else {
      if (lines.length <= 6) {
        for (const line of lines) {
          console.log(chalk.gray('  ' + line));
        }
      } else {
        console.log(chalk.gray('  ' + lines[0]));
        console.log(chalk.gray('  ' + lines[1]));
        console.log(chalk.dim(`  ... (${lines.length - 4} unchanged lines)`));
        console.log(chalk.gray('  ' + lines[lines.length - 2]));
        console.log(chalk.gray('  ' + lines[lines.length - 1]));
      }
    }
  }

  console.log();
  console.log(chalk.gray('─'.repeat(60)));
  console.log(
    `${chalk.green('+' + added + ' added')} ${chalk.gray('·')} ` +
    `${chalk.red('-' + removed + ' removed')} ${chalk.gray('·')} ` +
    `${chalk.gray(sourceLines + ' → ' + targetLines + ' lines')}`
  );
}

function showComparison(sourceCode: string, targetCode: string, sourceLabel: string, targetLabel: string, unified: boolean): void {
  if (unified) {
    showUnifiedDiff(sourceCode, targetCode, sourceLabel, targetLabel);
  } else {
    showCodeBlock(sourceCode, sourceLabel);
    showCodeBlock(targetCode, targetLabel);
    
    const diff = diffLines(sourceCode, targetCode);
    let added = 0;
    let removed = 0;
    for (const part of diff) {
      const lines = part.value.split('\n').filter(l => l !== '');
      if (part.added) added += lines.length;
      else if (part.removed) removed += lines.length;
    }
    
    console.log();
    console.log(chalk.gray('─'.repeat(60)));
    console.log(
      `${chalk.bold('Summary:')} ` +
      `${chalk.green('+' + added + ' added')} ${chalk.gray('·')} ` +
      `${chalk.red('-' + removed + ' removed')}`
    );
    console.log(chalk.gray('Tip: Use --unified for line-by-line diff'));
  }
}

export async function diffCommand(problemId: string, options: DiffOptions): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  const workDir = config.getWorkDir();
  const spinner = ora('Finding solution file...').start();

  try {
    // Find current solution file
    const filePath = await findSolutionFile(workDir, problemId);

    if (!filePath) {
      spinner.fail(`No solution file found for problem ${problemId}`);
      console.log(chalk.gray('Run `leetcode pick ' + problemId + '` first to create a solution file.'));
      return;
    }

    const currentCode = await readFile(filePath, 'utf-8');
    spinner.text = 'Fetching comparison target...';

    // Case 1: Compare with specific file
    if (options.file) {
      spinner.stop();
      
      if (!existsSync(options.file)) {
        console.log(chalk.red(`File not found: ${options.file}`));
        return;
      }

      const otherCode = await readFile(options.file, 'utf-8');
      showComparison(currentCode, otherCode, 'Your Solution', options.file, options.unified ?? false);
      return;
    }

    // Need to fetch problem to get slug
    const problem = await leetcodeClient.getProblemById(problemId);
    if (!problem) {
      spinner.fail(`Problem ${problemId} not found`);
      return;
    }

    // Case 2: Compare with specific submission
    if (options.submission) {
      const submissionId = parseInt(options.submission, 10);
      const submission = await leetcodeClient.getSubmissionDetails(submissionId);
      spinner.stop();

      showComparison(currentCode, submission.code, 'Your Solution', `Submission #${submissionId}`, options.unified ?? false);
      return;
    }

    // Case 3: Compare with last accepted submission (default)
    const submissions = await leetcodeClient.getSubmissionList(problem.titleSlug, 50);
    const accepted = submissions.find(s => s.statusDisplay === 'Accepted');

    if (!accepted) {
      spinner.fail('No accepted submissions found for this problem');
      console.log(chalk.gray('Tip: Use --file to compare with a local file instead'));
      return;
    }

    const acceptedDetails = await leetcodeClient.getSubmissionDetails(parseInt(accepted.id, 10));
    spinner.stop();

    showComparison(currentCode, acceptedDetails.code, 'Your Solution', 'Last Accepted', options.unified ?? false);

  } catch (error) {
    spinner.fail('Failed to diff');
    if (error instanceof Error) {
      console.log(chalk.red(error.message));
    }
  }
}
