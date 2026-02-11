import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createInitialModel,
  type AppModel,
  type KeyEvent,
  type ProblemDetail,
  type ProblemScreenModel,
} from '../../tui/types.js';
import { update } from '../../tui/update.js';
import * as ProblemScreen from '../../tui/screens/problem/index.js';
import { view as renderProblemView } from '../../tui/screens/problem/view.js';

const mockBookmarks = new Set<string>();

const mockSnapshots = [
  {
    id: 1,
    name: 'snap-1',
    fileName: '1_snap-1.ts',
    language: 'typescript',
    lines: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'snap-2',
    fileName: '2_snap-2.ts',
    language: 'typescript',
    lines: 15,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

vi.mock('../../storage/bookmarks.js', () => ({
  bookmarks: {
    has: vi.fn((id: string) => mockBookmarks.has(id)),
    add: vi.fn((id: string) => {
      mockBookmarks.add(id);
      return true;
    }),
    remove: vi.fn((id: string) => {
      mockBookmarks.delete(id);
      return true;
    }),
    list: vi.fn(() => Array.from(mockBookmarks)),
    count: vi.fn(() => mockBookmarks.size),
    clear: vi.fn(() => {
      mockBookmarks.clear();
    }),
  },
}));

vi.mock('../../storage/snapshots.js', () => ({
  snapshotStorage: {
    list: vi.fn(() => mockSnapshots),
  },
}));

function key(name: string, sequence = name): KeyEvent {
  return {
    name,
    sequence,
    ctrl: false,
    meta: false,
    shift: /^[A-Z]$/.test(name),
  };
}

function makeProblemDetail(hints: string[] = ['hint-1']): ProblemDetail {
  return {
    questionId: '1',
    questionFrontendId: '1',
    title: 'Two Sum',
    titleSlug: 'two-sum',
    difficulty: 'Easy',
    isPaidOnly: false,
    acRate: 59.1,
    topicTags: [{ name: 'Array', slug: 'array' }],
    status: null,
    content: Array.from({ length: 80 }, (_, i) => `Line ${i + 1}: example statement`).join('\n'),
    codeSnippets: [],
    sampleTestCase: '[2,7,11,15]\n9',
    exampleTestcases: '[2,7,11,15]\n9',
    hints,
    companyTags: [],
    stats: '{}',
  };
}

function makeProblemApp(detail: ProblemDetail = makeProblemDetail()): AppModel {
  const [initialProblemModel] = ProblemScreen.init(detail.titleSlug);
  const [loadedProblemModel] = ProblemScreen.update(
    { type: 'PROBLEM_DETAIL_LOADED', detail },
    initialProblemModel,
    32,
    120
  );

  const model = createInitialModel('tester');
  return {
    ...model,
    isCheckingAuth: false,
    terminalWidth: 120,
    terminalHeight: 32,
    screenState: { screen: 'problem', model: loadedProblemModel },
    history: [{ screen: 'home', model: { menuIndex: 0 } }],
    needsRender: false,
  };
}

function getProblemModel(model: AppModel): ProblemScreenModel {
  if (model.screenState.screen !== 'problem') {
    throw new Error('Expected problem screen');
  }
  return model.screenState.model;
}

describe('TUI Problem Screen', () => {
  beforeEach(() => {
    mockBookmarks.clear();
  });

  it('closes drawer before navigating back on escape', () => {
    const app = makeProblemApp(makeProblemDetail(['hint one']));
    const [afterOpen] = update({ type: 'KEY_PRESS', key: key('h') }, app);
    expect(afterOpen.screenState.screen).toBe('problem');
    expect(getProblemModel(afterOpen).drawerMode).toBe('hint');

    const [afterCloseDrawer] = update({ type: 'KEY_PRESS', key: key('escape', '\x1b') }, afterOpen);
    expect(afterCloseDrawer.screenState.screen).toBe('problem');
    expect(getProblemModel(afterCloseDrawer).drawerMode).toBe('none');

    const [afterBack] = update({ type: 'KEY_PRESS', key: key('escape', '\x1b') }, afterCloseDrawer);
    expect(afterBack.screenState.screen).toBe('home');
  });

  it('routes scroll input to focused region and toggles focus with Tab', () => {
    const longHint = 'hint '.repeat(500);
    const app = makeProblemApp(makeProblemDetail([longHint]));

    const [withHintDrawer] = update({ type: 'KEY_PRESS', key: key('h') }, app);
    expect(getProblemModel(withHintDrawer).focusRegion).toBe('drawer');

    const [drawerScrolled] = update(
      { type: 'KEY_PRESS', key: key('down', '\x1b[B') },
      withHintDrawer
    );
    expect(getProblemModel(drawerScrolled).drawerScrollOffset).toBeGreaterThan(0);
    expect(getProblemModel(drawerScrolled).scrollOffset).toBe(0);

    const [bodyFocused] = update({ type: 'KEY_PRESS', key: key('tab', '\t') }, drawerScrolled);
    expect(getProblemModel(bodyFocused).focusRegion).toBe('body');

    const [bodyScrolled] = update({ type: 'KEY_PRESS', key: key('down', '\x1b[B') }, bodyFocused);
    expect(getProblemModel(bodyScrolled).scrollOffset).toBeGreaterThan(0);

    const [drawerFocusedAgain] = update({ type: 'KEY_PRESS', key: key('tab', '\t') }, bodyScrolled);
    expect(getProblemModel(drawerFocusedAgain).focusRegion).toBe('drawer');
  });

  it('keeps global action shortcuts active while drawer is open', () => {
    const app = makeProblemApp();
    const [withHints] = update({ type: 'KEY_PRESS', key: key('h') }, app);
    expect(getProblemModel(withHints).drawerMode).toBe('hint');

    const [withTestStatus, testCmd] = update({ type: 'KEY_PRESS', key: key('t') }, withHints);
    expect(getProblemModel(withTestStatus).drawerMode).toBe('status');
    expect(testCmd.type).toBe('CMD_TEST_SOLUTION');

    const [withSubmissions, submissionsCmd] = update(
      { type: 'KEY_PRESS', key: key('H') },
      withTestStatus
    );
    expect(getProblemModel(withSubmissions).drawerMode).toBe('submissions');
    expect(submissionsCmd.type).toBe('CMD_FETCH_SUBMISSIONS');
  });

  it('keeps hint index and snapshot cursor within valid bounds', () => {
    const [initialModel] = ProblemScreen.init('two-sum');
    const [loaded] = ProblemScreen.update(
      { type: 'PROBLEM_DETAIL_LOADED', detail: makeProblemDetail(['first hint', 'second hint']) },
      initialModel,
      32,
      120
    );
    const [hintOpen] = ProblemScreen.update({ type: 'PROBLEM_TOGGLE_HINT' }, loaded, 32, 120);

    let hintModel = hintOpen;
    for (let i = 0; i < 10; i++) {
      [hintModel] = ProblemScreen.update({ type: 'PROBLEM_NEXT_HINT' }, hintModel, 32, 120);
    }
    expect(hintModel.activeHintIndex).toBe(1);

    for (let i = 0; i < 10; i++) {
      [hintModel] = ProblemScreen.update({ type: 'PROBLEM_PREV_HINT' }, hintModel, 32, 120);
    }
    expect(hintModel.activeHintIndex).toBe(0);

    const [snapshotsOpen] = ProblemScreen.update({ type: 'PROBLEM_SHOW_SNAPSHOTS' }, hintModel, 32, 120);
    let snapshotsModel = snapshotsOpen;
    for (let i = 0; i < 10; i++) {
      [snapshotsModel] = ProblemScreen.update({ type: 'PROBLEM_SNAPSHOT_DOWN' }, snapshotsModel, 32, 120);
    }
    expect(snapshotsModel.snapshotCursor).toBe(mockSnapshots.length - 1);

    for (let i = 0; i < 10; i++) {
      [snapshotsModel] = ProblemScreen.update({ type: 'PROBLEM_SNAPSHOT_UP' }, snapshotsModel, 32, 120);
    }
    expect(snapshotsModel.snapshotCursor).toBe(0);
  });

  it('renders problem view without side split pane when drawer is closed', () => {
    const [initialModel] = ProblemScreen.init('two-sum');
    const [loaded] = ProblemScreen.update(
      { type: 'PROBLEM_DETAIL_LOADED', detail: makeProblemDetail(['hint one']) },
      initialModel,
      28,
      100
    );

    const output = renderProblemView(loaded, 100, 28);
    expect(output).not.toContain('│');
  });
});
