

import chalk from 'chalk';
import type { ListScreenModel, Problem } from '../../types.js';
import { colors, borders, icons, layout } from '../../theme.js';
import { 
  stripAnsi, 
  padEnd, 
  padStart, 
  truncate, 
  statusIcon, 
  difficultyBadge,
  badge,
  progressBar,
  keyHint,
  visibleLength,
} from '../../lib/layout.js';

export function view(model: ListScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height;

  lines.push(renderListHeader(model, width));
  lines.push('');

  lines.push(renderSearchBar(model, width));

  lines.push(renderFilters(model, width));
  lines.push('');

  if (model.loading && model.problems.length === 0) {
    lines.push(...renderLoadingState(width, contentHeight - 6));
    return lines.join('\n');
  }

  if (model.error && model.problems.length === 0) {
    lines.push(...renderErrorState(model.error, width, contentHeight - 6));
    return lines.join('\n');
  }

  if (model.problems.length === 0) {
    lines.push(...renderEmptyState(width, contentHeight - 6));
    return lines.join('\n');
  }

  lines.push(renderTableHeader(width));
  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));

  const listHeight = Math.max(3, contentHeight - 9);

  const visibleProblems = model.problems.slice(
    model.scrollOffset,
    model.scrollOffset + listHeight
  );

  for (let i = 0; i < visibleProblems.length; i++) {
    const problem = visibleProblems[i];
    const isSelected = model.scrollOffset + i === model.cursor;
    lines.push(renderProblemRow(problem, isSelected, width));
  }

  for (let i = visibleProblems.length; i < listHeight; i++) {
    lines.push('');
  }

  lines.push(chalk.hex(colors.textMuted)(borders.horizontal.repeat(width)));
  lines.push(renderListFooter(model, width));

  return lines.join('\n');
}

function renderListHeader(model: ListScreenModel, width: number): string {
  
  const titleText = model.bookmarkFilter ? '★ Bookmarks' : `${icons.folder} Problems`;
  const title = chalk.hex(colors.primary).bold(titleText);
  const count = chalk.hex(colors.textMuted)(`(${model.problems.length}${model.bookmarkFilter ? ' bookmarked' : ` of ${model.total}`})`);
  const loadingIndicator = model.loadingMore 
    ? chalk.hex(colors.primary)(' ⋯ Loading more...') 
    : '';

  const leftPart = `${title} ${count}${loadingIndicator}`;

  if (model.total > 0) {
    const solvedCount = model.problems.filter(p => p.status === 'ac').length;
    const progressWidth = 20;
    const progress = progressBar(solvedCount, model.problems.length, progressWidth);
    const progressLabel = chalk.hex(colors.textMuted)(` ${solvedCount} solved`);
    const rightPart = progress + progressLabel;

    const padding = width - stripAnsi(leftPart).length - stripAnsi(rightPart).length;
    return leftPart + (padding > 0 ? ' '.repeat(padding) : '  ') + rightPart;
  }

  return leftPart;
}

function renderSearchBar(model: ListScreenModel, width: number): string {
  const prefix = chalk.hex(colors.textMuted)(`${icons.target} Search: `);

  if (model.searchMode) {
    
    const buffer = model.searchBuffer || '';
    const cursor = chalk.hex(colors.primary)('▌');
    const searchBox = chalk.bgHex(colors.bgHighlight).hex(colors.textBright)(
      ` ${buffer}${cursor} `.padEnd(30)
    );
    return prefix + searchBox + chalk.hex(colors.textMuted)('  (Enter to search, Esc to cancel)');
  }

  if (model.searchQuery) {
    
    const queryText = chalk.hex(colors.primary).underline(model.searchQuery);
    const clearHint = chalk.hex(colors.textMuted)('  [c] to clear');
    return prefix + queryText + clearHint;
  }

  return prefix + chalk.hex(colors.textDim)('Press / to search...');
}

function renderFilters(model: ListScreenModel, width: number): string {
  const parts: string[] = [];

  parts.push(chalk.hex(colors.textMuted)(`${icons.gear} Filters: `));

  const difficulties: Array<{ key: string; value: 'Easy' | 'Medium' | 'Hard'; color: string }> = [
    { key: '1', value: 'Easy', color: colors.success },
    { key: '2', value: 'Medium', color: colors.warning },
    { key: '3', value: 'Hard', color: colors.error },
  ];

  for (const diff of difficulties) {
    const isActive = model.difficultyFilter === diff.value;
    if (isActive) {
      parts.push(badge(diff.value, diff.color));
    } else {
      parts.push(
        chalk.hex(colors.textMuted)('[') +
          chalk.hex(colors.textDim)(diff.key) +
          chalk.hex(colors.textMuted)('] ') +
          chalk.hex(colors.textDim)(diff.value)
      );
    }
    parts.push(' ');
  }

  parts.push(chalk.hex(colors.textMuted)(' │ '));

  const statuses: Array<{ key: string; value: 'solved' | 'attempted' | 'todo'; label: string; color: string }> = [
    { key: 's', value: 'solved', label: 'Solved', color: colors.success },
    { key: 'a', value: 'attempted', label: 'Tried', color: colors.warning },
  ];

  for (const status of statuses) {
    const isActive = model.statusFilter === status.value;
    if (isActive) {
      parts.push(badge(status.label, status.color));
    } else {
      parts.push(
        chalk.hex(colors.textMuted)('[') +
          chalk.hex(colors.textDim)(status.key) +
          chalk.hex(colors.textMuted)('] ') +
          chalk.hex(colors.textDim)(status.label)
      );
    }
    parts.push(' ');
  }

  if (model.difficultyFilter || model.statusFilter || model.searchQuery || model.bookmarkFilter) {
    parts.push(chalk.hex(colors.textMuted)(' │ '));
    parts.push(keyHint('c', 'Clear All'));
  }

  return parts.join('');
}

function renderTableHeader(width: number): string {
  const cols = layout.tableColumns;
  const titleWidth = width - cols.selector - cols.status - cols.id - cols.difficulty - cols.acceptance - cols.premium - 6;

  return chalk.hex(colors.textMuted)(
    '  ' +
    padEnd('', cols.selector) +
    padEnd('', cols.status) +
    padEnd('ID', cols.id) +
    padEnd('Title', titleWidth) +
    padEnd('Diff', cols.difficulty) +
    padStart('Acc %', cols.acceptance) +
    '  ' +
    padEnd('', cols.premium)
  );
}

function renderProblemRow(problem: Problem, isSelected: boolean, width: number): string {
  const cols = layout.tableColumns;
  const titleWidth = width - cols.selector - cols.status - cols.id - cols.difficulty - cols.acceptance - cols.premium - 6;

  const selector = isSelected
    ? chalk.hex(colors.primary).bold('▶ ')
    : '  ';

  const statusIconStr = statusIcon(problem.status);
  const status = visibleLength(statusIconStr) < cols.status 
     ? statusIconStr + ' '.repeat(cols.status - visibleLength(statusIconStr)) 
     : statusIconStr;

  const id = chalk.hex(colors.textMuted)(padEnd(problem.questionFrontendId, cols.id));

  const title = isSelected
    ? chalk.hex(colors.textBright).bold(truncate(problem.title, titleWidth))
    : chalk.hex(colors.text)(truncate(problem.title, titleWidth));
  const titlePadded = padEnd(title, titleWidth);

  const diffColor = 
    problem.difficulty === 'Easy' ? colors.success :
    problem.difficulty === 'Medium' ? colors.warning :
    colors.error;
  const diff = chalk.hex(diffColor)(padEnd(problem.difficulty, cols.difficulty));

  const acc = chalk.hex(colors.textMuted)(padStart(`${Math.round(problem.acRate)}%`, cols.acceptance));

  const premium = problem.isPaidOnly ? chalk.hex(colors.warning)('💎') : '  ';

  const row = '  ' + selector + status + id + titlePadded + diff + acc + '  ' + premium;

  if (isSelected) {
    const stripped = stripAnsi(row);
    const padding = width - stripped.length;
    return chalk.bgHex(colors.bgHighlight)(row + (padding > 0 ? ' '.repeat(padding) : ''));
  }

  return row;
}

function renderListFooter(model: ListScreenModel, width: number): string {
  
  const position = model.problems.length > 0
    ? `${model.cursor + 1} of ${model.problems.length}`
    : '0 of 0';

  const leftPart = chalk.hex(colors.textMuted)(`Position: ${position}`);

  const moreInfo = model.problems.length < model.total
    ? chalk.hex(colors.textMuted)(` (${model.total - model.problems.length} more available)`)
    : '';

  const hints = [
    keyHint('j/k', 'Move'),
    keyHint('g/G', 'Top/Bottom'),
    keyHint('b', 'Bookmarks'),
    keyHint('↵', 'Open'),
  ];
  const rightPart = hints.join('  ');

  const padding = width - stripAnsi(leftPart + moreInfo).length - stripAnsi(rightPart).length;
  return leftPart + moreInfo + (padding > 0 ? ' '.repeat(padding) : '  ') + rightPart;
}

function renderLoadingState(width: number, height: number): string[] {
  const lines: string[] = [];
  const midY = Math.floor(height / 2);

  for (let i = 0; i < midY - 1; i++) {
    lines.push('');
  }

  const spinner = chalk.hex(colors.primary)('⋯');
  const text = chalk.hex(colors.textMuted)(' Loading problems...');
  lines.push('  ' + spinner + text);

  while (lines.length < height) {
    lines.push('');
  }

  return lines;
}

function renderErrorState(error: string, width: number, height: number): string[] {
  const lines: string[] = [];
  const midY = Math.floor(height / 2);

  for (let i = 0; i < midY - 2; i++) {
    lines.push('');
  }

  lines.push('  ' + chalk.hex(colors.error)(`${icons.cross} Error: ${error}`));
  lines.push('');
  lines.push('  ' + chalk.hex(colors.textMuted)('Press R to retry'));

  while (lines.length < height) {
    lines.push('');
  }

  return lines;
}

function renderEmptyState(width: number, height: number): string[] {
  const lines: string[] = [];
  const midY = Math.floor(height / 2);

  for (let i = 0; i < midY - 2; i++) {
    lines.push('');
  }

  lines.push('  ' + chalk.hex(colors.textMuted)('No problems found.'));
  lines.push('');
  lines.push('  ' + chalk.hex(colors.textMuted)('Try adjusting your filters or search query.'));

  while (lines.length < height) {
    lines.push('');
  }

  return lines;
}
