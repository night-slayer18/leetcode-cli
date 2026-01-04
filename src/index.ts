#!/usr/bin/env node
// LeetCode CLI - Main Entry Point
import { Command } from 'commander';
import chalk from 'chalk';

// Commands
import { loginCommand, logoutCommand, whoamiCommand } from './commands/login.js';
import { listCommand } from './commands/list.js';
import { showCommand } from './commands/show.js';
import { pickCommand } from './commands/pick.js';
import { testCommand } from './commands/test.js';
import { submitCommand } from './commands/submit.js';
import { statCommand } from './commands/stat.js';
import { dailyCommand } from './commands/daily.js';
import { configCommand, configInteractiveCommand } from './commands/config.js';

const program = new Command();

// Customize help output
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()) + (cmd.alias() ? chalk.gray(`|${cmd.alias()}`) : ''),
  subcommandDescription: (cmd) => chalk.white(cmd.description()),
  optionTerm: (option) => chalk.yellow(option.flags),
  optionDescription: (option) => chalk.white(option.description),
});

program
  .name('leetcode')
  .usage('[command] [options]')
  .description(chalk.bold.cyan('🔥 A modern LeetCode CLI built with TypeScript'))
  .version('1.0.0', '-v, --version', 'Output the version number')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode login')}             Login to LeetCode
  ${chalk.cyan('$ leetcode list -d easy')}      List easy problems
  ${chalk.cyan('$ leetcode pick 1')}            Start solving "Two Sum"
  ${chalk.cyan('$ leetcode test 1')}            Test your solution
  ${chalk.cyan('$ leetcode submit 1')}          Submit your solution
`);

// === Authentication ===
program
  .command('login')
  .description('Login to LeetCode with browser cookies')
  .action(loginCommand);

program
  .command('logout')
  .description('Clear stored credentials')
  .action(logoutCommand);

program
  .command('whoami')
  .description('Check current login status')
  .action(whoamiCommand);

// === Problem Discovery ===
program
  .command('list')
  .alias('l')
  .description('List LeetCode problems')
  .option('-d, --difficulty <level>', 'Filter by difficulty (easy/medium/hard)')
  .option('-s, --status <status>', 'Filter by status (todo/solved/attempted)')
  .option('-t, --tag <tags...>', 'Filter by topic tags')
  .option('-q, --search <keywords>', 'Search by keywords')
  .option('-n, --limit <number>', 'Number of problems to show', '20')
  .option('-p, --page <number>', 'Page number', '1')
  .action(listCommand);

program
  .command('show <id>')
  .alias('s')
  .description('Show problem description')
  .action(showCommand);

program
  .command('daily')
  .alias('d')
  .description('Show today\'s daily challenge')
  .action(dailyCommand);

// === Solution Workflow ===
program
  .command('pick <id>')
  .alias('p')
  .description('Generate solution file for a problem')
  .option('-l, --lang <language>', 'Programming language for the solution')
  .option('--no-open', 'Do not open file in editor')
  .action(pickCommand);

program
  .command('test <file>')
  .alias('t')
  .description('Test solution against sample test cases')
  .option('-c, --testcase <testcase>', 'Custom test case')
  .action(testCommand);

program
  .command('submit <file>')
  .alias('x')
  .description('Submit solution to LeetCode')
  .action(submitCommand);

// === Statistics ===
program
  .command('stat [username]')
  .description('Show user statistics')
  .action(statCommand);

// === Configuration ===
program
  .command('config')
  .description('View or set configuration')
  .option('-l, --lang <language>', 'Set default programming language')
  .option('-e, --editor <editor>', 'Set editor command')
  .option('-w, --workdir <path>', 'Set working directory for solutions')
  .option('-i, --interactive', 'Interactive configuration')
  .action(async (options) => {
    if (options.interactive) {
      await configInteractiveCommand();
    } else {
      await configCommand(options);
    }
  });

// Error handling
program.showHelpAfterError('(add --help for additional information)');

// Parse arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  console.log();
  console.log(chalk.bold.cyan('  🔥 LeetCode CLI'));
  console.log(chalk.gray('  A modern command-line interface for LeetCode'));
  console.log();
  program.outputHelp();
}
