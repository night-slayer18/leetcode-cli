import chalk from 'chalk';

interface CalendarData {
  [timestamp: string]: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function generateHeatmap(calendarJson: string, width: number): string[] {
  try {
    const data: CalendarData = JSON.parse(calendarJson);
    const now = new Date();

    const numWeeks = Math.min(52, Math.floor((width - 10) / 3));
    
    const weeks: { start: string; end: string; count: number; days: number }[] = [];

    for (let w = numWeeks - 1; w >= 0; w--) {
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

    const lines: string[] = [];
    const totalSubmissions = weeks.reduce((sum, w) => sum + w.count, 0);
    const totalActiveDays = weeks.reduce((sum, w) => sum + w.days, 0);
    
    lines.push(chalk.bold(`📅 Activity (Last ${numWeeks} Weeks)`));
    lines.push(chalk.gray('─'.repeat(width)));

    const weeksToShow = weeks.slice(-8); 
    
    for (const week of weeksToShow) {
        const weekLabel = `${week.start} - ${week.end}`.padEnd(18);
        const barChar = '█';
        const bar = week.count > 0
            ? chalk.green(barChar.repeat(Math.min(week.count, 10))).padEnd(10)
            : chalk.gray('·').padEnd(10);
        
        const countStr = week.count > 0 ? `${week.count} subs`.padEnd(10) : ''.padEnd(10);
        const daysStr = week.days > 0 ? `${week.days}d active` : '';
        
        lines.push(`  ${chalk.white(weekLabel)} ${bar} ${chalk.cyan(countStr)} ${chalk.yellow(daysStr)}`);
    }
    
    lines.push(chalk.gray(`Total: ${totalSubmissions} subs, ${totalActiveDays} days`));
    return lines;

  } catch (e) {
    return [chalk.red('Error parsing calendar data')];
  }
}

export function generateTrendChart(calendarJson: string, width: number): string[] {
  try {
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
    const chartHeight = 5;
    const lines: string[] = [];

    lines.push(chalk.bold('📈 Trend (Last 7 Days)'));

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
      lines.push(line);
    }

    lines.push(`   0 └${'────'.repeat(7)}`);
    lines.push(`       ${days.map((d) => d.label.padEnd(4)).join('')}`);
    
    return lines;
  } catch (e) {
    return [chalk.red('Error generating trend')];
  }
}
