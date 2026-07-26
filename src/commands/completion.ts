import chalk from 'chalk';

const BASH_COMPLETION = `_leetcode_completion() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  local commands="login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star"

  # Find command in the command line
  local cmd=""
  local i=1
  while [[ $i -lt $COMP_CWORD ]]; do
    local word="\${COMP_WORDS[i]}"
    if [[ " $commands " =~ " $word " ]]; then
      cmd="$word"
      break
    fi
    i=$((i+1))
  done

  if [[ -z "$cmd" ]]; then
    # Complete main commands
    COMPREPLY=( \$(compgen -W "\$commands" -- "\$cur") )
    return 0
  fi

  case "\$cmd" in
    workspace)
      local subcommands="current list create use delete"
      COMPREPLY=( \$(compgen -W "\$subcommands" -- "\$cur") )
      ;;
    timer)
      local subcommands="start stop status history stats"
      COMPREPLY=( \$(compgen -W "\$subcommands" -- "\$cur") )
      ;;
    bookmark)
      local subcommands="add remove list"
      COMPREPLY=( \$(compgen -W "\$subcommands" -- "\$cur") )
      ;;
    note)
      local subcommands="add remove list show edit"
      COMPREPLY=( \$(compgen -W "\$subcommands" -- "\$cur") )
      ;;
    list)
      local options="-d --difficulty -s --status -t --tag -q --search -l --limit -o --offset"
      if [[ "\$prev" == "-d" || "\$prev" == "--difficulty" ]]; then
        COMPREPLY=( \$(compgen -W "easy medium hard" -- "\$cur") )
      elif [[ "\$prev" == "-s" || "\$prev" == "--status" ]]; then
        COMPREPLY=( \$(compgen -W "todo solved attempted" -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    show)
      local options="-l --language -e --editor -o --open"
      if [[ "\$prev" == "-l" || "\$prev" == "--language" ]]; then
        COMPREPLY=( \$(compgen -W "typescript javascript python3 java cpp c csharp go rust kotlin swift sql" -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    pick)
      local options="-l --language -e --editor --no-open"
      if [[ "\$prev" == "-l" || "\$prev" == "--language" ]]; then
        COMPREPLY=( \$(compgen -W "typescript javascript python3 java cpp c csharp go rust kotlin swift sql" -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    contest)
      local options="-l --lang --no-open"
      if [[ "\$prev" == "-l" || "\$prev" == "--lang" ]]; then
        COMPREPLY=( \$(compgen -W "typescript javascript python3 java cpp c csharp go rust kotlin swift sql" -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    pick-batch|random)
      local options="-d --difficulty -t --tag -l --limit -o --offset -p --pick --no-open"
      if [[ "\$prev" == "-d" || "\$prev" == "--difficulty" ]]; then
        COMPREPLY=( \$(compgen -W "easy medium hard" -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    test)
      local options="-f --file -v --visualize -t --testcase"
      if [[ "\$prev" == "-f" || "\$prev" == "--file" ]]; then
        COMPREPLY=( \$(compgen -f -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    submit|diff)
      local options="-f --file"
      if [[ "\$prev" == "-f" || "\$prev" == "--file" ]]; then
        COMPREPLY=( \$(compgen -f -- "\$cur") )
      else
        COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      fi
      ;;
    submissions)
      local options="-l --limit --last -d --download"
      COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      ;;
    stat)
      local options="-c --calendar -s --skills -t --trend"
      COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      ;;
    changelog)
      local options="--all --latest --breaking"
      COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      ;;
    update)
      local options="-f --force"
      COMPREPLY=( \$(compgen -W "\$options" -- "\$cur") )
      ;;
  esac

  return 0
}
complete -F _leetcode_completion leetcode
`;

const ZSH_COMPLETION = `#compdef leetcode

_leetcode() {
  local -a commands
  commands=(
    'login:Login to LeetCode'
    'logout:Logout from LeetCode'
    'whoami:Show current user profile'
    'list:List problems'
    'show:Show problem details'
     'pick:Pick and generate solution file'
     'pick-batch:Pick multiple problems'
     'contest:Browse contests and pick a problem'
     'random:Pick a random problem'
    'test:Test your solution'
    'submit:Submit your solution'
    'submissions:View past submissions'
    'diff:Compare solution with past submission'
    'timer:Manage interview timer'
    'workspace:Manage workspaces'
    'bookmark:Manage bookmarked problems'
    'note:Manage personal notes'
    'sync:Sync solutions to Git repository'
    'today:Show today progress'
    'stat:Show solving statistics'
    'changelog:Show version changelog'
    'update:Check for updates'
    'star:Open GitHub repo to star the project'
  )

  _arguments \\
    '1: :->command' \\
    '*:: :->args'

  case $state in
    command)
      _describe -t commands 'leetcode command' commands
      ;;
    args)
      local cmd=$line[1]
      case $cmd in
        workspace)
          local -a subcmds
          subcmds=(
            'current:Show active workspace'
            'list:List all workspaces'
            'create:Create a new workspace'
            'use:Switch workspace'
            'delete:Delete a workspace'
          )
          _describe -t subcmds 'workspace subcommand' subcmds
          ;;
        timer)
          local -a subcmds
          subcmds=(
            'start:Start interview timer'
            'stop:Stop active timer'
            'status:Show current timer status'
            'history:View timer history'
            'stats:Show timer statistics'
          )
          _describe -t subcmds 'timer subcommand' subcmds
          ;;
        bookmark)
          local -a subcmds
          subcmds=(
            'add:Add a problem to bookmarks'
            'remove:Remove a problem from bookmarks'
            'list:List all bookmarked problems'
          )
          _describe -t subcmds 'bookmark subcommand' subcmds
          ;;
        note)
          local -a subcmds
          subcmds=(
            'add:Add note to problem'
            'remove:Delete note from problem'
            'list:List all notes'
            'show:Show note for a problem'
            'edit:Edit note in external editor'
          )
          _describe -t subcmds 'note subcommand' subcmds
          ;;
        list)
          _arguments \\
            '(-d --difficulty)'{-d,--difficulty}'[Filter by difficulty]:difficulty:(easy medium hard)' \\
            '(-s --status)'{-s,--status}'[Filter by status]:status:(todo solved attempted)' \\
            '*-t' '*--tag[Filter by topic tag]:tag:' \\
            '(-q --search)'{-q,--search}'[Search by keyword]:keyword:' \\
            '(-l --limit)'{-l,--limit}'[Limit results]:limit:' \\
            '(-o --offset)'{-o,--offset}'[Offset results]:offset:'
          ;;
        show)
          _arguments \\
            '(-l --language)'{-l,--language}'[Specify programming language]:language:(typescript javascript python3 java cpp c csharp go rust kotlin swift sql)' \\
            '(-e --editor)'{-e,--editor}'[Open solution file in editor]' \\
            '(-o --open)'{-o,--open}'[Open problem page in browser]'
          ;;
        pick)
          _arguments \\
            '(-l --language)'{-l,--language}'[Specify programming language]:language:(typescript javascript python3 java cpp c csharp go rust kotlin swift sql)' \\
            '(-e --editor)'{-e,--editor}'[Open solution file in editor]' \\
             '--no-open[Do not open problem details or file]'
           ;;
        contest)
          _arguments \\
            '(-l --lang)'{-l,--lang}'[Specify programming language]:language:(typescript javascript python3 java cpp c csharp go rust kotlin swift sql)' \\
            '--no-open[Do not open solution file in editor]'
          ;;
        pick-batch)
          _arguments \\
            '(-d --difficulty)'{-d,--difficulty}'[Filter by difficulty]:difficulty:(easy medium hard)' \\
            '*-t' '*--tag[Filter by topic tag]:tag:' \\
            '(-l --limit)'{-l,--limit}'[Limit batch size]:limit:' \\
            '(-o --offset)'{-o,--offset}'[Offset results]:offset:'
          ;;
        random)
          _arguments \\
            '(-d --difficulty)'{-d,--difficulty}'[Filter by difficulty]:difficulty:(easy medium hard)' \\
            '*-t' '*--tag[Filter by topic tag]:tag:' \\
            '(-p --pick)'{-p,--pick}'[Generate solution file and open it]' \\
            '--no-open[Do not open problem details or file]'
          ;;
        test)
          _arguments \\
            '(-f --file)'{-f,--file}'[Specify solution file path]:file:_files' \\
            '(-v --visualize)'{-v,--visualize}'[Visualize test output]' \\
            '(-t --testcase)'{-t,--testcase}'[Specify custom testcases]:testcases:'
          ;;
        submit)
          _arguments \\
            '(-f --file)'{-f,--file}'[Specify solution file path]:file:_files'
          ;;
        submissions)
          _arguments \\
            '(-l --limit)'{-l,--limit}'[Limit submission history size]:limit:' \\
            '--last[Show last accepted submission]' \\
            '(-d --download)'{-d,--download}'[Download last accepted submission]'
          ;;
        diff)
          _arguments \\
            '(-f --file)'{-f,--file}'[Specify solution file path]:file:_files' \\
            '(-u --unified)'{-u,--unified}'[Show unified diff instead of side-by-side]'
          ;;
        stat)
          _arguments \\
            '(-c --calendar)'{-c,--calendar}'[Show calendar representation]' \\
            '(-s --skills)'{-s,--skills}'[Show topic skill breakdown]' \\
            '(-t --trend)'{-t,--trend}'[Show daily submission trends]'
          ;;
        changelog)
          _arguments \\
            '--all[Show full changelog]' \\
            '--latest[Show only latest version changelog]' \\
            '--breaking[Show only breaking changes]'
          ;;
        update)
          _arguments \\
            '(-f --force)'{-f,--force}'[Force check updates]'
          ;;
      esac
      ;;
  esac
}
`;

const FISH_COMPLETION = `# Disable standard file completion for commands
complete -c leetcode -f

# Main commands
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a login -d "Login to LeetCode"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a logout -d "Logout from LeetCode"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a whoami -d "Show current user profile"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a list -d "List problems"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a show -d "Show problem details"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a pick -d "Pick and generate solution file"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a pick-batch -d "Pick multiple problems"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a contest -d "Browse contests and pick a problem"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a random -d "Pick a random problem"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a test -d "Test your solution"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a submit -d "Submit your solution"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a submissions -d "View past submissions"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a diff -d "Compare solution with past submission"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a timer -d "Manage interview timer"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a workspace -d "Manage workspaces"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a bookmark -d "Manage bookmarked problems"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a note -d "Manage personal notes"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a sync -d "Sync solutions to Git repository"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a today -d "Show today progress"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a stat -d "Show solving statistics"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a changelog -d "Show version changelog"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a update -d "Check for updates"
complete -c leetcode -n "not __fish_seen_subcommand_from login logout whoami list show pick pick-batch contest random test submit submissions diff timer workspace bookmark note sync today stat changelog update star" -a star -d "Open GitHub repo to star the project"

# Workspace subcommands
complete -c leetcode -n "__fish_seen_subcommand_from workspace" -a current -d "Show active workspace"
complete -c leetcode -n "__fish_seen_subcommand_from workspace" -a list -d "List all workspaces"
complete -c leetcode -n "__fish_seen_subcommand_from workspace" -a create -d "Create a new workspace"
complete -c leetcode -n "__fish_seen_subcommand_from workspace" -a use -d "Switch workspace"
complete -c leetcode -n "__fish_seen_subcommand_from workspace" -a delete -d "Delete a workspace"

# Timer subcommands
complete -c leetcode -n "__fish_seen_subcommand_from timer" -a start -d "Start interview timer"
complete -c leetcode -n "__fish_seen_subcommand_from timer" -a stop -d "Stop active timer"
complete -c leetcode -n "__fish_seen_subcommand_from timer" -a status -d "Show current timer status"
complete -c leetcode -n "__fish_seen_subcommand_from timer" -a history -d "View timer history"
complete -c leetcode -n "__fish_seen_subcommand_from timer" -a stats -d "Show timer statistics"

# Bookmark subcommands
complete -c leetcode -n "__fish_seen_subcommand_from bookmark" -a add -d "Add a problem to bookmarks"
complete -c leetcode -n "__fish_seen_subcommand_from bookmark" -a remove -d "Remove a problem from bookmarks"
complete -c leetcode -n "__fish_seen_subcommand_from bookmark" -a list -d "List all bookmarked problems"

# Note subcommands
complete -c leetcode -n "__fish_seen_subcommand_from note" -a add -d "Add note to problem"
complete -c leetcode -n "__fish_seen_subcommand_from note" -a remove -d "Delete note from problem"
complete -c leetcode -n "__fish_seen_subcommand_from note" -a list -d "List all notes"
complete -c leetcode -n "__fish_seen_subcommand_from note" -a show -d "Show note for a problem"
complete -c leetcode -n "__fish_seen_subcommand_from note" -a edit -d "Edit note in external editor"

# List options
complete -c leetcode -n "__fish_seen_subcommand_from list" -s d -l difficulty -x -a "easy medium hard" -d "Filter by difficulty"
complete -c leetcode -n "__fish_seen_subcommand_from list" -s s -l status -x -a "todo solved attempted" -d "Filter by status"
complete -c leetcode -n "__fish_seen_subcommand_from list" -s t -l tag -d "Filter by topic tag"
complete -c leetcode -n "__fish_seen_subcommand_from list" -s q -l search -d "Search by keyword"
complete -c leetcode -n "__fish_seen_subcommand_from list" -s l -l limit -d "Limit results"
complete -c leetcode -n "__fish_seen_subcommand_from list" -s o -l offset -d "Offset results"

# Contest options
complete -c leetcode -n "__fish_seen_subcommand_from contest" -s l -l lang -x -a "typescript javascript python3 java cpp c csharp go rust kotlin swift sql" -d "Specify programming language"
complete -c leetcode -n "__fish_seen_subcommand_from contest" -l no-open -d "Do not open solution file in editor"
`;

export async function completionCommand(shell: string): Promise<void> {
  const normalizedShell = shell.toLowerCase().trim();

  switch (normalizedShell) {
    case 'bash':
      console.log(BASH_COMPLETION);
      break;
    case 'zsh':
      console.log(ZSH_COMPLETION);
      break;
    case 'fish':
      console.log(FISH_COMPLETION);
      break;
    default:
      console.error(chalk.red(`Unsupported shell: ${shell}`));
      console.error(chalk.gray('Supported shells: bash, zsh, fish'));
      process.exit(1);
  }
}
