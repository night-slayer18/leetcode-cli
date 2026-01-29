

import chalk from 'chalk';
import type { ProblemScreenModel } from '../../types.js';
import { colors, borders, icons } from '../../theme.js';
import { 
    box, 
    renderModal, 
    center, 
    wrapLines, 
    stripAnsi, 
    keyHint, 
    horizontalLine,
    visibleLength,
    difficultyBadge,
    truncate
} from '../../lib/layout.js';
import { visualizeTestOutput } from '../../../utils/visualize.js';

export function view(model: ProblemScreenModel, width: number, height: number): string {
  const lines: string[] = [];
  const contentHeight = height - 4;

  if (model.loading) {
    return renderLoading(width, contentHeight);
  }

  if (model.error && !model.detail) {
    return renderError(model.error, width, contentHeight);
  }

  if (!model.detail) {
    return renderError('Problem detail not found', width, contentHeight);
  }

  const detail = model.detail;

  lines.push('');

  const idBadge = chalk.bgHex(colors.bgHighlight).hex(colors.textMuted)(` ${model.detail.questionFrontendId} `);
  const title = chalk.hex(colors.textBright).bold(` ${model.detail.title} `);
  const diffBadge = difficultyBadge(model.detail.difficulty);
  const bookmarkIcon = model.isBookmarked ? chalk.hex(colors.warning)(' ★') : '';
  
  lines.push(center(`${idBadge}${title}${diffBadge}${bookmarkIcon}`, width));
  lines.push('');

  const tags = (model.detail.topicTags || []).map((t: any) => chalk.hex(colors.info)(`#${t.name}`)).join(' ');
  
  const stats = chalk.hex(colors.textMuted)(`Difficulty: ${model.detail.difficulty}`);
  
  lines.push(center(`${tags}`, width));
  lines.push(center(`${stats}`, width));
  lines.push(center(horizontalLine(width - 4), width));
  lines.push('');

  const headerUsed = lines.length; 
  const footerHeight = 2;
  const viewportHeight = contentHeight - headerUsed - footerHeight;

  const wrappedLines = wrapLines(model.contentLines, width - 8);
  
  const visibleLines = wrappedLines.slice(
    model.scrollOffset, 
    model.scrollOffset + viewportHeight
  );
  
  for (const line of visibleLines) {
    lines.push('    ' + chalk.hex(colors.text)(line));
  }

  const canScrollUp = model.scrollOffset > 0;
  const canScrollDown = model.scrollOffset + viewportHeight < wrappedLines.length;

  while (lines.length < contentHeight - footerHeight) {
    lines.push('');
  }

  lines.push(center(horizontalLine(width), width));
  
  const scrollInfo = `Scroll: ${Math.round((model.scrollOffset / Math.max(1, wrappedLines.length)) * 100)}%`;
  
  lines.push(center(
    `${keyHint('p', 'Pick')}  ${keyHint('t', 'Test')}  ${keyHint('s', 'Submit')}  ${keyHint('h', 'Hint')}  ${keyHint('H', 'Subs')}  ${keyHint('V', 'Snaps')}  ${keyHint('b', model.isBookmarked ? 'Unbookmark' : 'Bookmark')}  ${keyHint('n', 'Note')}  ${chalk.hex(colors.textMuted)(scrollInfo)}`, 
    width
  ));

  if (model.isRunning) {
      const content = [
          center('Running Code...', width - 8),
          center('Please wait', width - 8)
      ];
      return renderModal(lines, content, width, height, {
          title: 'Processing',
          borderColor: colors.primary,
          padding: 2, 
          borderStyle: 'round'
      });
  }

  if (model.testResult) {
      return renderTestResult(lines, model.testResult, model.detail?.topicTags || [], width, height);
  }

  if (model.submissionResult) {
      return renderSubmissionResult(lines, model.submissionResult, width, height);
  }

  if (model.successMessage) {
      const content = [
          center(chalk.hex(colors.success).bold(model.successMessage), width - 8),
          '',
          center(keyHint('Esc', 'Close'), width - 8),
      ];
      return renderModal(lines, content, width, height, {
          title: 'Success',
          borderColor: colors.success,
          padding: 2,
          borderStyle: 'round'
      });
  }

  if (model.activeHintIndex !== null && model.detail?.hints) {
      return renderHintOverlay(lines, model.detail.hints, model.activeHintIndex, model.hintScrollOffset, width, height);
  }

  if (model.error && model.detail) {
      return renderErrorOverlay(lines, model.error, width, height);
  }

  if (model.showSubmissions) {
      return renderSubmissionsOverlay(lines, model, width, height);
  }

  if (model.showDiff && model.diffContent) {
      return renderDiffOverlay(lines, model.diffContent, model.diffScrollOffset, width, height);
  }

  if (model.showSnapshots) {
      return renderSnapshotsOverlay(lines, model, width, height);
  }

  if (model.currentNote !== null) {
      return renderNoteOverlay(lines, model.currentNote, model.noteScrollOffset, width, height);
  }
  return lines.join('\n');
}

function renderHintOverlay(base: string[], hints: string[], index: number, scrollOffset: number, width: number, height: number): string {
    const hint = hints[index];
    const cleanHint = hint 
        ? stripAnsi(hint)
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

    const modalWidth = Math.max(50, Math.min(80, Math.floor(width * 0.7)));
    const contentWidth = modalWidth - 4; 

    const wrapped = wrapLines([cleanHint || 'No content'], contentWidth);

    const maxContentHeight = Math.floor(height * 0.6);
    const totalLines = wrapped.length;
    const viewHeight = Math.min(maxContentHeight, Math.max(5, totalLines)); 
    
    const visibleLines = wrapped.slice(scrollOffset, scrollOffset + viewHeight);

    const content: string[] = [];

    if (visibleLines.length === 0) {
        content.push(chalk.gray('No content'));
    } else {
        visibleLines.forEach(line => content.push(chalk.hex(colors.text)(line)));
    }

    if (totalLines > viewHeight) {
        const canScrollUp = scrollOffset > 0;
        const canScrollDown = scrollOffset + viewHeight < totalLines;

        let scrollStatus = '';
        if (canScrollUp) scrollStatus += '↑ More  ';
        scrollStatus += `${scrollOffset + 1}-${Math.min(scrollOffset + viewHeight, totalLines)} of ${totalLines}`;
        if (canScrollDown) scrollStatus += '  ↓ More';
        
        content.push('');
        content.push(center(chalk.hex(colors.textMuted)(scrollStatus), contentWidth));
    }

    const controls = [];
    if (index > 0) controls.push(keyHint('←', 'Prev'));
    if (index < hints.length - 1) controls.push(keyHint('→', 'Next'));
    controls.push(keyHint('j/k', 'Scroll'));
    controls.push(keyHint('h', 'Close'));
    
    content.push('');
    content.push(center(horizontalLine(contentWidth), contentWidth));
    content.push(center(controls.join('  '), contentWidth));

    return renderModal(base, content, width, height, {
        title: `Hint ${index + 1}/${hints.length}`, 
        borderColor: colors.warning, 
        padding: 1,
        borderStyle: 'round'
    });
}

function renderTestResult(base: string[], result: import('../../types.js').TestResult, tags: {name: string}[], width: number, height: number): string {
    const content: string[] = [];

    const isSuccess = result.run_success && result.correct_answer;
    const isError = !result.run_success;

    const themeColor = isError ? colors.error : (isSuccess ? colors.success : colors.warning);

    content.push('');
    if (result.compile_error) {
         content.push(center(chalk.hex(colors.error).bold('❌ Compile Error'), 60));
    } else if (result.runtime_error) {
         content.push(center(chalk.hex(colors.error).bold('⚠ Runtime Error'), 60));
    } else if (result.correct_answer) {
         content.push(center(chalk.hex(colors.success).bold('✔ All Test Cases Passed'), 60));
    } else {
         content.push(center(chalk.hex(colors.warning).bold('✗ Wrong Answer'), 60));
    }
    content.push('');
    
    const wrap = (str: string, w: number) => wrapLines([str], w);
    const contentW = 70; 

    if (result.compile_error || result.runtime_error) {
         const err = result.compile_error || result.runtime_error || 'Unknown error';
         content.push(...wrap(chalk.red(err), contentW));
    } else {
        
        const outputs = result.code_answer || [];
        const expected = result.expected_code_answer || [];

        const limit = 3; 
        let shown = 0;
        
        for(let i=0; i<outputs.length && shown < limit; i++) {
             const out = outputs[i];
             const exp = expected[i];
             const passed = out === exp;
             
             if (isSuccess && i > 0) continue; 
             
             shown++;
             content.push(chalk.hex(colors.textMuted)(`Case ${i+1}:`) + (passed ? chalk.green(' Passed') : chalk.red(' Failed')));

             try {
                const vis = visualizeTestOutput(out, exp, tags);
                
                content.push(chalk.hex(colors.primary)('  Your Output:'));
                vis.outputVis.split('\n').forEach(l => content.push('    ' + l));
                
                content.push(chalk.hex(colors.textMuted)('  Expected:'));
                vis.expectedVis.split('\n').forEach(l => content.push('    ' + l));
                
             } catch (e) {
                 
                 content.push(`  Your: ${out}`);
                 content.push(`  Exp:  ${exp}`);
             }
             content.push(chalk.hex(colors.textMuted)('─'.repeat(contentW)));
        }
        
        if (outputs.length > limit) {
             content.push(center(chalk.gray(`... ${outputs.length - limit} more cases ...`), contentW));
        }
    }

    content.push('');
    content.push(center(keyHint('Esc', 'Close'), contentW));

    return renderModal(base, content, width, height, {
        title: 'Test Result',
        borderColor: themeColor,
        padding: 1,
        borderStyle: 'round'
    });
}

function renderSubmissionResult(base: string[], result: import('../../types.js').SubmissionResult, width: number, height: number): string {
    const content: string[] = [];

    const isSuccess = result.status_msg === 'Accepted';
    const themeColor = isSuccess ? colors.success : colors.error;
    const icon = isSuccess ? icons.check : icons.cross;
    
    content.push('');
    content.push(center(chalk.hex(themeColor).bold(`${icon} ${result.status_msg}`), 60));
    content.push('');
    
    const wrap = (str: string, w: number) => wrapLines([str], w);
    const contentW = 70;

    if (isSuccess) {
        
        content.push(center(chalk.cyan(`Runtime: ${result.status_runtime}`), contentW));
        content.push(center(chalk.hex(colors.textMuted)(`Beats ${result.runtime_percentile.toFixed(2)}% of users`), contentW));
        content.push('');
        content.push(center(chalk.magenta(`Memory: ${result.status_memory}`), contentW));
        content.push(center(chalk.hex(colors.textMuted)(`Beats ${result.memory_percentile.toFixed(2)}% of users`), contentW));
        
    } else {
         if (result.last_testcase) {
             content.push(chalk.hex(colors.textMuted)(`Last Input:`));
             content.push(chalk.white(truncate(result.last_testcase, contentW)));
             content.push('');
         }
         
         if (result.expected_output) {
             content.push(chalk.hex(colors.text)(`Expected: `) + chalk.hex(colors.success)(truncate(result.expected_output, contentW - 10)));
         }
         if (result.code_output) {
             content.push(chalk.hex(colors.text)(`Output:   `) + chalk.hex(colors.error)(truncate(result.code_output, contentW - 10)));
         }
         
         if (result.runtime_error) {
             content.push('');
             content.push(chalk.red('Runtime Error:'));
             content.push(...wrap(result.runtime_error, contentW));
         }
    }
    
    content.push('');
    content.push(center(keyHint('Esc', 'Close'), contentW));

    return renderModal(base, content, width, height, {
        title: 'Submission Result',
        borderColor: themeColor,
        padding: 1,
        borderStyle: 'round'
    });
}

function renderSubmissionsOverlay(base: string[], model: ProblemScreenModel, width: number, height: number): string {
    const content: string[] = [];
    const contentW = Math.min(75, width - 6);

    if (model.submissionsLoading) {
        content.push('');
        content.push(center('Loading submissions...', contentW));
        content.push('');
    } else if (!model.submissionsHistory || model.submissionsHistory.length === 0) {
        content.push('');
        content.push(center(chalk.yellow('No submissions found'), contentW));
        content.push('');
    } else {
        
        const header = `  ${'Status'.padEnd(12)} ${'Runtime'.padEnd(10)} ${'Memory'.padEnd(10)} ${'Language'.padEnd(12)} ${'Time'.padEnd(15)}`;
        content.push(chalk.hex(colors.textMuted)(header));
        content.push(center(horizontalLine(contentW), contentW));

        const pageSize = 10;
        const offset = model.submissionScrollOffset || 0;
        const total = model.submissionsHistory.length;
        
        const toShow = model.submissionsHistory.slice(offset, offset + pageSize);
        for (const sub of toShow) {
            const statusColor = sub.statusDisplay === 'Accepted' ? colors.success : colors.error;
            const status = chalk.hex(statusColor)(sub.statusDisplay.padEnd(12));
            const runtime = chalk.hex(colors.cyan)((sub.runtime || '-').padEnd(10));
            const memory = chalk.hex(colors.textMuted)((sub.memory || '-').padEnd(10));
            const lang = chalk.hex(colors.info)(sub.lang.padEnd(12));
            const time = formatTimeAgo(sub.timestamp);
            content.push(`  ${status} ${runtime} ${memory} ${lang} ${chalk.hex(colors.textMuted)(time)}`);
        }

        const canScrollDown = offset + pageSize < total;
        if (canScrollDown) {
            content.push('');
            content.push(center(chalk.hex(colors.warning)(`↓ ${total - (offset + pageSize)} more`), contentW));
        } else {
             
             for(let i=0; i<pageSize - toShow.length; i++) content.push('');
        }
    }

    content.push('');
    content.push(center(horizontalLine(contentW), contentW));
    
    const hints = [];
    if (!model.submissionsLoading && model.submissionsHistory && model.submissionsHistory.length > 10) {
        hints.push(keyHint('j/k', 'Scroll'));
    }
    hints.push(keyHint('H', 'Close'));
    hints.push(keyHint('Esc', 'Back'));
    
    content.push(center(hints.join('  '), contentW));

    return renderModal(base, content, width, height, {
        title: 'Submission History',
        borderColor: colors.primary,
        padding: 1,
        borderStyle: 'double'
    });
}

function formatTimeAgo(timestamp: string): string {
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function renderSnapshotsOverlay(base: string[], model: ProblemScreenModel, width: number, height: number): string {
    const content: string[] = [];
    const contentW = Math.min(80, width - 6);

    if (!model.snapshotsList || model.snapshotsList.length === 0) {
        content.push('');
        content.push(center(chalk.yellow('No snapshots saved'), contentW));
        content.push('');
        content.push(center(chalk.hex(colors.textMuted)('Save snapshots from CLI:'), contentW));
        content.push(center(chalk.hex(colors.info)('leet snapshot save <id>'), contentW));
        content.push('');
    } else {
        
        const header = `  ${'ID'.padEnd(4)} ${'Name'.padEnd(20)} ${'Lang'.padEnd(10)} ${'Lines'.padEnd(6)} ${'Created'.padEnd(15)}`;
        content.push(chalk.hex(colors.textMuted)(header));
        content.push(center(horizontalLine(contentW), contentW));

        const pageSize = 8;
        const pageStart = Math.floor(model.snapshotCursor / pageSize) * pageSize;
        const toShow = model.snapshotsList.slice(pageStart, pageStart + pageSize);
        
        toShow.forEach((snap, idx) => {
            const absoluteIndex = pageStart + idx;
            const isSelected = absoluteIndex === model.snapshotCursor;

            const pointer = isSelected ? chalk.hex(colors.primary)('>') : ' ';
            const bgFn = isSelected ? (s: string) => chalk.bgHex(colors.bgHighlight)(s) : (s: string) => s;
            
            const id = (String(snap.id).padEnd(4));
            const name = (snap.name.slice(0, 18).padEnd(20));
            const lang = (snap.language.padEnd(10));
            const lines = (String(snap.lines).padEnd(6));
            const created = formatTimeAgo(String(new Date(snap.createdAt).getTime() / 1000));
            
            const row = `${id} ${name} ${lang} ${lines} ${created}`;
            content.push(bgFn(`${pointer} ${row}`));
        });

        const fill = pageSize - toShow.length;
        for(let i=0; i<fill; i++) content.push('');

        if (model.snapshotsList.length > pageSize) {
            const pageInfo = `Page ${Math.floor(pageStart/pageSize) + 1}/${Math.ceil(model.snapshotsList.length/pageSize)}`;
            content.push('');
            content.push(center(chalk.hex(colors.textMuted)(pageInfo), contentW));
        }
    }
    
    content.push('');
    content.push(center(horizontalLine(contentW), contentW));
        
    const hints = [
        keyHint('j/k', 'Nav'),
        keyHint('d', 'Diff'), 
        keyHint('r', 'Restore'),
        keyHint('V/Esc', 'Close')
    ];
    content.push(center(hints.join('  '), contentW));

    return renderModal(base, content, width, height, {
        title: 'Snapshots',
        borderColor: colors.info,
        padding: 1,
        borderStyle: 'round'
    });
}

function renderLoading(width: number, height: number): string {
  const lines: string[] = [];
  const midY = Math.floor(height / 2);
  for (let i = 0; i < midY - 1; i++) lines.push('');
  lines.push(center(chalk.hex(colors.primary)('Loading problem details...'), width));
  while (lines.length < height) lines.push('');
  return lines.join('\n');
}

function renderError(error: string, width: number, height: number): string {
  const lines: string[] = [];
  const midY = Math.floor(height / 2);
  for (let i = 0; i < midY - 1; i++) lines.push('');
  lines.push(center(chalk.hex(colors.error)(`Error: ${error}`), width));
  while (lines.length < height) lines.push('');
  return lines.join('\n');
}

function renderNoteOverlay(base: string[], content: string, scrollOffset: number, width: number, height: number): string {
    const overlayContent: string[] = [];
    const contentW = Math.min(80, width - 6);

    const wrapped = wrapLines(content.split('\n'), contentW);
    const maxLines = Math.floor(height * 0.6);

    const displayLines = wrapped.slice(scrollOffset, scrollOffset + maxLines);

    for (const line of displayLines) {
        overlayContent.push('   ' + chalk.hex(colors.text)(line));
    }

    const padding = Math.max(0, maxLines - displayLines.length);
    for (let i = 0; i < padding; i++) overlayContent.push('');

    const canScrollUp = scrollOffset > 0;
    const canScrollDown = scrollOffset + maxLines < wrapped.length;
    
    if (canScrollDown) {
        overlayContent.push('');
        overlayContent.push(center(chalk.hex(colors.warning)(`↓ ${wrapped.length - (scrollOffset + maxLines)} more lines`), contentW));
    } else {
        overlayContent.push('');
        overlayContent.push(' ');
    }
    
    overlayContent.push('');
    overlayContent.push(center(horizontalLine(contentW), contentW));
    
    const navHints = [];
    if (canScrollUp || canScrollDown) navHints.push(keyHint('j/k', 'Scroll'));
    navHints.push(keyHint('n', 'Edit/Close'));
    navHints.push(keyHint('Esc', 'Close'));
    
    overlayContent.push(center(navHints.join('  '), contentW));

    return renderModal(base, overlayContent, width, height, {
        title: 'Problem Notes',
        borderColor: colors.warning,
        padding: 1,
        borderStyle: 'double'
    });
}

function renderDiffOverlay(base: string[], content: string, scrollOffset: number, width: number, height: number): string {
    const overlayContent: string[] = [];
    const contentW = Math.min(95, width - 6);

    const lines = content.split('\n');
    const maxLines = Math.floor(height * 0.7);
    
    const displayLines = lines.slice(scrollOffset, scrollOffset + maxLines);

    for (const line of displayLines) {
        let coloredLine = line;
        if (line.startsWith('[green]')) coloredLine = chalk.green(line.slice(7));
        else if (line.startsWith('[red]')) coloredLine = chalk.red(line.slice(5));
        else if (line.startsWith('[grey]')) coloredLine = chalk.gray(line.slice(6));
        
        overlayContent.push('   ' + coloredLine);
    }
    
    const canScrollDown = scrollOffset + maxLines < lines.length;

    if (canScrollDown) {
        overlayContent.push('');
        overlayContent.push(center(chalk.hex(colors.warning)(`↓ ${lines.length - (scrollOffset + maxLines)} more lines`), contentW));
    }

    overlayContent.push('');
    overlayContent.push(center(horizontalLine(contentW), contentW));
    
    const hints = [];
    if (lines.length > maxLines) hints.push(keyHint('j/k', 'Scroll'));
    hints.push(keyHint('Esc', 'Close'));
    
    overlayContent.push(center(hints.join('  '), contentW));

    return renderModal(base, overlayContent, width, height, {
        title: 'Diff View',
        borderColor: colors.primary,
        padding: 1,
        borderStyle: 'round'
    });
}

function renderErrorOverlay(base: string[], error: string, width: number, height: number): string {
    const contentW = Math.min(60, width - 6);
    const content = [
        ...wrapLines([error], contentW).map(l => center(chalk.hex(colors.text)(l), contentW)),
        '',
        center(horizontalLine(contentW), contentW),
        center(keyHint('Esc', 'Close'), contentW),
    ];
    return renderModal(base, content, width, height, {
        title: '⚠️  Error',
        borderColor: colors.error,
        padding: 2,
        borderStyle: 'round'
    });
}

