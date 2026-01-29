

import chalk from 'chalk';
import type { TimerScreenModel } from '../../types.js';
import { colors, fonts, icons } from '../../theme.js'; 
import { center, keyHint, box } from '../../lib/layout.js';

export function view(model: TimerScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height;

  const headerContent = [
    center(`Solving: ${model.problemTitle}`, width - 4),
    center(`Difficulty: ${model.difficulty}`, width - 4) 
  ];
  lines.push(...box(headerContent, width, 'Timer'));

  lines.push('');

  const minutes = Math.floor(model.remainingSeconds / 60);
  const seconds = model.remainingSeconds % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const bigTimeLines = renderBigTime(timeStr, model.status);
  const timePadding = Math.floor((width - 60) / 2); 
  const centeredTime = bigTimeLines.map(l => ' '.repeat(Math.max(0, timePadding)) + l);

  const remainingHeight = contentHeight - lines.length - 8; 
  const topPad = Math.floor(remainingHeight / 2) - 3;
  
  for(let i=0; i<topPad; i++) lines.push('');
  lines.push(...centeredTime);
  for(let i=0; i<topPad; i++) lines.push('');

  let statusText = '';
  let statusColor = colors.textMuted;
  switch(model.status) {
    case 'running': 
      statusText = ' RUNNING '; 
      statusColor = colors.success; 
      break;
    case 'paused': 
      statusText = ' PAUSED '; 
      statusColor = colors.warning; 
      break;
    case 'idle': 
      statusText = ' READY '; 
      statusColor = colors.primary; 
      break;
    case 'completed': 
      statusText = ' TIME UP! '; 
      statusColor = colors.error; 
      break;
  }
  
  lines.push('');
  lines.push(center(chalk.bgHex(statusColor).black.bold(statusText), width));
  lines.push('');

  while(lines.length < contentHeight - 3) lines.push('');

  let hints = '';
  if (model.status === 'running') {
     hints = keyHint('Space', 'Pause') + '  ' + keyHint('R', 'Reset');
  } else {
     hints = keyHint('Space', 'Start') + '  ' + keyHint('R', 'Reset');
  }
  hints += '  ' + keyHint('Esc', 'Back');
  lines.push(center(hints, width));

  return lines.join('\n');
}

function renderBigTime(time: string, status: 'running' | 'paused' | 'idle' | 'completed'): string[] {
  
  const digits: Record<string, string[]> = {
    '0': ['██████', '██  ██', '██  ██', '██  ██', '██████'],
    '1': ['  ██  ', '  ██  ', '  ██  ', '  ██  ', '  ██  '],
    '2': ['██████', '    ██', '██████', '██    ', '██████'],
    '3': ['██████', '    ██', '██████', '    ██', '██████'],
    '4': ['██  ██', '██  ██', '██████', '    ██', '    ██'],
    '5': ['██████', '██    ', '██████', '    ██', '██████'],
    '6': ['██████', '██    ', '██████', '██  ██', '██████'],
    '7': ['██████', '    ██', '    ██', '    ██', '    ██'],
    '8': ['██████', '██  ██', '██████', '██  ██', '██████'],
    '9': ['██████', '██  ██', '██████', '    ██', '██████'],
    ':': ['      ', '  ██  ', '      ', '  ██  ', '      '],
  };

  const lines = ['', '', '', '', ''];
  const colorFn = status === 'running' ? chalk.hex(colors.success) :
                  status === 'paused' ? chalk.hex(colors.warning) :
                  status === 'completed' ? chalk.hex(colors.error) :
                  chalk.hex(colors.primary);

  for (const char of time) {
    const digit = digits[char] || digits['0'];
    for (let i = 0; i < 5; i++) {
      lines[i] += colorFn(digit[i]) + '  ';
    }
  }
  return lines;
}
