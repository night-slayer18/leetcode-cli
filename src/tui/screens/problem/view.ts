import chalk from 'chalk';
import type { ProblemScreenModel, ProblemDrawerMode } from '../../types.js';
import { colors } from '../../theme.js';
import {
  center,
  difficultyBadge,
  horizontalLine,
  keyHint,
  renderSectionHeader,
  stripAnsi,
  truncate,
  wrapLines,
} from '../../lib/layout.js';
import { computeProblemViewport } from './layout.js';

export function view(model: ProblemScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const safeWidth = Math.max(30, width);
  const safeHeight = Math.max(10, height);

  if (model.loading) {
    return renderCenterMessage('Loading problem details...', safeWidth, safeHeight, colors.primary);
  }
  if (model.error && !model.detail) {
    return renderCenterMessage(`Error: ${model.error}`, safeWidth, safeHeight, colors.error);
  }
  if (!model.detail) {
    return renderCenterMessage('Problem detail not found', safeWidth, safeHeight, colors.error);
  }

  const titleBadge = chalk.bgHex(colors.bgHighlight).hex(colors.textMuted)(
    ` ${model.detail.questionFrontendId} `
  );
  const title = chalk.hex(colors.textBright).bold(` ${model.detail.title} `);
  const diff = difficultyBadge(model.detail.difficulty);
  const bookmarked = model.isBookmarked ? chalk.hex(colors.warning)(' ★') : '';
  const tags = (model.detail.topicTags || [])
    .map((tag: any) => chalk.hex(colors.info)(`#${tag.name}`))
    .join(' ');

  lines.push(center(`${titleBadge}${title}${diff}${bookmarked}`, safeWidth));
  lines.push(center(truncate(tags, safeWidth), safeWidth));
  lines.push(chalk.hex(colors.textMuted)(horizontalLine(safeWidth)));

  const viewport = computeProblemViewport(safeHeight, model.drawerMode);
  lines.push(...renderProblemBody(model, safeWidth, viewport.bodyHeight));

  if (model.drawerMode !== 'none' && viewport.drawerHeight > 0) {
    lines.push(chalk.hex(colors.border)(horizontalLine(safeWidth)));
    lines.push(...renderDrawer(model, safeWidth, viewport.drawerHeight));
  }

  while (lines.length < safeHeight - 2) lines.push('');
  lines.push(chalk.hex(colors.textMuted)(horizontalLine(safeWidth)));
  lines.push(...renderActionBar(model, safeWidth));

  return lines.slice(0, safeHeight).join('\n');
}

function renderProblemBody(model: ProblemScreenModel, width: number, height: number): string[] {
  const lines: string[] = [];
  const contentWidth = Math.max(12, width - 4);
  const wrapped = wrapLines(model.contentLines, contentWidth);
  const maxScroll = Math.max(0, wrapped.length - height);
  const offset = Math.min(model.scrollOffset, maxScroll);
  const visible = wrapped.slice(offset, offset + height);

  for (const line of visible) {
    lines.push(` ${chalk.hex(colors.text)(line)}`);
  }

  while (lines.length < height) {
    lines.push('');
  }

  return lines;
}

function renderActionBar(model: ProblemScreenModel, width: number): string[] {
  const actionHints =
    width >= 130
      ? [
          keyHint('p', 'Pick'),
          keyHint('t', 'Test'),
          keyHint('s', 'Submit'),
          keyHint('h', 'Hint'),
          keyHint('H', 'Subs'),
          keyHint('V', 'Snaps'),
          keyHint('b', model.isBookmarked ? 'Unbookmark' : 'Bookmark'),
          keyHint('n', 'Note'),
          keyHint('e', 'Edit'),
        ]
      : [
          keyHint('p', 'Pick'),
          keyHint('t', 'Test'),
          keyHint('s', 'Submit'),
          keyHint('h', 'Hint'),
          keyHint('H', 'Subs'),
          keyHint('V', 'Snaps'),
          keyHint('n', 'Note'),
        ];

  const focusHints =
    model.drawerMode === 'none'
      ? [keyHint('Esc', 'Back')]
      : [
          keyHint('Tab', `Focus ${model.focusRegion === 'body' ? 'Drawer' : 'Body'}`),
          keyHint('Esc', 'Close Drawer'),
        ];

  const line = [...actionHints, ...focusHints].join('  ');
  return [center(truncate(line, Math.max(20, width - 2)), width)];
}

function renderDrawer(model: ProblemScreenModel, width: number, height: number): string[] {
  const mode = model.drawerMode;

  if (mode === 'snapshots') {
    return renderSnapshotsDrawer(model, width, height);
  }

  const title = drawerTitle(model);
  const hints = drawerHints(mode);
  const rows = getDrawerRows(model, mode, width);
  const available = Math.max(1, height - 2);
  const maxScroll = Math.max(0, rows.length - available);
  const offset = Math.min(model.drawerScrollOffset, maxScroll);
  const visible = rows.slice(offset, offset + available);

  const lines: string[] = [
    renderSectionHeader(
      model.focusRegion === 'drawer' ? `${title} • Focused` : title,
      width
    ),
  ];

  lines.push(...visible.map((line) => truncate(line, width)));
  while (lines.length < height - 1) lines.push('');
  lines.push(chalk.hex(colors.textMuted)(truncate(hints, width)));

  return lines.slice(0, height);
}

function renderSnapshotsDrawer(model: ProblemScreenModel, width: number, height: number): string[] {
  const title = model.focusRegion === 'drawer' ? 'Snapshots • Focused' : 'Snapshots';
  const lines: string[] = [renderSectionHeader(title, width)];

  if (!model.snapshotsList || model.snapshotsList.length === 0) {
    lines.push(chalk.hex(colors.warning)('No snapshots saved.'));
    lines.push(chalk.hex(colors.textMuted)('Create snapshots from your solution workflow.'));
  } else {
    const rowHeight = Math.max(1, height - 2);
    const pageStart = Math.floor(model.snapshotCursor / rowHeight) * rowHeight;
    const pageRows = model.snapshotsList.slice(pageStart, pageStart + rowHeight);

    for (let i = 0; i < pageRows.length; i++) {
      const snap = pageRows[i];
      const index = pageStart + i;
      const selected = index === model.snapshotCursor;
      const pointer = selected ? chalk.hex(colors.primary)('▶') : ' ';
      const name = truncate(snap.name, 20).padEnd(20);
      const lang = truncate(snap.language, 10).padEnd(10);
      const row = `${pointer} ${String(snap.id).padStart(3)} ${name} ${lang} ${String(snap.lines).padStart(4)}L`;
      lines.push(selected ? chalk.bgHex(colors.bgHighlight)(truncate(row, width).padEnd(Math.max(0, width - 1))) : row);
    }
  }

  while (lines.length < height - 1) lines.push('');
  lines.push(chalk.hex(colors.textMuted)(truncate(`${keyHint('j/k', 'Move')}  ${keyHint('d/r', 'Diff/Restore')}  ${keyHint('V/Esc', 'Close')}`, width)));

  return lines.slice(0, height);
}

function getDrawerRows(model: ProblemScreenModel, mode: ProblemDrawerMode, width: number): string[] {
  const contentWidth = Math.max(10, width - 2);

  switch (mode) {
    case 'hint': {
      const hints = model.detail?.hints || [];
      const index = model.activeHintIndex ?? 0;
      const raw = hints[index] ?? 'No hints available';
      const clean = sanitize(raw);
      const header = chalk.hex(colors.primary).bold(`Hint ${index + 1}/${Math.max(1, hints.length)}`);
      return [header, ...wrapLines([clean || 'No hint content'], contentWidth)];
    }

    case 'submissions': {
      if (model.submissionsLoading) {
        return [chalk.hex(colors.primary)('Loading submissions...')];
      }
      if (!model.submissionsHistory || model.submissionsHistory.length === 0) {
        return [
          chalk.hex(colors.warning)('No submissions found for this problem.'),
          chalk.hex(colors.textMuted)('Use [s] Submit after picking a solution.'),
        ];
      }

      return model.submissionsHistory.map((entry) => {
        const statusColor = entry.statusDisplay === 'Accepted' ? colors.success : colors.error;
        const status = chalk.hex(statusColor)(truncate(entry.statusDisplay, 12).padEnd(12));
        const runtime = chalk.hex(colors.cyan)(truncate(entry.runtime || '-', 8).padEnd(8));
        const memory = chalk.hex(colors.textMuted)(truncate(entry.memory || '-', 8).padEnd(8));
        const lang = chalk.hex(colors.info)(truncate(entry.lang || '-', 8).padEnd(8));
        return `${status} ${runtime} ${memory} ${lang}`;
      });
    }

    case 'note':
      return wrapLines(formatNotePreview(model.noteContent || 'No notes found. Press e to edit.'), contentWidth);

    case 'diff': {
      const content = model.diffContent || 'No diff available.';
      return content.split('\n').map((line) => colorizeDiff(line));
    }

    case 'testResult': {
      const result = model.testResult;
      if (!result) return ['No test result available.'];
      if (result.compile_error) {
        return [
          chalk.hex(colors.error).bold('Compile Error'),
          ...wrapLines([result.compile_error], contentWidth),
        ];
      }
      if (result.runtime_error) {
        return [
          chalk.hex(colors.error).bold('Runtime Error'),
          ...wrapLines([result.runtime_error], contentWidth),
        ];
      }
      if (result.correct_answer) return [chalk.hex(colors.success).bold('All test cases passed')];
      return [chalk.hex(colors.warning).bold('Wrong answer')];
    }

    case 'submitResult': {
      const result = model.submissionResult;
      if (!result) return ['No submission result available.'];
      const accepted = result.status_msg === 'Accepted';
      const rows = [
        accepted
          ? chalk.hex(colors.success).bold(result.status_msg)
          : chalk.hex(colors.error).bold(result.status_msg),
        chalk.hex(colors.cyan)(`Runtime: ${result.status_runtime || '-'}`),
        chalk.hex(colors.textMuted)(`Memory: ${result.status_memory || '-'}`),
      ];
      if (result.runtime_error) {
        rows.push(...wrapLines([result.runtime_error], contentWidth));
      }
      return rows;
    }

    case 'status': {
      const message =
        model.drawerData.statusMessage ||
        model.successMessage ||
        model.error ||
        (model.isRunning ? 'Working...' : 'Ready');
      const color =
        model.error
          ? colors.error
          : model.successMessage
            ? colors.success
            : model.isRunning
              ? colors.primary
              : colors.textMuted;
      return wrapLines([message], contentWidth).map((line) => chalk.hex(color)(line));
    }

    default:
      return [];
  }
}

function drawerTitle(model: ProblemScreenModel): string {
  switch (model.drawerMode) {
    case 'hint':
      return 'Hints';
    case 'submissions':
      return 'Submissions';
    case 'snapshots':
      return 'Snapshots';
    case 'note':
      return 'Notes';
    case 'diff':
      return 'Diff';
    case 'testResult':
      return 'Test Result';
    case 'submitResult':
      return 'Submission Result';
    case 'status':
      return resolveStatusTitle(model);
    default:
      return 'Drawer';
  }
}

function drawerHints(mode: ProblemDrawerMode): string {
  switch (mode) {
    case 'hint':
      return `${keyHint('←/→', 'Prev/Next')}  ${keyHint('j/k', 'Scroll')}  ${keyHint('h/Esc', 'Close')}`;
    case 'submissions':
      return `${keyHint('j/k', 'Scroll')}  ${keyHint('H/Esc', 'Close')}`;
    case 'snapshots':
      return `${keyHint('j/k', 'Move')}  ${keyHint('d/r', 'Diff/Restore')}  ${keyHint('V/Esc', 'Close')}`;
    case 'note':
      return `${keyHint('j/k', 'Scroll')}  ${keyHint('e', 'Edit')}  ${keyHint('n/Esc', 'Close')}`;
    case 'diff':
      return `${keyHint('j/k', 'Scroll')}  ${keyHint('d/Esc', 'Close')}`;
    default:
      return `${keyHint('Esc', 'Close')}`;
  }
}

function resolveStatusTitle(model: ProblemScreenModel): string {
  const message =
    model.drawerData.statusMessage ||
    model.successMessage ||
    model.error ||
    (model.isRunning ? 'Working...' : 'Ready');

  const text = message.toLowerCase();
  if (text.includes('running tests')) return 'Testing';
  if (text.includes('submitting')) return 'Submitting';
  if (text.includes('bookmark')) return 'Bookmark';
  if (text.includes('error')) return 'Error';
  return 'Status';
}

function colorizeDiff(line: string): string {
  if (line.startsWith('[green]')) return chalk.green(line.slice(7));
  if (line.startsWith('[red]')) return chalk.red(line.slice(5));
  if (line.startsWith('[grey]')) return chalk.gray(line.slice(6));
  if (line.startsWith('+')) return chalk.green(line);
  if (line.startsWith('-')) return chalk.red(line);
  return line;
}

function sanitize(raw: string): string {
  return stripAnsi(raw)
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNotePreview(content: string): string[] {
  const rawLines = content.split('\n');
  const lines: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      continue;
    }

    if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) continue;

    let line = rawLine
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');

    if (line.startsWith('## ')) {
      line = `${chalk.hex(colors.primary).bold('•')} ${line.slice(3)}`;
    } else if (line.startsWith('# ')) {
      line = chalk.hex(colors.primary).bold(line.slice(2));
    }

    lines.push(line);
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.length > 0 ? lines : ['No notes found. Press e to edit.'];
}

function renderCenterMessage(message: string, width: number, height: number, color: string): string {
  const lines: string[] = [];
  const top = Math.max(0, Math.floor(height / 2) - 1);
  for (let i = 0; i < top; i++) lines.push('');
  lines.push(center(chalk.hex(color)(message), width));
  while (lines.length < height) lines.push('');
  return lines.join('\n');
}
