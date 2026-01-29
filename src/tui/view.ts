import chalk from 'chalk';
import type { AppModel } from './types.js';
import { colors, borders, icons } from './theme.js';
import { renderHeader } from './components/header.js';
import { renderStatusBar, getScreenHints } from './components/statusbar.js';
import { view as homeView } from './screens/home/view.js';
import { view as listView } from './screens/list/view.js';
import { view as timerView } from './screens/timer/view.js';
import { view as renderStatsScreen } from './screens/stats/view.js';
import { view as renderConfigScreen } from './screens/config/view.js';
import { view as renderWorkspaceScreen } from './screens/workspace/view.js';
import { view as loginView } from './screens/login/view.js';
import { view as renderChangelogScreen } from './screens/changelog/view.js';
import { view as problemView } from './screens/problem/view.js';
import { center, renderLogo } from './lib/layout.js';

export function view(model: AppModel): string {
  const lines: string[] = [];
  const { terminalWidth: width, terminalHeight: height } = model;

  if (model.isCheckingAuth) {
    return renderLoadingScreen(width, height);
  }

  if (model.isCheckingAuth) {
    return renderLoadingScreen(width, height);
  }

  const headerLines = renderHeader({
    username: model.user?.username ?? 'Guest',
    isConnected: model.user?.isLoggedIn ?? false,
    width,
  });
  lines.push(...headerLines);

  const contentHeight = height - 4;
  const content = renderScreen(model, width, contentHeight);
  lines.push(content);

  const statusLines = renderStatusBar({
    screen: model.screenState.screen,
    hints: getScreenHints(model.screenState.screen),
    width,
  });
  lines.push(...statusLines);

  return lines.join('\n');
}

function renderScreen(model: AppModel, width: number, height: number): string {
  const { screenState } = model;

  switch (screenState.screen) {
    case 'home':
      return homeView(screenState.model, width, height);

    case 'list':
      return listView(screenState.model, width, height);

    case 'help':
      return renderHelpScreen(width, height);

    case 'login':
      return loginView(screenState.model as import('./types.js').LoginScreenModel, width, height);

    case 'workspace':
      return renderWorkspaceScreen(
        screenState.model as import('./types.js').WorkspaceScreenModel,
        width,
        height
      );

    case 'timer':
      return timerView(screenState.model as import('./types.js').TimerScreenModel, width, height);

    case 'stats':
      return renderStatsScreen(
        screenState.model as import('./types.js').StatsScreenModel,
        width,
        height
      );

    case 'config':
      return renderConfigScreen(
        screenState.model as import('./types.js').ConfigScreenModel,
        width,
        height
      );

    case 'problem':
      return problemView(
        screenState.model as import('./types.js').ProblemScreenModel,
        width,
        height
      );

    case 'changelog':
      return renderChangelogScreen(
        screenState.model as import('./types.js').ChangelogScreenModel,
        width,
        height
      );
  }
}

function renderLoadingScreen(width: number, height: number): string {
  const lines: string[] = [];
  const midY = Math.floor(height / 2);

  for (let i = 0; i < midY - 5; i++) {
    lines.push('');
  }

  const logoLines = renderLogo(width);
  lines.push(...logoLines);
  lines.push('');

  const loadingText = chalk.hex(colors.primary)('⋯ Checking authentication...');
  lines.push(center(loadingText, width));

  while (lines.length < height) {
    lines.push('');
  }

  return lines.join('\n');
}

function renderHelpScreen(width: number, height: number): string {
  const lines: string[] = [];

  const totalContentHeight = 4 + 4 + 7 + 5;
  const availableSpace = height - totalContentHeight - 2;
  const gap = Math.max(0, Math.floor(availableSpace / 5));

  for (let i = 0; i < gap; i++) lines.push('');

  lines.push(chalk.hex(colors.primary).bold(`  ${icons.star} Keyboard Shortcuts`));
  lines.push(chalk.hex(colors.textMuted)('  ' + borders.horizontal.repeat(width - 4)));
  lines.push('');

  const shortcuts = [
    {
      section: 'Global',
      items: [
        ['?', 'Toggle help'],
        ['Ctrl+C', 'Quit'],
        ['Esc', 'Go back'],
      ],
    },
    {
      section: 'Navigation',
      items: [
        ['j / ↓', 'Move down'],
        ['k / ↑', 'Move up'],
        ['g', 'Go to top'],
        ['G', 'Go to bottom'],
        ['Page Up/Down', 'Page navigation'],
      ],
    },
    {
      section: 'Home Screen',
      items: [
        ['l', 'Problem List'],
        ['d', 'Daily Challenge'],
        ['t', 'Timer'],
        ['s', 'Statistics'],
        ['c', 'Config'],
        ['q', 'Quit'],
      ],
    },
    {
      section: 'List Screen',
      items: [
        ['/', 'Search'],
        ['1/2/3', 'Filter Easy/Medium/Hard'],
        ['c', 'Clear filters'],
        ['Enter', 'Open problem'],
      ],
    },
  ];

  for (const group of shortcuts) {
    for (let i = 0; i < gap; i++) lines.push('');
    lines.push(chalk.hex(colors.primary).bold(`  ${group.section}`));
    for (const [key, desc] of group.items) {
      lines.push('    ' + chalk.hex(colors.cyan)(key.padEnd(14)) + chalk.hex(colors.text)(desc));
    }
  }

  while (lines.length < height - 1) {
    lines.push('');
  }

  return lines.join('\n');
}
