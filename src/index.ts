import { Command } from 'commander';
import chalk from 'chalk';


import { loginCommand, logoutCommand, whoamiCommand } from './commands/login.js';
import { listCommand } from './commands/list.js';
import { showCommand } from './commands/show.js';
import { pickCommand, batchPickCommand } from './commands/pick.js';
import { testCommand } from './commands/test.js';
import { submitCommand } from './commands/submit.js';
import { statCommand } from './commands/stat.js';
import { dailyCommand } from './commands/daily.js';
import { randomCommand } from './commands/random.js';
import { submissionsCommand } from './commands/submissions.js';
import { configCommand, configInteractiveCommand } from './commands/config.js';
import { bookmarkCommand } from './commands/bookmark.js';
import { notesCommand } from './commands/notes.js';
import { todayCommand } from './commands/today.js';

const program = new Command();


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
  .version('1.3.1', '-v, --version', 'Output the version number')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode login')}             Login to LeetCode
  ${chalk.cyan('$ leetcode list -d easy')}      List easy problems
  ${chalk.cyan('$ leetcode random -d medium')}   Get random medium problem
  ${chalk.cyan('$ leetcode pick 1')}            Start solving "Two Sum"
  ${chalk.cyan('$ leetcode test 1')}            Test your solution
  ${chalk.cyan('$ leetcode submit 1')}          Submit your solution
`);


program
  .command('login')
  .description('Login to LeetCode with browser cookies')
  .addHelpText('after', `
${chalk.yellow('How to login:')}
  1. Open ${chalk.cyan('https://leetcode.com')} in your browser
  2. Login to your account
  3. Open Developer Tools (F12) → Application → Cookies
  4. Copy values of ${chalk.green('LEETCODE_SESSION')} and ${chalk.green('csrftoken')}
  5. Paste when prompted by this command
`)
  .action(loginCommand);

program
  .command('logout')
  .description('Clear stored credentials')
  .action(logoutCommand);

program
  .command('whoami')
  .description('Check current login status')
  .action(whoamiCommand);


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
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode list')}                    List first 20 problems
  ${chalk.cyan('$ leetcode list -d easy')}            List easy problems only
  ${chalk.cyan('$ leetcode list -s solved')}          List your solved problems
  ${chalk.cyan('$ leetcode list -t array -t string')} Filter by multiple tags
  ${chalk.cyan('$ leetcode list -q "two sum"')}       Search by keywords
  ${chalk.cyan('$ leetcode list -n 50 -p 2')}         Show 50 problems, page 2
`)
  .action(listCommand);

program
  .command('show <id>')
  .alias('s')
  .description('Show problem description')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode show 1')}                  Show by problem ID
  ${chalk.cyan('$ leetcode show two-sum')}            Show by problem slug
  ${chalk.cyan('$ leetcode s 412')}                   Short alias
`)
  .action(showCommand);

program
  .command('daily')
  .alias('d')
  .description('Show today\'s daily challenge')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode daily')}                   Show today's challenge
  ${chalk.cyan('$ leetcode d')}                       Short alias
`)
  .action(dailyCommand);

program
  .command('random')
  .alias('r')
  .description('Get a random problem')
  .option('-d, --difficulty <level>', 'Filter by difficulty (easy/medium/hard)')
  .option('-t, --tag <tag>', 'Filter by topic tag')
  .option('--pick', 'Auto-generate solution file')
  .option('--no-open', 'Do not open file in editor')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode random')}                  Get any random problem
  ${chalk.cyan('$ leetcode random -d medium')}        Random medium problem
  ${chalk.cyan('$ leetcode random -t array')}         Random array problem
  ${chalk.cyan('$ leetcode random --pick')}           Random + create file
  ${chalk.cyan('$ leetcode r -d easy --pick')}        Random easy + file
`)
  .action(randomCommand);


program
  .command('pick <id>')
  .alias('p')
  .description('Generate solution file for a problem')
  .option('-l, --lang <language>', 'Programming language for the solution')
  .option('--no-open', 'Do not open file in editor')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode pick 1')}                  Pick by problem ID
  ${chalk.cyan('$ leetcode pick two-sum')}            Pick by problem slug
  ${chalk.cyan('$ leetcode pick 1 -l python3')}       Pick with specific language
  ${chalk.cyan('$ leetcode pick 1 --no-open')}        Create file without opening
  ${chalk.cyan('$ leetcode p 412')}                   Short alias

${chalk.gray('Files are organized by: workDir/Difficulty/Category/')}
`)
  .action(async (id, options) => {
    await pickCommand(id, options);
  });

program
  .command('pick-batch <ids...>')
  .description('Generate solution files for multiple problems')
  .option('-l, --lang <language>', 'Programming language for the solutions')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode pick-batch 1 2 3')}        Pick problems 1, 2, and 3
  ${chalk.cyan('$ leetcode pick-batch 1 2 3 -l py')}  Pick with Python
`)
  .action(batchPickCommand);

program
  .command('test <file>')
  .alias('t')
  .description('Test solution against sample test cases')
  .option('-c, --testcase <testcase>', 'Custom test case')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode test 1')}                  Test by problem ID
  ${chalk.cyan('$ leetcode test two-sum')}            Test by problem slug
  ${chalk.cyan('$ leetcode test ./path/to/file.py')} Test by file path
  ${chalk.cyan('$ leetcode test 1 -c "[1,2]\\n3"')}   Test with custom case
  ${chalk.cyan('$ leetcode t 412')}                   Short alias

${chalk.gray('Testcases use \\n to separate multiple inputs.')}
`)
  .action(testCommand);

program
  .command('submit <file>')
  .alias('x')
  .description('Submit solution to LeetCode')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode submit 1')}                Submit by problem ID
  ${chalk.cyan('$ leetcode submit two-sum')}          Submit by problem slug
  ${chalk.cyan('$ leetcode submit ./path/to/file.py')} Submit by file path
  ${chalk.cyan('$ leetcode x 412')}                   Short alias
`)
  .action(submitCommand);

program
  .command('submissions <id>')
  .description('View past submissions')
  .option('-n, --limit <number>', 'Number of submissions to show', '20')
  .option('--last', 'Show details of the last accepted submission')
  .option('--download', 'Download the last accepted submission code')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode submissions 1')}           View submissions for problem
  ${chalk.cyan('$ leetcode submissions 1 -n 5')}      Show last 5 submissions
  ${chalk.cyan('$ leetcode submissions 1 --last')}    Show last accepted submission
  ${chalk.cyan('$ leetcode submissions 1 --download')} Download last accepted code
`)
  .action(submissionsCommand);


program
  .command('stat [username]')
  .description('Show user statistics')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode stat')}                    Show your statistics
  ${chalk.cyan('$ leetcode stat lee215')}             Show another user's stats
`)
  .action(statCommand);

program
  .command('today')
  .description('Show today\'s progress summary')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode today')}                   Show streak, solved, and daily challenge
`)
  .action(todayCommand);

program
  .command('bookmark <action> [id]')
  .description('Manage problem bookmarks')
  .addHelpText('after', `
${chalk.yellow('Actions:')}
  ${chalk.cyan('add <id>')}      Bookmark a problem
  ${chalk.cyan('remove <id>')}   Remove a bookmark
  ${chalk.cyan('list')}          List all bookmarks
  ${chalk.cyan('clear')}         Clear all bookmarks

${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode bookmark add 1')}          Bookmark problem 1
  ${chalk.cyan('$ leetcode bookmark remove 1')}       Remove bookmark
  ${chalk.cyan('$ leetcode bookmark list')}           List all bookmarks
`)
  .action(bookmarkCommand);

program
  .command('note <id> [action]')
  .description('View or edit notes for a problem')
  .addHelpText('after', `
${chalk.yellow('Actions:')}
  ${chalk.cyan('edit')}   Open notes in editor (default)
  ${chalk.cyan('view')}   Display notes in terminal

${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode note 1')}                  Edit notes for problem 1
  ${chalk.cyan('$ leetcode note 1 edit')}             Edit notes (explicit)
  ${chalk.cyan('$ leetcode note 1 view')}             View notes in terminal
`)
  .action(notesCommand);


program
  .command('config')
  .description('View or set configuration')
  .option('-l, --lang <language>', 'Set default programming language')
  .option('-e, --editor <editor>', 'Set editor command')
  .option('-w, --workdir <path>', 'Set working directory for solutions')
  .option('-i, --interactive', 'Interactive configuration')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode config')}                  View current config
  ${chalk.cyan('$ leetcode config -l python3')}       Set language to Python
  ${chalk.cyan('$ leetcode config -e "code"')}        Set editor to VS Code
  ${chalk.cyan('$ leetcode config -w ~/leetcode')}    Set solutions folder
  ${chalk.cyan('$ leetcode config -i')}               Interactive setup

${chalk.gray('Supported languages: typescript, javascript, python3, java, cpp, c, csharp, go, rust, kotlin, swift')}
`)
  .action(async (options) => {
    if (options.interactive) {
      await configInteractiveCommand();
    } else {
      await configCommand(options);
    }
  });


program.showHelpAfterError('(add --help for additional information)');


program.parse();


if (!process.argv.slice(2).length) {
  console.log();
  console.log(chalk.bold.cyan('  🔥 LeetCode CLI'));
  console.log(chalk.gray('  A modern command-line interface for LeetCode'));
  console.log();
  program.outputHelp();
}
