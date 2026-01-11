
import chalk from 'chalk';
import Table from 'cli-table3';
import type { Problem, ProblemDetail, SubmissionResult, TestResult, Submission, TopicTag } from '../types.js';
import { visualizeTestOutput } from './visualize.js';


export function displayProblemList(problems: Problem[], total: number): void {
  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Title'),
      chalk.cyan('Difficulty'),
      chalk.cyan('Rate'),
      chalk.cyan('Status'),
    ],
    colWidths: [8, 45, 12, 10, 10],
    style: { head: [], border: [] },
  });

  for (const problem of problems) {
    let title = problem.title;
    if (problem.isPaidOnly) {
      title = `🔒 ${title}`;
    }

    table.push([
      problem.questionFrontendId,
      title.length > 42 ? title.slice(0, 39) + '...' : title,
      colorDifficulty(problem.difficulty),
      `${problem.acRate.toFixed(1)}%`,
      formatStatus(problem.status),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.gray(`\nShowing ${problems.length} of ${total} problems`));
}

export function displayProblemDetail(problem: ProblemDetail): void {
  console.log();
  const titlePrefix = problem.isPaidOnly ? '🔒 ' : '';
  console.log(chalk.bold.cyan(`  ${problem.questionFrontendId}. ${titlePrefix}${problem.title}`));
  console.log(`  ${colorDifficulty(problem.difficulty)}`);
  console.log(chalk.gray(`  https://leetcode.com/problems/${problem.titleSlug}/`));
  console.log();

  // Show premium notice prominently if applicable
  if (problem.isPaidOnly) {
    console.log(chalk.yellow('  ⚠️  Premium Problem'));
    console.log(chalk.gray('     This problem requires a LeetCode Premium subscription.'));
    console.log(chalk.gray(`     Visit the URL above to view on LeetCode.`));
    console.log();
  }

  if (problem.topicTags.length) {
    const tags = problem.topicTags.map(t => chalk.bgBlue.white(` ${t.name} `)).join(' ');
    console.log(`  ${tags}`);
    console.log();
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log();


  let content = problem.content;

  if (!content) {
    console.log(chalk.yellow('  🔒 Premium Content'));
    console.log(chalk.gray('  Problem description is not available directly.'));
    console.log(chalk.gray('  Please visit the URL above to view on LeetCode.'));
    console.log();
    return;
  }
  

  content = content.replace(/<sup>(.*?)<\/sup>/gi, '^$1');
  
  content = content.replace(/<strong class="example">Example (\d+):<\/strong>/gi, '§EXAMPLE§$1§');
  

  content = content.replace(/Input:/gi, '§INPUT§');
  content = content.replace(/Output:/gi, '§OUTPUT§');
  content = content.replace(/Explanation:/gi, '§EXPLAIN§');
  

  content = content.replace(/<strong>Constraints:<\/strong>/gi, '§CONSTRAINTS§');
  content = content.replace(/Constraints:/gi, '§CONSTRAINTS§');
  

  content = content.replace(/<strong>Follow-up:/gi, '§FOLLOWUP§');
  content = content.replace(/Follow-up:/gi, '§FOLLOWUP§');
  

  content = content.replace(/<li>/gi, '  • ');
  content = content.replace(/<\/li>/gi, '\n');
  

  content = content.replace(/<\/p>/gi, '\n\n');
  content = content.replace(/<br\s*\/?>/gi, '\n');
  

  content = content.replace(/<[^>]+>/g, '');
  

  content = content
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  

  content = content.replace(/\n{3,}/g, '\n\n').trim();
  

  content = content.replace(/§EXAMPLE§(\d+)§/g, (_, num) => chalk.green.bold(`📌 Example ${num}:`));
  content = content.replace(/§INPUT§/g, chalk.yellow('Input:'));
  content = content.replace(/§OUTPUT§/g, chalk.yellow('Output:'));
  content = content.replace(/§EXPLAIN§/g, chalk.gray('Explanation:'));
  content = content.replace(/§CONSTRAINTS§/g, chalk.cyan.bold('\n📋 Constraints:'));
  content = content.replace(/§FOLLOWUP§/g, chalk.magenta.bold('\n💡 Follow-up:'));
  
  console.log(content);
  console.log();
}

export function displayTestResult(result: TestResult, topicTags?: TopicTag[]): void {
  console.log();
  
  if (result.compile_error) {
    console.log(chalk.red.bold('❌ Compile Error'));
    console.log(chalk.red(result.compile_error));
    return;
  }

  if (result.runtime_error) {
    console.log(chalk.red.bold('❌ Runtime Error'));
    console.log(chalk.red(result.runtime_error));
    return;
  }

  if (result.correct_answer) {
    console.log(chalk.green.bold('✓ All test cases passed!'));
  } else {
    console.log(chalk.yellow.bold('✗ Some test cases failed'));
  }

  const outputs = result.code_answer ?? [];
  const expected = result.expected_code_answer ?? [];

  // Visual mode with topic tags
  if (topicTags && outputs.length > 0) {
    console.log();
    console.log(chalk.gray.bold('─'.repeat(50)));
    
    // Filter out empty entries
    const validCases = outputs
      .map((out, i) => ({ out, exp: expected[i] ?? '' }))
      .filter(({ out, exp }) => out !== '' || exp !== '');
    
    for (let i = 0; i < validCases.length; i++) {
      const { out, exp } = validCases[i];
      const { outputVis, expectedVis, matches, unsupported } = visualizeTestOutput(out, exp, topicTags);

      console.log();
      console.log(chalk.gray(`Test Case ${i + 1}:`));
      
      if (unsupported) {
        console.log(chalk.yellow('  ⚠ No visualization available for this problem type'));
        console.log(chalk.gray(`  Tags: ${topicTags.map(t => t.name).join(', ')}`));
      }
      
      console.log();
      console.log(chalk.cyan('  Your Output:'));
      outputVis.split('\n').forEach(line => console.log(`    ${line}`));
      console.log();
      console.log(chalk.cyan('  Expected:'));
      expectedVis.split('\n').forEach(line => console.log(`    ${line}`));
      console.log();
      console.log(matches ? chalk.green('  ✓ Match') : chalk.red('  ✗ Mismatch'));
    }
    
    console.log(chalk.gray.bold('─'.repeat(50)));
  } else {
    // Standard mode
    console.log();
    console.log(chalk.gray('Your Output:'));
    for (const output of outputs) {
      console.log(chalk.white(`  ${output}`));
    }

    console.log();
    console.log(chalk.gray('Expected Output:'));
    for (const output of expected) {
      console.log(chalk.white(`  ${output}`));
    }
  }

  const stdoutEntries = (result.std_output_list ?? []).filter(s => s);
  if (stdoutEntries.length > 0) {
    console.log();
    console.log(chalk.gray('Stdout:'));
    for (const output of stdoutEntries) {
      console.log(chalk.gray(`  ${output}`));
    }
  }
}

export function displaySubmissionResult(result: SubmissionResult): void {
  console.log();

  if (result.compile_error) {
    console.log(chalk.red.bold('❌ Compile Error'));
    console.log(chalk.red(result.compile_error));
    return;
  }

  if (result.runtime_error) {
    console.log(chalk.red.bold('❌ Runtime Error'));
    console.log(chalk.red(result.runtime_error));
    if (result.last_testcase) {
      console.log(chalk.gray('Last testcase:'), result.last_testcase);
    }
    return;
  }

  if (result.status_msg === 'Accepted') {
    console.log(chalk.green.bold('✓ Accepted!'));
    console.log();
    console.log(chalk.gray('Runtime:'), chalk.white(result.status_runtime), 
      chalk.gray(`(beats ${result.runtime_percentile?.toFixed(1) ?? 'N/A'}%)`));
    console.log(chalk.gray('Memory:'), chalk.white(result.status_memory),
      chalk.gray(`(beats ${result.memory_percentile?.toFixed(1) ?? 'N/A'}%)`));
  } else {
    console.log(chalk.red.bold(`❌ ${result.status_msg}`));
    console.log();
    console.log(chalk.gray(`Passed ${result.total_correct}/${result.total_testcases} testcases`));
    
    if (result.code_output) {
      console.log(chalk.gray('Your Output:'), result.code_output);
    }
    if (result.expected_output) {
      console.log(chalk.gray('Expected:'), result.expected_output);
    }
    if (result.last_testcase) {
      console.log(chalk.gray('Failed testcase:'), result.last_testcase);
    }
  }
}

export function displayUserStats(
  username: string,
  realName: string,
  ranking: number,
  acStats: Array<{ difficulty: string; count: number }>,
  streak: number,
  totalActiveDays: number
): void {
  console.log();
  console.log(chalk.bold.white(`👤 ${username}`) + (realName ? chalk.gray(` (${realName})`) : ''));
  console.log(chalk.gray(`Ranking: #${ranking.toLocaleString()}`));
  console.log();

  const table = new Table({
    head: [chalk.cyan('Difficulty'), chalk.cyan('Solved')],
    style: { head: [], border: [] },
  });

  for (const stat of acStats) {
    if (stat.difficulty !== 'All') {
      table.push([
        colorDifficulty(stat.difficulty as 'Easy' | 'Medium' | 'Hard'),
        stat.count.toString(),
      ]);
    }
  }

  const total = acStats.find(s => s.difficulty === 'All')?.count ?? 0;
  table.push([chalk.white.bold('Total'), chalk.white.bold(total.toString())]);

  console.log(table.toString());
  console.log();
  console.log(chalk.gray('🔥 Current streak:'), chalk.hex('#FFA500')(streak.toString()), chalk.gray('days'));
  console.log(chalk.gray('📅 Total active days:'), chalk.white(totalActiveDays.toString()));
}

export function displayDailyChallenge(
  date: string,
  problem: Problem
): void {
  console.log();
  console.log(chalk.bold.yellow('🎯 Daily Challenge'), chalk.gray(`(${date})`));
  console.log();
  console.log(chalk.white(`${problem.questionFrontendId}. ${problem.title}`));
  console.log(colorDifficulty(problem.difficulty));
  console.log(chalk.gray(`https://leetcode.com/problems/${problem.titleSlug}/`));
  
  if (problem.topicTags.length) {
    console.log();
    const tags = problem.topicTags.map(t => chalk.blue(t.name)).join(' ');
    console.log(chalk.gray('Tags:'), tags);
  }
}

function colorDifficulty(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return chalk.green(difficulty);
    case 'medium':
      return chalk.yellow(difficulty);
    case 'hard':
      return chalk.red(difficulty);
    default:
      return difficulty;
  }
}

function formatStatus(status: string | null): string {
  switch (status) {
    case 'ac':
      return chalk.green('✓');
    case 'notac':
      return chalk.yellow('○');
    default:
      return chalk.gray('-');
  }
}

export function displaySubmissionsList(submissions: Submission[]): void {
  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('Status'),
      chalk.cyan('Lang'),
      chalk.cyan('Runtime'),
      chalk.cyan('Memory'),
      chalk.cyan('Date'),
    ],
    colWidths: [12, 18, 15, 12, 12, 25],
    style: { head: [], border: [] },
  });

  for (const s of submissions) {
    const isAC = s.statusDisplay === 'Accepted';

    const cleanTime = new Date(parseInt(s.timestamp) * 1000).toLocaleString();
    
    table.push([
      s.id,
      isAC ? chalk.green(s.statusDisplay) : chalk.red(s.statusDisplay),
      s.lang,
      s.runtime,
      s.memory,
      cleanTime,
    ]);
  }
  console.log(table.toString());
}
