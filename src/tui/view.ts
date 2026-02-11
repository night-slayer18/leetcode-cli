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
import {
  padEnd as ansiPadEnd,
  center,
  renderFooterHints,
  renderLogo,
  renderScreenTitle,
  renderSectionHeader,
  stripAnsi,
  splitPane,
  truncate,
  wrapLines,
} from './lib/layout.js';

export function view(model: AppModel): string {
  const lines: string[] = [];
  const { terminalWidth: width, terminalHeight: height } = model;

  if (model.isCheckingAuth) {
    return renderLoadingScreen(width, height);
  }

  const headerLines = renderHeader({
    username: model.user?.username ?? 'Guest',
    isConnected: model.user?.isLoggedIn ?? false,
    width,
  });
  lines.push(...headerLines);

  const contentHeight = Math.max(1, height - 4);
  const content = renderScreen(model, width, contentHeight);
  lines.push(content);

  const statusHints =
    model.screenState.screen === 'problem' || model.screenState.screen === 'help'
      ? []
      : getScreenHints(model.screenState.screen);

  const statusLines = renderStatusBar({
    screen: model.screenState.screen,
    hints: statusHints,
    message: model.globalError ?? undefined,
    width,
  });
  lines.push(...statusLines);

  return fitToViewport(lines.join('\n'), width, height);
}

function renderScreen(model: AppModel, width: number, height: number): string {
  const { screenState } = model;

  switch (screenState.screen) {
    case 'home':
      return homeView(screenState.model, width, height);

    case 'list':
      return listView(screenState.model, width, height);

    case 'help':
      return renderHelpScreen(
        screenState.model as import('./types.js').HelpScreenModel,
        width,
        height
      );

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

function renderHelpScreen(
  model: import('./types.js').HelpScreenModel,
  width: number,
  height: number
): string {
  const lines: string[] = [];
  const safeWidth = Math.max(20, width);
  const safeHeight = Math.max(8, height);

  lines.push(
    ...renderScreenTitle(
      `${icons.star} Keyboard Cheat Sheet`,
      'All shortcuts in one place',
      safeWidth
    )
  );
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(safeWidth)));

  const footerMode = safeWidth < 90 ? 'compact' : 'normal';
  const footerLines = renderFooterHints(
    [
      { key: 'j/k', label: 'Scroll' },
      { key: 'PgUp/PgDn', label: 'Page' },
      { key: 'g/G', label: 'Top/Bottom' },
      { key: '?/Esc', label: 'Close' },
    ],
    safeWidth,
    footerMode
  ).slice(0, 1);
  const footerReserved = 1 + footerLines.length;

  const bodyHeight = Math.max(3, safeHeight - lines.length - footerReserved);
  const allBodyLines = buildHelpBodyLines(safeWidth);
  const maxScroll = Math.max(0, allBodyLines.length - bodyHeight);
  const offset = Math.min(model.scrollOffset, maxScroll);
  const visible = allBodyLines.slice(offset, offset + bodyHeight);
  lines.push(...visible);

  while (lines.length < safeHeight - footerReserved) {
    lines.push('');
  }
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(safeWidth)));
  lines.push(...footerLines);

  return lines.slice(0, safeHeight).join('\n');
}

type HelpGroup = {
  section: string;
  items: Array<[string, string]>;
};

function buildHelpGroups(): HelpGroup[] {
  return [
    {
      section: 'Global',
      items: [
        ['?', 'Toggle help'],
        ['Ctrl+C', 'Quit app'],
        ['Esc', 'Back / close panel'],
      ],
    },
    {
      section: 'Navigation',
      items: [
        ['j / ↓', 'Move down'],
        ['k / ↑', 'Move up'],
        ['g / G', 'Top / Bottom'],
        ['PgUp/PgDn', 'Page jump'],
      ],
    },
    {
      section: 'Home',
      items: [
        ['l', 'Problem list'],
        ['d / r', 'Daily / Random'],
        ['w / c', 'Workspace / Config'],
        ['q', 'Quit'],
      ],
    },
    {
      section: 'List',
      items: [
        ['/', 'Search'],
        ['1/2/3', 'Difficulty filters'],
        ['s / a / b', 'Status / Attempted / Bookmarks'],
        ['Enter', 'Open problem'],
      ],
    },
    {
      section: 'Problem',
      items: [
        ['p / t / s', 'Pick / Test / Submit'],
        ['h / H / V', 'Hint / Subs / Snapshots'],
        ['b / n / e', 'Bookmark / Note / Edit note'],
        ['j / k', 'Scroll content/panel'],
      ],
    },
    {
      section: 'Workspace/Config',
      items: [
        ['Tab / h / l', 'Switch pane'],
        ['Enter', 'Switch or edit/save'],
        ['c / d', 'Create / Delete workspace'],
        ['Esc', 'Cancel edit or go back'],
      ],
    },
  ];
}

function renderHelpGroup(group: HelpGroup, width: number): string[] {
  const lines: string[] = [];
  const safeWidth = Math.max(20, width);
  const keyWidth = Math.max(8, Math.min(14, Math.floor(safeWidth * 0.26)));
  const descWidth = Math.max(8, safeWidth - keyWidth - 3);
  lines.push(renderSectionHeader(group.section, width));
  for (const [key, desc] of group.items) {
    const descLines = wrapLines([desc], descWidth);
    const keyCell = chalk.hex(colors.cyan)(ansiPadEnd(key, keyWidth));
    lines.push(` ${keyCell} ${chalk.hex(colors.text)(descLines[0] ?? '')}`);
    for (let i = 1; i < descLines.length; i++) {
      lines.push(` ${' '.repeat(keyWidth)} ${chalk.hex(colors.textMuted)(descLines[i])}`);
    }
  }
  return lines;
}

function buildHelpBodyLines(width: number): string[] {
  const groups = buildHelpGroups();
  if (width < 90) {
    const lines: string[] = [];
    for (const group of groups) {
      lines.push(...renderHelpGroup(group, width));
      lines.push('');
    }
    return lines;
  }

  const lines: string[] = [];
  const ratio = 0.49;
  const leftWidth = Math.max(8, Math.floor(width * ratio));
  const rightWidth = Math.max(8, width - leftWidth - 1);
  for (let i = 0; i < groups.length; i += 2) {
    const left = renderHelpGroup(groups[i], leftWidth);
    const right = groups[i + 1] ? renderHelpGroup(groups[i + 1], rightWidth) : [];
    const rowHeight = Math.max(left.length, right.length);
    lines.push(...splitPane(left, right, width, rowHeight, ratio));
    lines.push('');
  }
  return lines;
}

export function estimateHelpMaxScroll(width: number, height: number): number {
  const safeWidth = Math.max(20, width);
  const safeHeight = Math.max(8, height);
  const bodyHeight = Math.max(3, safeHeight - 5);
  return Math.max(0, buildHelpBodyLines(safeWidth).length - bodyHeight);
}

function fitToViewport(output: string, width: number, height: number): string {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const rawLines = output.split('\n');
  const lines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] ?? '';
    if (stripAnsi(line).length > safeWidth) {
      lines.push(truncate(line, safeWidth));
    } else {
      lines.push(line);
    }
  }

  while (lines.length < safeHeight) {
    lines.push('');
  }

  return lines.slice(0, safeHeight).join('\n');
}
