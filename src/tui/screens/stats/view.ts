import chalk from 'chalk';
import type { StatsScreenModel } from '../../types.js';
import { colors } from '../../theme.js';
import { box, center, keyHint, truncate } from '../../lib/layout.js';
import { generateHeatmap, generateTrendChart } from '../../lib/chart-utils.js';

export function view(model: StatsScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height;

  if (model.loading) return renderLoading(width, contentHeight);
  if (model.error) return renderError(model.error, width, contentHeight);
  if (!model.stats || !model.skillStats)
    return renderError('No data available', width, contentHeight);

  lines.push('');
  const userBox = [
    `User: ${chalk.bold(model.stats.username)}  Rank: #${model.stats.ranking}  Streak: ${model.stats.streak} 🔥`,
  ];
  lines.push(...box(userBox, width, 'Profile'));
  lines.push('');

  let remainingHeight = contentHeight - 7;

  if (remainingHeight > 8 && model.stats.submissionCalendar) {
    const trend = generateTrendChart(model.stats.submissionCalendar, width - 4);
    lines.push(...box(trend, width, 'Trend'));
    lines.push('');
    remainingHeight -= trend.length + 2;
  }

  if (remainingHeight > 8 && model.stats.submissionCalendar) {
    const heatmap = generateHeatmap(model.stats.submissionCalendar, width - 4);

    lines.push(...box(heatmap, width, 'Activity'));
    lines.push('');
    remainingHeight -= heatmap.length + 2;
  }

  if (remainingHeight > 5 && model.skillStats) {
    const skillsBox = renderSkillStats(model, width - 4);
    lines.push(...box(skillsBox, width, 'Top Skills'));
  }

  while (lines.length < contentHeight - 1) lines.push('');

  lines.push(center(keyHint('Esc', 'Back') + '  ' + keyHint('R', 'Refresh'), width));

  return lines.join('\n');
}

function renderSkillStats(model: StatsScreenModel, width: number): string[] {
  const skills = model.skillStats!;

  const all = [...skills.advanced, ...skills.intermediate, ...skills.fundamental]
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 10);

  const tags = all.map((s) => `${s.tagName} (${s.problemsSolved})`).join(' • ');
  return [truncate(tags, width - 4)];
}

function renderLoading(width: number, height: number): string {
  const lines = [];
  const mid = Math.floor(height / 2);
  for (let i = 0; i < mid; i++) lines.push('');
  lines.push(center(chalk.hex(colors.primary)('Loading stats...'), width));
  while (lines.length < height) lines.push('');
  return lines.join('\n');
}

function renderError(err: string, width: number, height: number): string {
  const lines = [];
  const mid = Math.floor(height / 2);
  for (let i = 0; i < mid; i++) lines.push('');
  lines.push(center(chalk.hex(colors.error)(`Error: ${err}`), width));
  while (lines.length < height) lines.push('');
  return lines.join('\n');
}
