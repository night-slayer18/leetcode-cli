

import type { ProblemScreenModel, ProblemMsg, Command, ProblemDetail } from '../../types.js';
import { Cmd } from '../../types.js';
import { bookmarks } from '../../../storage/bookmarks.js';
import { timerStorage } from '../../../storage/timer.js';
import { snapshotStorage } from '../../../storage/snapshots.js';
import { config } from '../../../storage/config.js';
import { findSolutionFile } from '../../../utils/fileUtils.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { diffLines } from 'diff';
import { displayTestResult, displaySubmissionResult } from '../../../utils/display.js';

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
      hintScrollOffset: 0,
      isBookmarked: false,
      showSubmissions: false,
      submissionsHistory: null,
      submissionsLoading: false,
      submissionScrollOffset: 0,
      showSnapshots: false,
      snapshotsList: null,
      snapshotCursor: 0,
      currentNote: null,
      noteScrollOffset: 0,
      showDiff: false,
      diffContent: null,
      diffScrollOffset: 0,
    },
    Cmd.fetchProblemDetail(slug),
  ];
}

export function update(
  msg: ProblemMsg, 
  model: ProblemScreenModel,
  terminalHeight: number,
  terminalWidth: number
): [ProblemScreenModel, Command] {

  const headerUsed = 22; 
  const footerHeight = 2; 
  const viewHeight = Math.max(5, terminalHeight - headerUsed - footerHeight);

  const contentWidth = Math.max(20, terminalWidth - 8);
  const wrappedLines = wrapLines(model.contentLines, contentWidth);

  const maxScroll = Math.max(0, wrappedLines.length - viewHeight + 5);

  switch (msg.type) {
    case 'PROBLEM_SCROLL_UP':
      return [
        { ...model, scrollOffset: Math.max(0, model.scrollOffset - 1) },
        Cmd.none(),
      ];

    case 'PROBLEM_SCROLL_DOWN':
      return [
        { ...model, scrollOffset: Math.min(maxScroll, model.scrollOffset + 1) },
        Cmd.none(),
      ];
      
    case 'PROBLEM_PAGE_UP':
      return [
        { ...model, scrollOffset: Math.max(0, model.scrollOffset - viewHeight) },
        Cmd.none(),
      ];

    case 'PROBLEM_PAGE_DOWN':
      return [
        { ...model, scrollOffset: Math.min(maxScroll, model.scrollOffset + viewHeight) },
        Cmd.none(),
      ];

    case 'PROBLEM_TOP':
      return [
        { ...model, scrollOffset: 0 },
        Cmd.none(),
      ];

    case 'PROBLEM_BOTTOM':
      return [
        { ...model, scrollOffset: maxScroll },
        Cmd.none(),
      ];

    case 'PROBLEM_DETAIL_LOADED': {
      const { detail } = msg;
      const contentLines = processContent(detail);
      const isBookmarked = bookmarks.has(detail.questionFrontendId);
      
      return [
        { 
          ...model, 
          loading: false, 
          detail, 
          contentLines,
          scrollOffset: 0,
          isBookmarked
        },
        Cmd.none(),
      ];
    }
    
    case 'PROBLEM_DETAIL_ERROR':
      return [
        { ...model, loading: false, error: msg.error },
        Cmd.none(),
      ];

    case 'PROBLEM_PICK':
      return [model, Cmd.pickProblem(model.slug)];

    case 'PROBLEM_TEST':
      return [{...model, isRunning: true, testResult: null, submissionResult: null}, Cmd.testSolution(model.slug)];

    case 'PROBLEM_SUBMIT':
      return [{...model, isRunning: true, testResult: null, submissionResult: null}, Cmd.submitSolution(model.slug)];

    case 'PROBLEM_TEST_RESULT':
        return [{...model, isRunning: false, testResult: msg.result, submissionResult: null}, Cmd.none()];

    case 'PROBLEM_SUBMIT_RESULT':
        return [{...model, isRunning: false, testResult: null, submissionResult: msg.result}, Cmd.none()];

    case 'PROBLEM_BOOKMARK':
        if (!model.detail) return [model, Cmd.none()];
        const id = model.detail.questionFrontendId;
        if (bookmarks.has(id)) {
            bookmarks.remove(id);
            return [{...model, isBookmarked: false, successMessage: 'Bookmark removed'}, Cmd.none()];
        } else {
            bookmarks.add(id);
            return [{...model, isBookmarked: true, successMessage: 'Problem bookmarked'}, Cmd.none()];
        }

    case 'PROBLEM_TOGGLE_HINT': {
        
        const hints = model.detail?.hints || [];
        if (hints.length === 0) {
            return [{...model, successMessage: 'No hints available for this problem'}, Cmd.none()];
        }
        if (model.activeHintIndex !== null) {
            
            return [{...model, activeHintIndex: null, hintScrollOffset: 0}, Cmd.none()];
        }
        
        return [{...model, activeHintIndex: 0, hintScrollOffset: 0}, Cmd.none()];
    }

    case 'PROBLEM_NEXT_HINT': {
        const hints = model.detail?.hints || [];
        if (model.activeHintIndex === null || hints.length === 0) {
            return [model, Cmd.none()];
        }
        const nextIndex = Math.min(model.activeHintIndex + 1, hints.length - 1);
        return [{...model, activeHintIndex: nextIndex, hintScrollOffset: 0}, Cmd.none()];
    }

    case 'PROBLEM_PREV_HINT': {
        if (model.activeHintIndex === null) {
            return [model, Cmd.none()];
        }
        const prevIndex = Math.max(0, model.activeHintIndex - 1);
        return [{...model, activeHintIndex: prevIndex, hintScrollOffset: 0}, Cmd.none()];
    }

    case 'PROBLEM_HINT_SCROLL_UP':
        return [{...model, hintScrollOffset: Math.max(0, model.hintScrollOffset - 1)}, Cmd.none()];

    case 'PROBLEM_HINT_SCROLL_DOWN':
        return [{...model, hintScrollOffset: model.hintScrollOffset + 1}, Cmd.none()];

    case 'PROBLEM_NOTES':
        if (model.detail) {
          return [model, Cmd.openEditor(model.detail.questionFrontendId)];
        }
        return [model, Cmd.none()];

    case 'PROBLEM_ACTION_ERROR':
        
        return [{...model, isRunning: false, error: msg.error}, Cmd.none()];
    
    case 'PROBLEM_ACTION_SUCCESS':
        return [{...model, isRunning: false, successMessage: msg.message}, Cmd.none()];

    case 'PROBLEM_CLOSE_RESULT':
        return [{
            ...model, 
            testResult: null, 
            submissionResult: null, 
            successMessage: null, 
            activeHintIndex: null, 
            hintScrollOffset: 0,
            showSubmissions: false,
            showSnapshots: false,
            currentNote: null,
            noteScrollOffset: 0,
            showDiff: false,
            diffContent: null,
            diffScrollOffset: 0,
            error: null
        }, Cmd.none()];

    case 'PROBLEM_SHOW_SUBMISSIONS':
        if (model.showSubmissions) {
            return [{...model, showSubmissions: false}, Cmd.none()];
        }
        return [{...model, showSubmissions: true, submissionsLoading: true, submissionsHistory: null, submissionScrollOffset: 0}, Cmd.fetchSubmissions(model.slug)];

    case 'PROBLEM_SUBMISSIONS_LOADED':
        return [{...model, submissionsLoading: false, submissionsHistory: msg.submissions, submissionScrollOffset: 0}, Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_ERROR':
        return [{...model, submissionsLoading: false, showSubmissions: false, error: msg.error}, Cmd.none()];

    case 'PROBLEM_CLOSE_SUBMISSIONS':
        return [{...model, showSubmissions: false}, Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_SCROLL_UP':
        return [{...model, submissionScrollOffset: Math.max(0, model.submissionScrollOffset - 1)}, Cmd.none()];

    case 'PROBLEM_SUBMISSIONS_SCROLL_DOWN':
        return [{...model, submissionScrollOffset: model.submissionScrollOffset + 1}, Cmd.none()];

    case 'PROBLEM_SHOW_SNAPSHOTS': {
        if (model.showSnapshots) {
            return [{...model, showSnapshots: false}, Cmd.none()];
        }
        const problemId = model.detail?.questionFrontendId || model.slug;
        const snapshots = snapshotStorage.list(problemId);
        return [{...model, showSnapshots: true, snapshotsList: snapshots, snapshotCursor: 0}, Cmd.none()];
    }

    case 'PROBLEM_SNAPSHOT_UP':
        if (!model.showSnapshots || !model.snapshotsList) return [model, Cmd.none()];
        return [{...model, snapshotCursor: Math.max(0, model.snapshotCursor - 1)}, Cmd.none()];

    case 'PROBLEM_SNAPSHOT_DOWN':
        if (!model.showSnapshots || !model.snapshotsList) return [model, Cmd.none()];
        return [{...model, snapshotCursor: Math.min(model.snapshotsList.length - 1, model.snapshotCursor + 1)}, Cmd.none()];

    case 'PROBLEM_CLOSE_SNAPSHOTS':
        return [{...model, showSnapshots: false}, Cmd.none()];

      case 'PROBLEM_VIEW_NOTE': {
        if (!model.detail) return [model, Cmd.none()];
        return [model, Cmd.loadNote(model.detail.questionFrontendId)];
      }

      case 'PROBLEM_NOTE_LOADED':
        return [{ ...model, currentNote: msg.content, noteScrollOffset: 0 }, Cmd.none()];

      case 'PROBLEM_CLOSE_NOTE':
        return [{ ...model, currentNote: null, noteScrollOffset: 0 }, Cmd.none()];

      case 'PROBLEM_NOTE_SCROLL_UP': 
        return [{ ...model, noteScrollOffset: Math.max(0, model.noteScrollOffset - 1) }, Cmd.none()];

      case 'PROBLEM_NOTE_SCROLL_DOWN':
         return [{ ...model, noteScrollOffset: model.noteScrollOffset + 1 }, Cmd.none()];

      case 'PROBLEM_DIFF_SNAPSHOT': {
          if (!model.snapshotsList || model.snapshotsList.length === 0) return [model, Cmd.none()];
          const cursor = model.snapshotCursor;
          if (cursor >= model.snapshotsList.length) return [model, Cmd.none()];
          
          const snapshot = model.snapshotsList[cursor];
          return [model, Cmd.diffSnapshot(model.slug, snapshot.id.toString())];
      }

      case 'PROBLEM_DIFF_LOADED':
         return [{ ...model, diffContent: msg.content, showDiff: true, diffScrollOffset: 0 }, Cmd.none()];
      
      case 'PROBLEM_CLOSE_DIFF':
         return [{ ...model, showDiff: false, diffContent: null, diffScrollOffset: 0 }, Cmd.none()];

      case 'PROBLEM_DIFF_SCROLL_UP': 
        return [{ ...model, diffScrollOffset: Math.max(0, model.diffScrollOffset - 1) }, Cmd.none()];
      
      case 'PROBLEM_DIFF_SCROLL_DOWN':
        return [{ ...model, diffScrollOffset: model.diffScrollOffset + 1 }, Cmd.none()];

      case 'PROBLEM_RESTORE_SNAPSHOT': {
          if (!model.snapshotsList || model.snapshotsList.length === 0) return [model, Cmd.none()];
          const cursor = model.snapshotCursor;
          const snapshot = model.snapshotsList[cursor];
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