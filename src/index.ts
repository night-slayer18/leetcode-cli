#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';


import { loginCommand, logoutCommand, whoamiCommand } from './commands/login.js';
import { listCommand } from './commands/list.js';
import { showCommand } from './commands/show.js';
import { hintCommand } from './commands/hint.js';
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
import { syncCommand } from './commands/sync.js';
import { timerCommand } from './commands/timer.js';
import {
  collabHostCommand,
  collabJoinCommand,
  collabSyncCommand,
  collabCompareCommand,
  collabLeaveCommand,
  collabStatusCommand,
} from './commands/collab.js';
import {
  snapshotSaveCommand,
  snapshotListCommand,
  snapshotRestoreCommand,
  snapshotDiffCommand,
  snapshotDeleteCommand,
} from './commands/snapshot.js';
import { diffCommand } from './commands/diff.js';
import {
  workspaceCurrentCommand,
  workspaceListCommand,
  workspaceCreateCommand,
  workspaceUseCommand,
  workspaceDeleteCommand,
} from './commands/workspace.js';
import { updateCommand, checkForUpdatesOnStartup } from './commands/update.js';
import { changelogCommand } from './commands/changelog.js';

const program = new Command();


program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => {
    const name = cmd.name();
    const alias = cmd.alias();
    const term = alias ? `${name}|${alias}` : name;
    return chalk.cyan(term.padEnd(16));
  },
  subcommandDescription: (cmd) => chalk.white(cmd.description()),
  optionTerm: (option) => chalk.yellow(option.flags),
  optionDescription: (option) => chalk.white(option.description),
});

program
  .name('leetcode')
  .usage('[command] [options]')
  .description(chalk.bold.cyan('🔥 A modern LeetCode CLI built with TypeScript'))
  .version('2.2.2', '-v, --version', 'Output the version number')
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
  .command('hint <id>')
  .alias('h')
  .description('Show hints for a problem')
  .option('-a, --all', 'Show all hints at once')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode hint 1')}                  Show hints for problem 1
  ${chalk.cyan('$ leetcode hint two-sum')}            Show hints by slug
  ${chalk.cyan('$ leetcode hint 1 --all')}            Show all hints at once
  ${chalk.cyan('$ leetcode h 412')}                   Short alias

${chalk.gray('Hints are revealed one at a time. Press Enter to see more.')}
`)
  .action(hintCommand);

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
  .option('-V, --visualize', 'Visual output for data structures (arrays, trees, etc.)')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode test 1')}                  Test by problem ID
  ${chalk.cyan('$ leetcode test two-sum')}            Test by problem slug
  ${chalk.cyan('$ leetcode test ./path/to/file.py')} Test by file path
  ${chalk.cyan('$ leetcode test 1 -c "[1,2]\\n3"')}   Test with custom case
  ${chalk.cyan('$ leetcode test 1 --visualize')}     Visual mode for debugging
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
  .command('diff <id>')
  .description('Compare solution with past submissions')
  .option('-s, --submission <id>', 'Compare with specific submission ID')
  .option('-f, --file <path>', 'Compare with a local file')
  .option('-u, --unified', 'Show unified diff (line-by-line changes)')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode diff 1')}                  Compare with last accepted
  ${chalk.cyan('$ leetcode diff 1 -u')}               Show unified diff
  ${chalk.cyan('$ leetcode diff 1 -s 12345')}         Compare with specific submission
  ${chalk.cyan('$ leetcode diff 1 -f other.py')}      Compare with local file
`)
  .action(diffCommand);

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
  .description('Show user statistics and analytics')
  .option('-c, --calendar', 'Weekly activity summary (submissions & active days for last 12 weeks)')
  .option('-s, --skills', 'Skill breakdown (problems solved grouped by topic tags)')
  .option('-t, --trend', 'Daily trend chart (bar graph of submissions for last 7 days)')
  .addHelpText('after', `
${chalk.yellow('Options Explained:')}
  ${chalk.cyan('-c, --calendar')}  Shows a table of your weekly submissions and active days
                    for the past 12 weeks. Useful for tracking consistency.
  
  ${chalk.cyan('-s, --skills')}    Shows how many problems you solved per topic tag,
                    grouped by difficulty (Fundamental/Intermediate/Advanced).
                    Helps identify your strong and weak areas.
  
  ${chalk.cyan('-t, --trend')}     Shows a bar chart of daily submissions for the past week.
                    Visualizes your recent coding activity day by day.

${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode stat')}                    Show basic stats (solved count, rank)
  ${chalk.cyan('$ leetcode stat lee215')}             Show another user's stats
  ${chalk.cyan('$ leetcode stat -c')}                 Weekly activity table
  ${chalk.cyan('$ leetcode stat -s')}                 Topic-wise breakdown
  ${chalk.cyan('$ leetcode stat -t')}                 7-day trend chart
`)
  .action((username, options) => statCommand(username, options));

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
  .command('sync')
  .description('Sync solutions to Git repository')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode sync')}                    Sync all solutions to remote
`)
  .action(syncCommand);


program
  .command('config')
  .description('View or set configuration')
  .option('-l, --lang <language>', 'Set default programming language')
  .option('-e, --editor <editor>', 'Set editor command')
  .option('-w, --workdir <path>', 'Set working directory for solutions')
  .option('-r, --repo <url>', 'Set Git repository URL')
  .option('-i, --interactive', 'Interactive configuration')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode config')}                  View current config
  ${chalk.cyan('$ leetcode config -l python3')}       Set language to Python
  ${chalk.cyan('$ leetcode config -e "code"')}        Set editor to VS Code
  ${chalk.cyan('$ leetcode config -w ~/leetcode')}    Set solutions folder
  ${chalk.cyan('$ leetcode config -r https://...')}   Set git repository
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


program
  .command('timer [id]')
  .description('Start interview mode with timer')
  .option('-m, --minutes <minutes>', 'Custom time limit in minutes')
  .option('--stats', 'Show solve time statistics')
  .option('--stop', 'Stop active timer')
  .addHelpText('after', `
${chalk.yellow('How it works:')}
  Start a problem with a countdown timer to simulate interview conditions.
  Default time limits: Easy (20 min), Medium (40 min), Hard (60 min).
  Your solve times are recorded when you submit successfully.

${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode timer 1')}                  Start problem 1 with default time
  ${chalk.cyan('$ leetcode timer 1 -m 30')}            Start with 30 minute limit
  ${chalk.cyan('$ leetcode timer --stats')}            Show your solve time statistics
  ${chalk.cyan('$ leetcode timer --stop')}             Stop active timer
`)
  .action((id, options) => timerCommand(id, options));

// Workspace Management
const workspaceCmd = program
  .command('workspace')
  .description('Manage workspaces for different contexts');

workspaceCmd
  .command('current')
  .description('Show current workspace')
  .action(workspaceCurrentCommand);

workspaceCmd
  .command('list')
  .description('List all workspaces')
  .action(workspaceListCommand);

workspaceCmd
  .command('create <name>')
  .description('Create a new workspace')
  .option('-w, --workdir <path>', 'Set working directory for this workspace')
  .action(workspaceCreateCommand);

workspaceCmd
  .command('use <name>')
  .description('Switch to a workspace')
  .action(workspaceUseCommand);

workspaceCmd
  .command('delete <name>')
  .description('Delete a workspace')
  .action(workspaceDeleteCommand);

// Collaborative Coding
const collabCmd = program
  .command('collab')
  .description('Collaborative coding with a partner')
  .addHelpText('after', `
${chalk.yellow('Subcommands:')}
  ${chalk.cyan('host <id>')}      Create a room and get a code to share
  ${chalk.cyan('join <code>')}    Join a room with the shared code
  ${chalk.cyan('sync')}           Upload your solution to the room
  ${chalk.cyan('compare')}        View both solutions side by side
  ${chalk.cyan('status')}         Check room and sync status
  ${chalk.cyan('leave')}          End the collaboration session

${chalk.yellow('Examples:')}
  ${chalk.gray('$ leetcode collab host 1')}       Start a session for Two Sum
  ${chalk.gray('$ leetcode collab join ABC123')} Join your partner's session
  ${chalk.gray('$ leetcode collab sync')}        Upload your code after solving
  ${chalk.gray('$ leetcode collab compare')}     Compare solutions
`);

collabCmd
  .command('host <problemId>')
  .description('Host a collaboration session')
  .action(collabHostCommand);

collabCmd
  .command('join <roomCode>')
  .description('Join a collaboration session')
  .action(collabJoinCommand);

collabCmd
  .command('sync')
  .description('Sync your code with partner')
  .action(collabSyncCommand);

collabCmd
  .command('compare')
  .description('Compare your solution with partner')
  .action(collabCompareCommand);

collabCmd
  .command('leave')
  .description('Leave the collaboration session')
  .action(collabLeaveCommand);

collabCmd
  .command('status')
  .description('Show collaboration status')
  .action(collabStatusCommand);

// Snapshot command
const snapshotCmd = program
  .command('snapshot')
  .description('Save and restore solution versions')
  .addHelpText('after', `
${chalk.yellow('Subcommands:')}
  ${chalk.cyan('save <id> [name]')}           Save current solution as a snapshot
  ${chalk.cyan('list <id>')}                  List all snapshots for a problem
  ${chalk.cyan('restore <id> <snapshot>')}   Restore a snapshot
  ${chalk.cyan('diff <id> <s1> <s2>')}        Compare two snapshots
  ${chalk.cyan('delete <id> <snapshot>')}    Delete a snapshot

${chalk.yellow('Examples:')}
  ${chalk.gray('$ leetcode snapshot save 1 "brute-force"')}     Save current solution
  ${chalk.gray('$ leetcode snapshot list 1')}                   List snapshots
  ${chalk.gray('$ leetcode snapshot restore 1 2')}              Restore snapshot #2
  ${chalk.gray('$ leetcode snapshot diff 1 1 2')}               Compare snapshots
`);

snapshotCmd
  .command('save <id> [name]')
  .description('Save current solution as a snapshot')
  .action(snapshotSaveCommand);

snapshotCmd
  .command('list <id>')
  .description('List all snapshots for a problem')
  .action(snapshotListCommand);

snapshotCmd
  .command('restore <id> <snapshot>')
  .description('Restore a snapshot')
  .action(snapshotRestoreCommand);

snapshotCmd
  .command('diff <id> <snap1> <snap2>')
  .description('Compare two snapshots')
  .action(snapshotDiffCommand);

snapshotCmd
  .command('delete <id> <snapshot>')
  .description('Delete a snapshot')
  .action(snapshotDeleteCommand);

// Update & Changelog
program
  .command('update')
  .description('Check for CLI updates')
  .option('--check-only', 'Only check for updates, do not show update instructions')
  .option('-f, --force', 'Force check even if recently checked')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode update')}                   Check for updates
  ${chalk.cyan('$ leetcode update --force')}           Force re-check npm registry
  ${chalk.cyan('$ leetcode update --check-only')}      Just check, minimal output
`)
  .action(updateCommand);

program
  .command('changelog [version]')
  .description('View release notes and changelog')
  .option('--latest', 'Show only the latest version')
  .option('--breaking', 'Show only versions with breaking changes')
  .option('-a, --all', 'Show all versions (default: only newer than installed)')
  .addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.cyan('$ leetcode changelog')}                Show what's new since your version
  ${chalk.cyan('$ leetcode changelog --all')}          View full changelog
  ${chalk.cyan('$ leetcode changelog 2.0.0')}          Show specific version
  ${chalk.cyan('$ leetcode changelog --latest')}       Show latest version only
  ${chalk.cyan('$ leetcode changelog --breaking')}     Filter to breaking changes
`)
  .action((version, options) => changelogCommand(version, options));

program.showHelpAfterError('(add --help for additional information)');


// Check for updates on startup (non-blocking)
const shouldCheckUpdates = process.argv.length > 2 && 
  !['update', 'changelog', '--version', '-v', '--help', '-h'].includes(process.argv[2]);

if (shouldCheckUpdates) {
  checkForUpdatesOnStartup().catch(() => {}); // Silent fail
}

program.parse();


if (!process.argv.slice(2).length) {
  console.log();
  console.log(chalk.bold.cyan('  🔥 LeetCode CLI'));
  console.log(chalk.gray('  A modern command-line interface for LeetCode'));
  console.log();
  program.outputHelp();
}
