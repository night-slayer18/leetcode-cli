

import chalk from 'chalk';
import type { StatsScreenModel } from '../../types.js';
import { colors, icons, borders } from '../../theme.js';
import { box, center, progressBar, keyHint, truncate } from '../../lib/layout.js';
import { generateHeatmap, generateTrendChart } from '../../lib/chart-utils.js';

export function view(model: StatsScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height;

  if (model.loading) return renderLoading(width, contentHeight);
  if (model.error) return renderError(model.error, width, contentHeight);
  if (!model.stats || !model.skillStats) return renderError('No data available', width, contentHeight);

  const totalBoxHeight = 3 + 6 + (model.skillStats ? 3 : 0); 
  const availableSpace = contentHeight - totalBoxHeight - 2; 
  const gap = Math.max(0, Math.floor(availableSpace / 4)); 

  const headerHeight = 3;
  const trendHeight = 7; 
  const heatmapHeight = 12; 
  const skillsHeight = 12; 

  lines.push('');
  const userBox = [
    `User: ${chalk.bold(model.stats.username)}  Rank: #${model.stats.ranking}  Streak: ${model.stats.streak} 🔥`
  ];
  lines.push(...box(userBox, width, 'Profile'));
  lines.push('');

  let remainingHeight = contentHeight - 7; 

  if (remainingHeight > 8 && model.stats.submissionCalendar) {
      const trend = generateTrendChart(model.stats.submissionCalendar, width - 4);
      lines.push(...box(trend, width, 'Trend'));
      lines.push('');
      remainingHeight -= (trend.length + 2);
  }

  if (remainingHeight > 8 && model.stats.submissionCalendar) {
      const heatmap = generateHeatmap(model.stats.submissionCalendar, width - 4);

      lines.push(...box(heatmap, width, 'Activity'));
      lines.push('');
      remainingHeight -= (heatmap.length + 2);
  }

  if (remainingHeight > 5 && model.skillStats) {
      const skillsBox = renderSkillStats(model, width - 4);
      lines.push(...box(skillsBox, width, 'Top Skills'));
  }

  while (lines.length < contentHeight - 1) lines.push('');

  lines.push(center(keyHint('Esc', 'Back') + '  ' + keyHint('R', 'Refresh'), width));

  return lines.join('\n');
}

function renderSolvedStats(model: StatsScreenModel, width: number): string[] {
  const stats = model.stats!;
  const easy = stats.acSubmissionNum.find(s => s.difficulty === 'Easy')?.count || 0;
  const medium = stats.acSubmissionNum.find(s => s.difficulty === 'Medium')?.count || 0;
  const hard = stats.acSubmissionNum.find(s => s.difficulty === 'Hard')?.count || 0;

  const total = easy + medium + hard;
  const barWidth = Math.min(30, width - 20);

  const row = (label: string, count: number, color: string) => {

    return `${chalk.hex(color)(label.padEnd(8))} ${chalk.bold(count.toString())}`;
  };

  return [
    row('Total:', total, colors.primary),
    row('Easy:', easy, colors.success),
    row('Medium:', medium, colors.warning),
    row('Hard:', hard, colors.error)
  ];
}

function renderSkillStats(model: StatsScreenModel, width: number): string[] {
    const skills = model.skillStats!;
    
    const all = [...skills.advanced, ...skills.intermediate, ...skills.fundamental]
      .sort((a,b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 10);

    const tags = all.map(s => `${s.tagName} (${s.problemsSolved})`).join(' • ');
    return [truncate(tags, width - 4)];
}

function renderLoading(width: number, height: number): string {
    const lines = [];
    const mid = Math.floor(height/2);
    for(let i=0;i<mid;i++) lines.push('');
    lines.push(center(chalk.hex(colors.primary)('Loading stats...'), width));
    while(lines.length < height) lines.push('');
    return lines.join('\n');
}

function renderError(err: string, width: number, height: number): string {
    const lines = [];
    const mid = Math.floor(height/2);
    for(let i=0;i<mid;i++) lines.push('');
    lines.push(center(chalk.hex(colors.error)(`Error: ${err}`), width));
    while(lines.length < height) lines.push('');
    return lines.join('\n');
}
