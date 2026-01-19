import chalk from 'chalk';

interface CalendarData {
  [timestamp: string]: number;
}

interface TagStat {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function renderHeatmap(calendarJson: string): void {
  const data: CalendarData = JSON.parse(calendarJson);
  const now = new Date();
  const weeks: { start: string; end: string; count: number; days: number }[] = [];

  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay());

    let weekCount = 0;
    let activeDays = 0;

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      if (day > now) break;

      const midnight = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
      const timestamp = Math.floor(midnight.getTime() / 1000).toString();
      const count = data[timestamp] || 0;
      weekCount += count;
      if (count > 0) activeDays++;
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    weeks.push({
      start: `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}`,
      end: `${MONTH_NAMES[weekEnd.getMonth()]} ${weekEnd.getDate()}`,
      count: weekCount,
      days: activeDays,
    });
  }

  const totalSubmissions = weeks.reduce((sum, w) => sum + w.count, 0);
  const totalActiveDays = weeks.reduce((sum, w) => sum + w.days, 0);

  console.log();
  console.log(chalk.bold('📅 Activity (Last 12 Weeks)'));
  console.log(chalk.gray('How many problems you submitted and days you practiced.'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  for (const week of weeks) {
    const weekLabel = `${week.start} - ${week.end}`.padEnd(18);
    const bar =
      week.count > 0
        ? chalk.green('█'.repeat(Math.min(week.count, 10))).padEnd(10)
        : chalk.gray('·').padEnd(10);
    const countStr = week.count > 0 ? `${week.count} subs`.padEnd(10) : ''.padEnd(10);
    const daysStr = week.days > 0 ? `${week.days}d active` : '';

    console.log(
      `  ${chalk.white(weekLabel)} ${bar} ${chalk.cyan(countStr)} ${chalk.yellow(daysStr)}`
    );
  }

  console.log(chalk.gray('─'.repeat(50)));
  console.log(
    `  ${chalk.bold.white('Total:')} ${chalk.cyan.bold(totalSubmissions + ' submissions')}, ${chalk.yellow.bold(totalActiveDays + ' days active')}`
  );
  console.log();
}

export function renderSkillStats(
  fundamental: TagStat[],
  intermediate: TagStat[],
  advanced: TagStat[]
): void {
  console.log();
  console.log(chalk.bold('🎯 Skill Breakdown'));
  console.log(chalk.gray('─'.repeat(45)));

  const renderSection = (title: string, stats: TagStat[], color: typeof chalk.green) => {
    if (stats.length === 0) return;

    console.log();
    console.log(color.bold(`  ${title}`));

    const sorted = [...stats].sort((a, b) => b.problemsSolved - a.problemsSolved);

    for (const stat of sorted.slice(0, 8)) {
      const name = stat.tagName.padEnd(22);
      const bar = color('█'.repeat(Math.min(stat.problemsSolved, 15)));
      console.log(`    ${chalk.white(name)} ${bar} ${chalk.white(stat.problemsSolved)}`);
    }
  };

  renderSection('Fundamental', fundamental, chalk.green);
  renderSection('Intermediate', intermediate, chalk.yellow);
  renderSection('Advanced', advanced, chalk.red);

  console.log();
}

export function renderTrendChart(calendarJson: string): void {
  const data: CalendarData = JSON.parse(calendarJson);
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days: { label: string; count: number }[] = [];

  for (let d = 6; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);

    const midnight = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
    const timestamp = Math.floor(midnight.getTime() / 1000).toString();

    days.push({
      label: dayNames[day.getDay()],
      count: data[timestamp] || 0,
    });
  }

  const maxVal = Math.max(...days.map((d) => d.count), 1);
  const chartHeight = 6;

  console.log();
  console.log(chalk.bold('📈 Submission Trend (Last 7 Days)'));
  console.log(chalk.gray('─'.repeat(35)));
  console.log();

  // Build vertical bar chart row by row
  for (let row = chartHeight; row >= 1; row--) {
    let line = `  ${row === chartHeight ? maxVal.toString().padStart(2) : '  '} │`;

    for (const day of days) {
      const barHeight = Math.round((day.count / maxVal) * chartHeight);
      if (barHeight >= row) {
        line += chalk.green(' ██ ');
      } else {
        line += '    ';
      }
    }
    console.log(line);
  }

  // X-axis
  console.log(`   0 └${'────'.repeat(7)}`);
  console.log(`       ${days.map((d) => d.label.padEnd(4)).join('')}`);

  // Counts
  console.log(chalk.gray(`       ${days.map((d) => d.count.toString().padEnd(4)).join('')}`));

  const total = days.reduce((a, b) => a + b.count, 0);
  console.log();
  console.log(chalk.white(`  Total: ${total} submissions this week`));
  console.log();
}
