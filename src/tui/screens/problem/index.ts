import type { ProblemScreenModel, ProblemMsg, Command, ProblemDetail } from '../../types.js';
import { Cmd } from '../../types.js';
import { bookmarks } from '../../../storage/bookmarks.js';
import { snapshotStorage } from '../../../storage/snapshots.js';
import { formatProblemContent } from '../../../utils/display.js';
import { stripAnsi, wrapLines } from '../../lib/layout.js';

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
      activePanel: 'none',
      panelScrollOffset: 0,
      panelData: {
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

function closePanel(model: ProblemScreenModel): ProblemScreenModel {
  return {
    ...model,
    activePanel: 'none',
    panelScrollOffset: 0,
    panelData: { statusMessage: null },
    activeHintIndex: null,
    testResult: null,
    submissionResult: null,
    successMessage: null,
    error: null,
    isRunning: false,
  };
}

function panelDimensions(terminalWidth: number, terminalHeight: number): { width: number; height: number } {
  const contentHeight = Math.max(6, terminalHeight - 4);
  if (terminalWidth >= 104) {
    const leftRatio = 0.66;
    return {
      width: Math.max(28, terminalWidth - Math.floor(terminalWidth * leftRatio) - 1),
      height: Math.max(8, contentHeight - 5),
    };
  }
  return {
    width: Math.max(22, terminalWidth - 2),
    height: Math.max(6, Math.min(12, Math.floor(contentHeight * 0.42))),
  };
}

export function update(
  msg: ProblemMsg,
  model: ProblemScreenModel,
  terminalHeight: number,
  terminalWidth: number
): [ProblemScreenModel, Command] {
  const contentHeight = Math.max(6, terminalHeight - 4);
  const headerUsed = 3;
  const footerHeight = 2;
  const viewHeight = Math.max(3, contentHeight - headerUsed - footerHeight);

  const sidePanelActive =
    terminalWidth >= 104 &&
    (model.activePanel === 'hint' ||
      model.activePanel === 'submissions' ||
      model.activePanel === 'snapshots' ||
      model.activePanel === 'note' ||
      model.activePanel === 'diff');
  const contentPaneRatio =
    model.activePanel === 'note' || model.activePanel === 'diff' ? 0.62 : 0.68;
  const contentPaneWidth = sidePanelActive
    ? Math.floor(terminalWidth * contentPaneRatio)
    : terminalWidth;
  const contentWidth = Math.max(20, contentPaneWidth - 4);
  const wrappedLines = wrapLines(model.contentLines, contentWidth);
  const maxScroll = Math.max(0, wrappedLines.length - viewHeight);

  switch (msg.type) {
    case 'PROBLEM_SCROLL_UP':
      return [{ ...model, scrollOffset: Math.max(0, model.scrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_SCROLL_DOWN':
      return [{ ...model, scrollOffset: Math.min(maxScroll, model.scrollOffset + 1) }, Cmd.none()];

    case 'PROBLEM_PAGE_UP':
      return [{ ...model, scrollOffset: Math.max(0, model.scrollOffset - viewHeight) }, Cmd.none()];

    case 'PROBLEM_PAGE_DOWN':
      return [{ ...model, scrollOffset: Math.min(maxScroll, model.scrollOffset + viewHeight) }, Cmd.none()];

    case 'PROBLEM_TOP':
      return [{ ...model, scrollOffset: 0 }, Cmd.none()];

    case 'PROBLEM_BOTTOM':
      return [{ ...model, scrollOffset: maxScroll }, Cmd.none()];

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
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_DETAIL_ERROR':
      return [{ ...model, loading: false, error: msg.error, activePanel: 'status', panelData: { statusMessage: msg.error } }, Cmd.none()];

    case 'PROBLEM_PICK':
      return [model, Cmd.pickProblem(model.slug)];

    case 'PROBLEM_TEST':
      return [
        {
          ...model,
          isRunning: true,
          testResult: null,
          submissionResult: null,
          successMessage: null,
          error: null,
          activePanel: 'status',
          panelScrollOffset: 0,
          panelData: { statusMessage: 'Running tests...' },
        },
        Cmd.testSolution(model.slug),
      ];

    case 'PROBLEM_SUBMIT':
      return [
        {
          ...model,
          isRunning: true,
          testResult: null,
          submissionResult: null,
          successMessage: null,
          error: null,
          activePanel: 'status',
          panelScrollOffset: 0,
          panelData: { statusMessage: 'Submitting solution...' },
        },
        Cmd.submitSolution(model.slug),
      ];

    case 'PROBLEM_TEST_RESULT':
      return [
        {
          ...model,
          isRunning: false,
          testResult: msg.result,
          submissionResult: null,
          activePanel: 'testResult',
          panelScrollOffset: 0,
          panelData: { statusMessage: null },
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SUBMIT_RESULT':
      return [
        {
          ...model,
          isRunning: false,
          testResult: null,
          submissionResult: msg.result,
          activePanel: 'submitResult',
          panelScrollOffset: 0,
          panelData: { statusMessage: null },
        },
        Cmd.none(),
      ];

    case 'PROBLEM_BOOKMARK': {
      if (!model.detail) return [model, Cmd.none()];
      const id = model.detail.questionFrontendId;
      if (bookmarks.has(id)) {
        bookmarks.remove(id);
        return [
          {
            ...model,
            isBookmarked: false,
            successMessage: 'Bookmark removed',
            activePanel: 'status',
            panelScrollOffset: 0,
            panelData: { statusMessage: 'Bookmark removed' },
          },
          Cmd.none(),
        ];
      }

      bookmarks.add(id);
      return [
        {
          ...model,
          isBookmarked: true,
          successMessage: 'Problem bookmarked',
          activePanel: 'status',
          panelScrollOffset: 0,
          panelData: { statusMessage: 'Problem bookmarked' },
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_TOGGLE_HINT': {
      const hints = model.detail?.hints || [];
      if (hints.length === 0) {
        return [
          {
            ...model,
            activePanel: 'status',
            panelScrollOffset: 0,
            panelData: { statusMessage: 'No hints available for this problem' },
          },
          Cmd.none(),
        ];
      }
      if (model.activePanel === 'hint') {
        return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];
      }

      return [
        {
          ...model,
          activePanel: 'hint',
          activeHintIndex: model.activeHintIndex ?? 0,
          panelScrollOffset: 0,
          panelData: { statusMessage: null },
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_NEXT_HINT': {
      const hints = model.detail?.hints || [];
      if (model.activeHintIndex === null || hints.length === 0) return [model, Cmd.none()];
      return [
        {
          ...model,
          activePanel: 'hint',
          activeHintIndex: Math.min(model.activeHintIndex + 1, hints.length - 1),
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_PREV_HINT': {
      if (model.activeHintIndex === null) return [model, Cmd.none()];
      return [
        {
          ...model,
          activePanel: 'hint',
          activeHintIndex: Math.max(0, model.activeHintIndex - 1),
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_HINT_SCROLL_UP':
      return [{ ...model, panelScrollOffset: Math.max(0, model.panelScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_HINT_SCROLL_DOWN':
      return [
        {
          ...model,
          panelScrollOffset: Math.min(
            getHintScrollMax(model, terminalWidth, terminalHeight),
            model.panelScrollOffset + 1
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
          ...model,
          isRunning: false,
          error: msg.error,
          activePanel: 'status',
          panelScrollOffset: 0,
          panelData: { statusMessage: msg.error },
        },
        Cmd.none(),
      ];

    case 'PROBLEM_ACTION_SUCCESS':
      return [
        {
          ...model,
          isRunning: false,
          successMessage: msg.message,
          activePanel: 'status',
          panelScrollOffset: 0,
          panelData: { statusMessage: msg.message },
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_RESULT':
      return [closePanel(model), Cmd.none()];

    case 'PROBLEM_SHOW_SUBMISSIONS':
      if (model.activePanel === 'submissions') {
        return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];
      }
      return [
        {
          ...model,
          activePanel: 'submissions',
          submissionsLoading: true,
          submissionsHistory: null,
          panelScrollOffset: 0,
          panelData: { statusMessage: null },
        },
        Cmd.fetchSubmissions(model.slug),
      ];

    case 'PROBLEM_SUBMISSIONS_LOADED':
      return [
        {
          ...model,
          activePanel: 'submissions',
          submissionsLoading: false,
          submissionsHistory: msg.submissions,
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SUBMISSIONS_ERROR':
      return [
        {
          ...model,
          submissionsLoading: false,
          error: msg.error,
          activePanel: 'status',
          panelData: { statusMessage: msg.error },
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_SUBMISSIONS':
      return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_SCROLL_UP':
      return [{ ...model, panelScrollOffset: Math.max(0, model.panelScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_SCROLL_DOWN':
      return [
        {
          ...model,
          panelScrollOffset: Math.min(
            getSubmissionScrollMax(model, terminalWidth, terminalHeight),
            model.panelScrollOffset + 1
          ),
        },
        Cmd.none(),
      ];

    case 'PROBLEM_SHOW_SNAPSHOTS': {
      if (model.activePanel === 'snapshots') {
        return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];
      }
      const problemId = model.detail?.questionFrontendId || model.slug;
      return [
        {
          ...model,
          activePanel: 'snapshots',
          snapshotsList: snapshotStorage.list(problemId),
          snapshotCursor: 0,
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];
    }

    case 'PROBLEM_CLOSE_SNAPSHOTS':
      return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];

    case 'PROBLEM_SNAPSHOT_UP':
      if (model.activePanel !== 'snapshots' || !model.snapshotsList) return [model, Cmd.none()];
      return [{ ...model, snapshotCursor: Math.max(0, model.snapshotCursor - 1) }, Cmd.none()];

    case 'PROBLEM_SNAPSHOT_DOWN':
      if (model.activePanel !== 'snapshots' || !model.snapshotsList) return [model, Cmd.none()];
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
          ...model,
          activePanel: 'status',
          panelData: { statusMessage: 'Loading note...' },
          panelScrollOffset: 0,
        },
        Cmd.loadNote(model.detail.questionFrontendId),
      ];

    case 'PROBLEM_NOTE_LOADED':
      return [
        {
          ...model,
          noteContent: msg.content,
          activePanel: 'note',
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_NOTE':
      return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];

    case 'PROBLEM_NOTE_SCROLL_UP':
      return [{ ...model, panelScrollOffset: Math.max(0, model.panelScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_NOTE_SCROLL_DOWN':
      return [
        {
          ...model,
          panelScrollOffset: Math.min(
            getNoteScrollMax(model, terminalWidth, terminalHeight),
            model.panelScrollOffset + 1
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
          ...model,
          diffContent: msg.content,
          activePanel: 'diff',
          panelScrollOffset: 0,
        },
        Cmd.none(),
      ];

    case 'PROBLEM_CLOSE_DIFF':
      return [{ ...model, activePanel: 'none', panelScrollOffset: 0 }, Cmd.none()];

    case 'PROBLEM_DIFF_SCROLL_UP':
      return [{ ...model, panelScrollOffset: Math.max(0, model.panelScrollOffset - 1) }, Cmd.none()];

    case 'PROBLEM_DIFF_SCROLL_DOWN':
      return [
        {
          ...model,
          panelScrollOffset: Math.min(
            getDiffScrollMax(model, terminalWidth, terminalHeight),
            model.panelScrollOffset + 1
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

function getHintScrollMax(
  model: ProblemScreenModel,
  terminalWidth: number,
  terminalHeight: number
): number {
  if (model.activeHintIndex === null || !model.detail?.hints?.length) return 0;
  const dims = panelDimensions(terminalWidth, terminalHeight);
  const contentWidth = Math.max(10, dims.width - 3);
  const hint = model.detail.hints[model.activeHintIndex] ?? '';
  const cleanHint = stripAnsi(hint)
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const wrapped = wrapLines([cleanHint || 'No content'], contentWidth);
  return Math.max(0, wrapped.length - Math.max(3, dims.height - 5));
}

function getSubmissionScrollMax(
  model: ProblemScreenModel,
  terminalWidth: number,
  terminalHeight: number
): number {
  const total = model.submissionsHistory?.length ?? 0;
  const dims = panelDimensions(terminalWidth, terminalHeight);
  const pageSize = Math.max(3, dims.height - 6);
  return Math.max(0, total - pageSize);
}

function getNoteScrollMax(
  model: ProblemScreenModel,
  terminalWidth: number,
  terminalHeight: number
): number {
  if (!model.noteContent) return 0;
  const dims = panelDimensions(terminalWidth, terminalHeight);
  const wrapped = wrapLines(model.noteContent.split('\n'), Math.max(10, dims.width - 3));
  return Math.max(0, wrapped.length - Math.max(3, dims.height - 5));
}

function getDiffScrollMax(
  model: ProblemScreenModel,
  terminalWidth: number,
  terminalHeight: number
): number {
  if (!model.diffContent) return 0;
  const dims = panelDimensions(terminalWidth, terminalHeight);
  const lines = model.diffContent.split('\n');
  return Math.max(0, lines.length - Math.max(3, dims.height - 5));
}
