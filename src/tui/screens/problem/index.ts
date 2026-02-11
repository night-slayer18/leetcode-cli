import type {
  ProblemScreenModel,
  ProblemMsg,
  Command,
  ProblemDetail,
  ProblemDrawerMode,
} from '../../types.js';
import { Cmd } from '../../types.js';
import { bookmarks } from '../../../storage/bookmarks.js';
import { snapshotStorage } from '../../../storage/snapshots.js';
import { formatProblemContent } from '../../../utils/display.js';
import { stripAnsi, wrapLines } from '../../lib/layout.js';
import { computeProblemViewport } from './layout.js';

export function init(slug: string): [ProblemScreenModel, Command] {
  return [
    {
      problem: null,
      slug,
      detail: null,
      loading: true,
      error: null,
      scrollOffset: 0,
      contentLines: [],
      testResult: null,
      submissionResult: null,
      isRunning: false,
      successMessage: null,
      activeHintIndex: null,
      isBookmarked: false,
      drawerMode: 'none',
      focusRegion: 'body',
      drawerScrollOffset: 0,
      drawerData: {
        statusMessage: null,
      },
      submissionsHistory: null,
      submissionsLoading: false,
      snapshotsList: null,
      snapshotCursor: 0,
      noteContent: null,
      diffContent: null,
    },
    Cmd.fetchProblemDetail(slug),
  ];
}

function closeDrawer(model: ProblemScreenModel): ProblemScreenModel {
  return {
    ...model,
    drawerMode: 'none',
    focusRegion: 'body',
    drawerScrollOffset: 0,
    drawerData: { statusMessage: null },
  };
}

function setDrawer(
  model: ProblemScreenModel,
  mode: ProblemDrawerMode,
  statusMessage: string | null = null
): ProblemScreenModel {
  if (mode === 'none') return closeDrawer(model);
  return {
    ...model,
    drawerMode: mode,
    focusRegion: 'drawer',
    drawerScrollOffset: 0,
    drawerData: { statusMessage },
  };
}

export function update(
  msg: ProblemMsg,
  model: ProblemScreenModel,
  terminalHeight: number,
  terminalWidth: number
): [ProblemScreenModel, Command] {
  const bodyMaxScroll = getBodyScrollMax(model, terminalHeight, terminalWidth);

  switch (msg.type) {
    case 'PROBLEM_FOCUS_TOGGLE':
      if (model.drawerMode === 'none') return [model, Cmd.none()];
      return [
        {
          ...model,
          focusRegion: model.focusRegion === 'body' ? 'drawer' : 'body',
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SCROLL_UP':
      return [{ ...model, scrollOffset: Math.max(0, model.scrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_SCROLL_DOWN':
      return [{ ...model, scrollOffset: Math.min(bodyMaxScroll, model.scrollOffset + 1) }, Cmd.none()];

    case 'PROBLEM_PAGE_UP': {
      const page = Math.max(3, Math.floor(getBodyHeight(terminalHeight, model.drawerMode) * 0.8));
      return [{ ...model, scrollOffset: Math.max(0, model.scrollOffset - page) }, Cmd.none()];
    }

    case 'PROBLEM_PAGE_DOWN': {
      const page = Math.max(3, Math.floor(getBodyHeight(terminalHeight, model.drawerMode) * 0.8));
      return [
        { ...model, scrollOffset: Math.min(bodyMaxScroll, model.scrollOffset + page) },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_TOP':
      return [{ ...model, scrollOffset: 0 }, Cmd.none()];

    case 'PROBLEM_BOTTOM':
      return [{ ...model, scrollOffset: bodyMaxScroll }, Cmd.none()];

    case 'PROBLEM_DETAIL_LOADED': {
      const contentLines = processContent(msg.detail);
      const isBookmarked = bookmarks.has(msg.detail.questionFrontendId);
      return [
        {
          ...model,
          loading: false,
          detail: msg.detail,
          contentLines,
          scrollOffset: 0,
          isBookmarked,
          error: null,
          successMessage: null,
          drawerMode: 'none',
          focusRegion: 'body',
          drawerScrollOffset: 0,
          drawerData: { statusMessage: null },
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_DETAIL_ERROR':
      return [
        {
          ...setDrawer({ ...model, loading: false, error: msg.error }, 'status', msg.error),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_PICK':
      return [model, Cmd.pickProblem(model.slug)];

    case 'PROBLEM_TEST':
      return [
        {
          ...setDrawer(model, 'status', 'Running tests...'),
          isRunning: true,
          testResult: null,
          submissionResult: null,
          successMessage: null,
          error: null,
        },
        Cmd.testSolution(model.slug),
      ];

    case 'PROBLEM_SUBMIT':
      return [
        {
          ...setDrawer(model, 'status', 'Submitting solution...'),
          isRunning: true,
          testResult: null,
          submissionResult: null,
          successMessage: null,
          error: null,
        },
        Cmd.submitSolution(model.slug),
      ];

    case 'PROBLEM_TEST_RESULT':
      return [
        {
          ...setDrawer(model, 'testResult'),
          isRunning: false,
          testResult: msg.result,
          submissionResult: null,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SUBMIT_RESULT':
      return [
        {
          ...setDrawer(model, 'submitResult'),
          isRunning: false,
          submissionResult: msg.result,
          testResult: null,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_BOOKMARK': {
      if (!model.detail) return [model, Cmd.none()];
      const id = model.detail.questionFrontendId;
      if (bookmarks.has(id)) {
        bookmarks.remove(id);
        const message = 'Problem unbookmarked';
        return [
          {
            ...setDrawer(model, 'status', message),
            isBookmarked: false,
            successMessage: message,
            error: null,
          },
          Cmd.none(),
        ];
      }

      bookmarks.add(id);
      const message = 'Problem bookmarked';
      return [
        {
          ...setDrawer(model, 'status', message),
          isBookmarked: true,
          successMessage: message,
          error: null,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_TOGGLE_HINT': {
      const hints = model.detail?.hints || [];
      if (hints.length === 0) {
        const message = 'No hints available for this problem';
        return [
          {
            ...setDrawer(model, 'status', message),
            error: null,
            successMessage: null,
          },
          Cmd.none(),
        ];
      }

      if (model.drawerMode === 'hint') {
        return [closeDrawer(model), Cmd.none()];
      }

      return [
        {
          ...setDrawer(model, 'hint'),
          activeHintIndex: model.activeHintIndex ?? 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_NEXT_HINT': {
      const hints = model.detail?.hints || [];
      if (hints.length === 0) return [model, Cmd.none()];
      const current = model.activeHintIndex ?? 0;
      return [
        {
          ...model,
          activeHintIndex: Math.min(hints.length - 1, current + 1),
          drawerScrollOffset: 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_PREV_HINT': {
      const current = model.activeHintIndex ?? 0;
      return [
        {
          ...model,
          activeHintIndex: Math.max(0, current - 1),
          drawerScrollOffset: 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_HINT_SCROLL_UP':
      return [{ ...model, drawerScrollOffset: Math.max(0, model.drawerScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_HINT_SCROLL_DOWN':
      return [
        {
          ...model,
          drawerScrollOffset: Math.min(
            getDrawerScrollMax(model, terminalHeight, terminalWidth),
            model.drawerScrollOffset + 1
          ),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_NOTES':
      if (!model.detail) return [model, Cmd.none()];
      return [model, Cmd.openEditor(model.detail.questionFrontendId)];

    case 'PROBLEM_ACTION_ERROR':
      return [
        {
          ...setDrawer(model, 'status', msg.error),
          isRunning: false,
          error: msg.error,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_ACTION_SUCCESS':
      return [
        {
          ...setDrawer(model, 'status', msg.message),
          isRunning: false,
          successMessage: msg.message,
          error: null,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_RESULT':
      return [closeDrawer(model), Cmd.none()];

    case 'PROBLEM_SHOW_SUBMISSIONS':
      if (model.drawerMode === 'submissions') {
        return [closeDrawer(model), Cmd.none()];
      }
      return [
        {
          ...setDrawer(model, 'submissions'),
          submissionsLoading: true,
          submissionsHistory: null,
        },
        Cmd.fetchSubmissions(model.slug),
      ];

    case 'PROBLEM_SUBMISSIONS_LOADED':
      return [
        {
          ...setDrawer(model, 'submissions'),
          submissionsLoading: false,
          submissionsHistory: msg.submissions,
          error: null,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SUBMISSIONS_ERROR':
      return [
        {
          ...setDrawer(model, 'status', msg.error),
          submissionsLoading: false,
          error: msg.error,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_SUBMISSIONS':
      return [closeDrawer(model), Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_SCROLL_UP':
      return [{ ...model, drawerScrollOffset: Math.max(0, model.drawerScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_SCROLL_DOWN':
      return [
        {
          ...model,
          drawerScrollOffset: Math.min(
            getDrawerScrollMax(model, terminalHeight, terminalWidth),
            model.drawerScrollOffset + 1
          ),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SHOW_SNAPSHOTS': {
      if (model.drawerMode === 'snapshots') {
        return [closeDrawer(model), Cmd.none()];
      }
      const problemId = model.detail?.questionFrontendId || model.slug;
      return [
        {
          ...setDrawer(model, 'snapshots'),
          snapshotsList: snapshotStorage.list(problemId),
          snapshotCursor: 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_CLOSE_SNAPSHOTS':
      return [closeDrawer(model), Cmd.none()];

    case 'PROBLEM_SNAPSHOT_UP':
      if (!model.snapshotsList || model.snapshotsList.length === 0) return [model, Cmd.none()];
      return [{ ...model, snapshotCursor: Math.max(0, model.snapshotCursor - 1) }, Cmd.none()];

    case 'PROBLEM_SNAPSHOT_DOWN':
      if (!model.snapshotsList || model.snapshotsList.length === 0) return [model, Cmd.none()];
      return [
        {
          ...model,
          snapshotCursor: Math.min(model.snapshotsList.length - 1, model.snapshotCursor + 1),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_VIEW_NOTE':
      if (!model.detail) return [model, Cmd.none()];
      return [
        {
          ...setDrawer(model, 'status', 'Loading note...'),
        },
        Cmd.loadNote(model.detail.questionFrontendId),
      ];

    case 'PROBLEM_NOTE_LOADED':
      return [
        {
          ...setDrawer(model, 'note'),
          noteContent: msg.content,
          error: null,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_NOTE':
      return [closeDrawer(model), Cmd.none()];

    case 'PROBLEM_NOTE_SCROLL_UP':
      return [{ ...model, drawerScrollOffset: Math.max(0, model.drawerScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_NOTE_SCROLL_DOWN':
      return [
        {
          ...model,
          drawerScrollOffset: Math.min(
            getDrawerScrollMax(model, terminalHeight, terminalWidth),
            model.drawerScrollOffset + 1
          ),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_DIFF_SNAPSHOT': {
      if (!model.snapshotsList || model.snapshotsList.length === 0) return [model, Cmd.none()];
      const snapshot = model.snapshotsList[model.snapshotCursor];
      if (!snapshot) return [model, Cmd.none()];
      return [model, Cmd.diffSnapshot(model.slug, snapshot.id.toString())];
    }

    case 'PROBLEM_DIFF_LOADED':
      return [
        {
          ...setDrawer(model, 'diff'),
          diffContent: msg.content,
          error: null,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_DIFF':
      return [closeDrawer(model), Cmd.none()];

    case 'PROBLEM_DIFF_SCROLL_UP':
      return [{ ...model, drawerScrollOffset: Math.max(0, model.drawerScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_DIFF_SCROLL_DOWN':
      return [
        {
          ...model,
          drawerScrollOffset: Math.min(
            getDrawerScrollMax(model, terminalHeight, terminalWidth),
            model.drawerScrollOffset + 1
          ),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_RESTORE_SNAPSHOT': {
      if (!model.snapshotsList || model.snapshotsList.length === 0) return [model, Cmd.none()];
      const snapshot = model.snapshotsList[model.snapshotCursor];
      if (!snapshot) return [model, Cmd.none()];
      return [model, Cmd.restoreSnapshot(model.slug, snapshot.id.toString())];
    }

    default:
      return [model, Cmd.none()];
  }
}

function processContent(detail: ProblemDetail): string[] {
  const formatted = formatProblemContent(detail.content || '');
  return formatted.split('\n');
}

function getBodyHeight(terminalHeight: number, drawerMode: ProblemDrawerMode): number {
  const contentHeight = Math.max(6, terminalHeight - 4);
  return computeProblemViewport(contentHeight, drawerMode).bodyHeight;
}

function getBodyScrollMax(
  model: ProblemScreenModel,
  terminalHeight: number,
  terminalWidth: number
): number {
  const bodyHeight = getBodyHeight(terminalHeight, model.drawerMode);
  const contentWidth = Math.max(20, terminalWidth - 4);
  const wrappedLines = wrapLines(model.contentLines, contentWidth);
  return Math.max(0, wrappedLines.length - bodyHeight);
}

function getDrawerScrollMax(
  model: ProblemScreenModel,
  terminalHeight: number,
  terminalWidth: number
): number {
  if (model.drawerMode === 'none' || model.drawerMode === 'snapshots') return 0;

  const contentHeight = Math.max(6, terminalHeight - 4);
  const viewport = computeProblemViewport(contentHeight, model.drawerMode);
  const drawerBodyHeight = Math.max(1, viewport.drawerHeight - 2);
  const drawerWidth = Math.max(20, terminalWidth - 2);

  const rows = getDrawerRows(model, drawerWidth);
  return Math.max(0, rows.length - drawerBodyHeight);
}

function getDrawerRows(model: ProblemScreenModel, drawerWidth: number): string[] {
  const contentWidth = Math.max(10, drawerWidth - 2);

  switch (model.drawerMode) {
    case 'hint': {
      const hints = model.detail?.hints || [];
      const hintIndex = model.activeHintIndex ?? 0;
      const hint = hints[hintIndex] ?? '';
      const clean = sanitizeText(hint);
      return wrapLines([clean || 'No hint content'], contentWidth);
    }

    case 'submissions': {
      if (model.submissionsLoading) return ['Loading submissions...'];
      if (!model.submissionsHistory || model.submissionsHistory.length === 0) {
        return [
          'No submissions found for this problem.',
          'Use [s] Submit after picking a solution.',
        ];
      }
      return model.submissionsHistory.map((entry) => {
        const status = truncatePlain(entry.statusDisplay || '-', 10).padEnd(10);
        const runtime = truncatePlain(entry.runtime || '-', 8).padEnd(8);
        const memory = truncatePlain(entry.memory || '-', 8).padEnd(8);
        const lang = truncatePlain(entry.lang || '-', 8).padEnd(8);
        return `${status} ${runtime} ${memory} ${lang}`;
      });
    }

    case 'note':
      return wrapLines(formatNotePreview(model.noteContent || 'No notes found. Press e to edit.'), contentWidth);

    case 'diff':
      return (model.diffContent || 'No diff available.').split('\n').map((line) => sanitizeText(line));

    case 'testResult': {
      const result = model.testResult;
      if (!result) return ['No test result available.'];
      if (result.compile_error) return ['Compile Error', ...wrapLines([result.compile_error], contentWidth)];
      if (result.runtime_error) return ['Runtime Error', ...wrapLines([result.runtime_error], contentWidth)];
      if (result.correct_answer) return ['All test cases passed'];
      return ['Wrong answer'];
    }

    case 'submitResult': {
      const result = model.submissionResult;
      if (!result) return ['No submission result available.'];
      const lines = [
        result.status_msg || '-',
        `Runtime: ${result.status_runtime || '-'}`,
        `Memory: ${result.status_memory || '-'}`,
      ];
      if (result.runtime_error) {
        lines.push(...wrapLines([result.runtime_error], contentWidth));
      }
      return lines;
    }

    case 'status': {
      const message =
        model.drawerData.statusMessage ||
        model.successMessage ||
        model.error ||
        (model.isRunning ? 'Working...' : 'Ready');
      return wrapLines([message], contentWidth);
    }

    default:
      return [];
  }
}

function sanitizeText(raw: string): string {
  return stripAnsi(raw)
    .replace(/\[green\]|\[red\]|\[grey\]/g, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncatePlain(value: string, max: number): string {
  if (value.length <= max) return value;
  if (max <= 1) return '…';
  return `${value.slice(0, max - 1)}…`;
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
      line = `• ${line.slice(3)}`;
    } else if (line.startsWith('# ')) {
      line = line.slice(2);
    }

    lines.push(line);
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.length > 0 ? lines : ['No notes found. Press e to edit.'];
}
