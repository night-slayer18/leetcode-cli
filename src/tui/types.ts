import type {
  Problem as RootProblem,
  ProblemDetail as RootProblemDetail,
  ProblemListFilters as RootProblemListFilters,
  DailyChallenge,
} from '../types.js';

export type Problem = RootProblem;
export type ProblemDetail = RootProblemDetail;
export type ProblemListFilters = RootProblemListFilters;
export type TestResult = import('../types.js').TestResult;
export type SubmissionResult = import('../types.js').SubmissionResult;

export interface KeyEvent {
  readonly name: string;
  readonly sequence: string;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
}

export interface HomeScreenModel {
  readonly menuIndex: number;
}

export interface ListScreenModel {
  readonly problems: readonly Problem[];
  readonly total: number;
  readonly cursor: number;
  readonly scrollOffset: number;
  readonly page: number;
  readonly loading: boolean;
  readonly loadingMore: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly searchMode: boolean;
  readonly searchBuffer: string;
  readonly difficultyFilter: 'Easy' | 'Medium' | 'Hard' | null;
  readonly statusFilter: 'solved' | 'attempted' | 'todo' | null;
  readonly bookmarkFilter: boolean;
}

export interface ProblemScreenModel {
  readonly problem: Problem | null;
  readonly slug: string;
  readonly detail: ProblemDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly scrollOffset: number;
  readonly contentLines: readonly string[];
  readonly testResult: import('../types.js').TestResult | null;
  readonly submissionResult: import('../types.js').SubmissionResult | null;
  readonly isRunning: boolean;
  readonly successMessage: string | null;
  readonly activeHintIndex: number | null;
  readonly isBookmarked: boolean;

  readonly activePanel: ProblemPanelType;
  readonly panelScrollOffset: number;
  readonly panelData: {
    readonly statusMessage: string | null;
  };

  readonly submissionsHistory: readonly import('../types.js').Submission[] | null;
  readonly submissionsLoading: boolean;

  readonly snapshotsList: readonly import('../storage/snapshots.js').Snapshot[] | null;
  readonly snapshotCursor: number;

  readonly noteContent: string | null;
  readonly diffContent: string | null;
}

export type ProblemPanelType =
  | 'none'
  | 'hint'
  | 'submissions'
  | 'snapshots'
  | 'note'
  | 'diff'
  | 'testResult'
  | 'submitResult'
  | 'status';

export interface TimerScreenModel {
  readonly problemId: string | null;
  readonly problemTitle: string;
  readonly difficulty: 'Easy' | 'Medium' | 'Hard';
  readonly remainingSeconds: number;
  readonly totalSeconds: number;
  readonly status: 'idle' | 'running' | 'paused' | 'completed';
  readonly viewMode: 'timer' | 'stats';
}

export interface StatsScreenModel {
  readonly loading: boolean;
  readonly error: string | null;
  readonly stats: UserProfile | null;
  readonly dailyChallenge: DailyChallenge | null;
  readonly skillStats: SkillStats | null;
}

export interface UserProfile {
  username: string;
  realName: string;
  ranking: number;
  acSubmissionNum: Array<{ difficulty: string; count: number }>;
  streak: number;
  totalActiveDays: number;
  submissionCalendar: string;
}

export interface SkillStats {
  fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
}

export interface ConfigScreenModel {
  readonly selectedOption: number;
  readonly options: readonly { id: string; label: string; description: string; value: string }[];
  readonly paneFocus: 'list' | 'editor';
  readonly isEditing: boolean;
  readonly draftValue: string;
  readonly validationError: string | null;
  readonly isDirty: boolean;
  readonly config: import('../types.js').UserConfig | null;
}

export interface HelpScreenModel {
  readonly scrollOffset: number;
}

export interface LoginScreenModel {
  readonly step: 'instructions' | 'input' | 'verifying' | 'success' | 'error';
  readonly sessionToken: string;
  readonly csrfToken: string;
  readonly focusedField: 'session' | 'csrf';
  readonly error: string | null;
}

export interface WorkspaceScreenModel {
  readonly workspaces: readonly string[];
  readonly activeWorkspace: string;
  readonly cursor: number;
  readonly paneFocus: 'list' | 'editor';
  readonly selectedField: 'lang' | 'workDir' | 'editor' | 'syncRepo';
  readonly selectedWorkspace: string | null;
  readonly selectedConfig: {
    readonly lang: string;
    readonly workDir: string;
    readonly editor: string;
    readonly syncRepo: string;
  } | null;
  readonly draftConfig: {
    readonly lang: string;
    readonly workDir: string;
    readonly editor: string;
    readonly syncRepo: string;
  } | null;
  readonly isEditing: boolean;
  readonly isDirty: boolean;
  readonly showCreateInput: boolean;
  readonly newWorkspaceName: string;
  readonly showDeleteConfirm: boolean;
  readonly error: string | null;
  readonly success: string | null;
}

export interface VersionEntry {
  version: string;
  content: string;
  hasBreakingChanges: boolean;
  date?: string;
}

export interface ChangelogScreenModel {
  readonly entries: VersionEntry[];
  readonly scrollOffset: number;
  readonly loading: boolean;
  readonly error: string | null;
}

export type ScreenState =
  | { readonly screen: 'home'; readonly model: HomeScreenModel }
  | { readonly screen: 'list'; readonly model: ListScreenModel }
  | { readonly screen: 'problem'; readonly model: ProblemScreenModel }
  | { readonly screen: 'timer'; readonly model: TimerScreenModel }
  | { readonly screen: 'stats'; readonly model: StatsScreenModel }
  | { readonly screen: 'config'; readonly model: ConfigScreenModel }
  | { readonly screen: 'help'; readonly model: HelpScreenModel }
  | { readonly screen: 'login'; readonly model: LoginScreenModel }
  | { readonly screen: 'workspace'; readonly model: WorkspaceScreenModel }
  | { readonly screen: 'changelog'; readonly model: ChangelogScreenModel };

export interface AppModel {
  readonly screenState: ScreenState;

  readonly history: readonly ScreenState[];

  readonly user: {
    readonly username: string;
    readonly isLoggedIn: boolean;
  } | null;

  readonly isCheckingAuth: boolean;
  readonly globalError: string | null;

  readonly terminalWidth: number;
  readonly terminalHeight: number;

  readonly needsRender: boolean;
}

export type GlobalMsg =
  | { readonly type: 'INIT' }
  | { readonly type: 'KEY_PRESS'; readonly key: KeyEvent }
  | { readonly type: 'RESIZE'; readonly width: number; readonly height: number }
  | { readonly type: 'QUIT' }
  | { readonly type: 'NAVIGATE'; readonly to: ScreenState }
  | { readonly type: 'GO_BACK' }
  | { readonly type: 'AUTH_CHECK_COMPLETE'; readonly user: { username: string } | null }
  | { readonly type: 'GLOBAL_ERROR'; readonly error: string }
  | { readonly type: 'CLEAR_ERROR' }
  | { readonly type: 'FETCH_DAILY_SUCCESS'; readonly slug: string }
  | { readonly type: 'FETCH_RANDOM_SUCCESS'; readonly slug: string };

export type HomeMsg =
  | { readonly type: 'HOME_MENU_UP' }
  | { readonly type: 'HOME_MENU_DOWN' }
  | { readonly type: 'HOME_MENU_SELECT' };

export type ListMsg =
  | { readonly type: 'LIST_CURSOR_UP' }
  | { readonly type: 'LIST_CURSOR_DOWN' }
  | { readonly type: 'LIST_PAGE_UP' }
  | { readonly type: 'LIST_PAGE_DOWN' }
  | { readonly type: 'LIST_GO_TOP' }
  | { readonly type: 'LIST_GO_BOTTOM' }
  | { readonly type: 'LIST_SELECT' }
  | { readonly type: 'LIST_SEARCH_START' }
  | { readonly type: 'LIST_SEARCH_INPUT'; readonly char: string }
  | { readonly type: 'LIST_SEARCH_BACKSPACE' }
  | { readonly type: 'LIST_SEARCH_SUBMIT' }
  | { readonly type: 'LIST_SEARCH_CANCEL' }
  | {
      readonly type: 'LIST_FILTER_DIFFICULTY';
      readonly difficulty: 'Easy' | 'Medium' | 'Hard' | null;
    }
  | { readonly type: 'LIST_FILTER_STATUS'; readonly status: 'solved' | 'attempted' | 'todo' | null }
  | { readonly type: 'LIST_FILTER_BOOKMARKS' }
  | { readonly type: 'LIST_CLEAR_FILTERS' }
  | { readonly type: 'LIST_REFRESH' }
  | { readonly type: 'LIST_FETCH_START' }
  | {
      readonly type: 'LIST_FETCH_SUCCESS';
      readonly problems: Problem[];
      readonly total: number;
      readonly append: boolean;
    }
  | { readonly type: 'LIST_FETCH_ERROR'; readonly error: string };

export type ProblemMsg =
  | { readonly type: 'PROBLEM_SCROLL_UP' }
  | { readonly type: 'PROBLEM_SCROLL_DOWN' }
  | { readonly type: 'PROBLEM_PAGE_UP' }
  | { readonly type: 'PROBLEM_PAGE_DOWN' }
  | { readonly type: 'PROBLEM_TOP' }
  | { readonly type: 'PROBLEM_BOTTOM' }
  | { readonly type: 'PROBLEM_PICK' }
  | { readonly type: 'PROBLEM_TEST' }
  | { readonly type: 'PROBLEM_SUBMIT' }
  | { readonly type: 'PROBLEM_BOOKMARK' }
  | { readonly type: 'PROBLEM_DETAIL_LOADED'; readonly detail: ProblemDetail }
  | { readonly type: 'PROBLEM_DETAIL_ERROR'; readonly error: string }
  | { readonly type: 'PROBLEM_TEST_RESULT'; readonly result: import('../types.js').TestResult }
  | {
      readonly type: 'PROBLEM_SUBMIT_RESULT';
      readonly result: import('../types.js').SubmissionResult;
    }
  | {
      readonly type: 'PROBLEM_SUBMIT_RESULT';
      readonly result: import('../types.js').SubmissionResult;
    }
  | { readonly type: 'PROBLEM_ACTION_ERROR'; readonly error: string }
  | { readonly type: 'PROBLEM_ACTION_SUCCESS'; readonly message: string }
  | { readonly type: 'PROBLEM_CLOSE_RESULT' }
  | { readonly type: 'PROBLEM_TOGGLE_HINT' }
  | { readonly type: 'PROBLEM_NEXT_HINT' }
  | { readonly type: 'PROBLEM_PREV_HINT' }
  | { readonly type: 'PROBLEM_HINT_SCROLL_UP' }
  | { readonly type: 'PROBLEM_HINT_SCROLL_DOWN' }
  | { readonly type: 'PROBLEM_NOTES' }
  | { readonly type: 'PROBLEM_SHOW_SUBMISSIONS' }
  | {
      readonly type: 'PROBLEM_SUBMISSIONS_LOADED';
      readonly submissions: readonly import('../types.js').Submission[];
    }
  | { readonly type: 'PROBLEM_SUBMISSIONS_ERROR'; readonly error: string }
  | { readonly type: 'PROBLEM_CLOSE_SUBMISSIONS' }
  | { readonly type: 'PROBLEM_SUBMISSIONS_SCROLL_UP' }
  | { readonly type: 'PROBLEM_SUBMISSIONS_SCROLL_DOWN' }
  | { readonly type: 'PROBLEM_SHOW_SNAPSHOTS' }
  | { readonly type: 'PROBLEM_CLOSE_SNAPSHOTS' }
  | { readonly type: 'PROBLEM_SNAPSHOT_UP' }
  | { readonly type: 'PROBLEM_SNAPSHOT_DOWN' }
  | { readonly type: 'PROBLEM_VIEW_NOTE' }
  | { readonly type: 'PROBLEM_NOTE_LOADED'; readonly content: string }
  | { readonly type: 'PROBLEM_CLOSE_NOTE' }
  | { readonly type: 'PROBLEM_RESTORE_SNAPSHOT' }
  | { readonly type: 'PROBLEM_DIFF_SNAPSHOT' }
  | { readonly type: 'PROBLEM_DIFF_LOADED'; readonly content: string }
  | { readonly type: 'PROBLEM_CLOSE_DIFF' }
  | { readonly type: 'PROBLEM_NOTE_SCROLL_UP' }
  | { readonly type: 'PROBLEM_NOTE_SCROLL_DOWN' }
  | { readonly type: 'PROBLEM_DIFF_SCROLL_UP' }
  | { readonly type: 'PROBLEM_DIFF_SCROLL_DOWN' };

export type TimerMsg =
  | { readonly type: 'TIMER_START' }
  | { readonly type: 'TIMER_PAUSE' }
  | { readonly type: 'TIMER_RESET' }
  | { readonly type: 'TIMER_TICK' }
  | { readonly type: 'TIMER_COMPLETE' }
  | { readonly type: 'TIMER_SWITCH_VIEW'; readonly view: 'timer' | 'stats' };

export type StatsMsg =
  | { readonly type: 'STATS_FETCH_START' }
  | {
      readonly type: 'STATS_FETCH_SUCCESS';
      readonly stats: UserProfile;
      readonly daily: DailyChallenge;
      readonly skills: SkillStats;
    }
  | { readonly type: 'STATS_REFRESH' }
  | { readonly type: 'STATS_FETCH_ERROR'; readonly error: string };

export type ConfigMsg =
  | { readonly type: 'CONFIG_OPTION_UP' }
  | { readonly type: 'CONFIG_OPTION_DOWN' }
  | { readonly type: 'CONFIG_FOCUS_LIST' }
  | { readonly type: 'CONFIG_FOCUS_EDITOR' }
  | { readonly type: 'CONFIG_TOGGLE_FOCUS' }
  | { readonly type: 'CONFIG_EDIT_START' }
  | { readonly type: 'CONFIG_EDIT_INPUT'; readonly char: string }
  | { readonly type: 'CONFIG_EDIT_BACKSPACE' }
  | { readonly type: 'CONFIG_EDIT_SAVE' }
  | { readonly type: 'CONFIG_EDIT_CANCEL' };

export type HelpMsg =
  | { readonly type: 'HELP_SCROLL_UP' }
  | { readonly type: 'HELP_SCROLL_DOWN' }
  | { readonly type: 'HELP_PAGE_UP' }
  | { readonly type: 'HELP_PAGE_DOWN' }
  | { readonly type: 'HELP_TOP' }
  | { readonly type: 'HELP_BOTTOM' };

export type LoginMsg =
  | { readonly type: 'LOGIN_SESSION_INPUT'; readonly value: string }
  | { readonly type: 'LOGIN_CSRF_INPUT'; readonly value: string }
  | { readonly type: 'LOGIN_SUBMIT' }
  | { readonly type: 'LOGIN_BACK' }
  | { readonly type: 'LOGIN_SWITCH_FOCUS' }
  | { readonly type: 'LOGIN_SET_FOCUS'; readonly field: 'session' | 'csrf' }
  | { readonly type: 'LOGIN_SUCCESS'; readonly username: string }
  | { readonly type: 'LOGIN_ERROR'; readonly error: string };

export type WorkspaceMsg =
  | { readonly type: 'WORKSPACE_UP' }
  | { readonly type: 'WORKSPACE_DOWN' }
  | { readonly type: 'WORKSPACE_SELECT' }
  | { readonly type: 'WORKSPACE_FOCUS_LIST' }
  | { readonly type: 'WORKSPACE_FOCUS_EDITOR' }
  | { readonly type: 'WORKSPACE_TOGGLE_FOCUS' }
  | { readonly type: 'WORKSPACE_FIELD_UP' }
  | { readonly type: 'WORKSPACE_FIELD_DOWN' }
  | { readonly type: 'WORKSPACE_EDIT_START' }
  | { readonly type: 'WORKSPACE_EDIT_INPUT'; readonly char: string }
  | { readonly type: 'WORKSPACE_EDIT_BACKSPACE' }
  | { readonly type: 'WORKSPACE_EDIT_SAVE' }
  | { readonly type: 'WORKSPACE_EDIT_CANCEL' }
  | { readonly type: 'WORKSPACE_DELETE' }
  | { readonly type: 'WORKSPACE_CREATE_START' }
  | { readonly type: 'WORKSPACE_CREATE_INPUT'; readonly char: string }
  | { readonly type: 'WORKSPACE_CREATE_BACKSPACE' }
  | { readonly type: 'WORKSPACE_CREATE_SUBMIT' }
  | { readonly type: 'WORKSPACE_CREATE_CANCEL' }
  | { readonly type: 'WORKSPACE_DELETE_CONFIRM' }
  | { readonly type: 'WORKSPACE_DELETE_CANCEL' };

export type ChangelogMsg =
  | { readonly type: 'CHANGELOG_SCROLL_UP' }
  | { readonly type: 'CHANGELOG_SCROLL_DOWN' }
  | { readonly type: 'CHANGELOG_FETCH_START' }
  | { readonly type: 'CHANGELOG_FETCH_SUCCESS'; readonly content: string }
  | { readonly type: 'CHANGELOG_FETCH_ERROR'; readonly error: string };

export type AppMsg =
  | GlobalMsg
  | HomeMsg
  | ListMsg
  | ProblemMsg
  | TimerMsg
  | StatsMsg
  | ConfigMsg
  | HelpMsg
  | LoginMsg
  | WorkspaceMsg
  | ChangelogMsg;

export type Command =
  | { readonly type: 'CMD_NONE' }
  | { readonly type: 'CMD_BATCH'; readonly commands: readonly Command[] }
  | {
      readonly type: 'CMD_FETCH_PROBLEMS';
      readonly filters: ProblemListFilters;
      readonly append: boolean;
    }
  | { readonly type: 'CMD_FETCH_PROBLEM_DETAIL'; readonly slug: string }
  | { readonly type: 'CMD_FETCH_STATS' }
  | { readonly type: 'CMD_FETCH_DAILY' }
  | { readonly type: 'CMD_FETCH_RANDOM' }
  | { readonly type: 'CMD_CHECK_AUTH' }
  | { readonly type: 'CMD_PICK_PROBLEM'; readonly slug: string; readonly lang?: string }
  | { readonly type: 'CMD_TEST_SOLUTION'; readonly slug: string }
  | { readonly type: 'CMD_SUBMIT_SOLUTION'; readonly slug: string }
  | { readonly type: 'CMD_START_TIMER_SUBSCRIPTION'; readonly intervalMs: number }
  | { readonly type: 'CMD_STOP_TIMER_SUBSCRIPTION' }
  | { readonly type: 'CMD_SAVE_CONFIG'; readonly key: string; readonly value: string }
  | { readonly type: 'CMD_OPEN_EDITOR'; readonly id: string }
  | { readonly type: 'CMD_FETCH_SUBMISSIONS'; readonly slug: string }
  | { readonly type: 'CMD_EXIT' }
  | { readonly type: 'CMD_LOAD_NOTE'; readonly problemId: string }
  | { readonly type: 'CMD_DIFF_SNAPSHOT'; readonly slug: string; readonly snapshotId: string }
  | { readonly type: 'CMD_DIFF_SNAPSHOT'; readonly slug: string; readonly snapshotId: string }
  | { readonly type: 'CMD_RESTORE_SNAPSHOT'; readonly slug: string; readonly snapshotId: string }
  | { readonly type: 'CMD_LOAD_WORKSPACES' }
  | { readonly type: 'CMD_CREATE_WORKSPACE'; readonly name: string }
  | { readonly type: 'CMD_DELETE_WORKSPACE'; readonly name: string }
  | { readonly type: 'CMD_SWITCH_WORKSPACE'; readonly name: string }
  | { readonly type: 'CMD_FETCH_CHANGELOG' }
  | { readonly type: 'CMD_LOGOUT' }
  | { readonly type: 'CMD_LOGIN'; readonly session: string; readonly csrf: string };

export const Cmd = {
  none: (): Command => ({ type: 'CMD_NONE' }),
  batch: (...cmds: Command[]): Command => ({ type: 'CMD_BATCH', commands: cmds }),
  fetchProblems: (filters: ProblemListFilters, append = false): Command => ({
    type: 'CMD_FETCH_PROBLEMS',
    filters,
    append,
  }),
  fetchProblemDetail: (slug: string): Command => ({ type: 'CMD_FETCH_PROBLEM_DETAIL', slug }),
  fetchStats: (): Command => ({ type: 'CMD_FETCH_STATS' }),
  fetchDaily: (): Command => ({ type: 'CMD_FETCH_DAILY' }),
  fetchRandom: (): Command => ({ type: 'CMD_FETCH_RANDOM' }),
  checkAuth: (): Command => ({ type: 'CMD_CHECK_AUTH' }),
  pickProblem: (slug: string, lang?: string): Command => ({ type: 'CMD_PICK_PROBLEM', slug, lang }),
  testSolution: (slug: string): Command => ({ type: 'CMD_TEST_SOLUTION', slug }),
  submitSolution: (slug: string): Command => ({ type: 'CMD_SUBMIT_SOLUTION', slug }),
  startTimer: (intervalMs = 1000): Command => ({
    type: 'CMD_START_TIMER_SUBSCRIPTION',
    intervalMs,
  }),
  stopTimer: (): Command => ({ type: 'CMD_STOP_TIMER_SUBSCRIPTION' }),
  saveConfig: (key: string, value: string): Command => ({ type: 'CMD_SAVE_CONFIG', key, value }),
  openEditor: (id: string): Command => ({ type: 'CMD_OPEN_EDITOR', id }),
  fetchSubmissions: (slug: string): Command => ({ type: 'CMD_FETCH_SUBMISSIONS', slug }),
  exit: (): Command => ({ type: 'CMD_EXIT' }),
  loadNote: (problemId: string): Command => ({ type: 'CMD_LOAD_NOTE', problemId }),
  diffSnapshot: (slug: string, snapshotId: string): Command => ({
    type: 'CMD_DIFF_SNAPSHOT',
    slug,
    snapshotId,
  }),
  restoreSnapshot: (slug: string, snapshotId: string): Command => ({
    type: 'CMD_RESTORE_SNAPSHOT',
    slug,
    snapshotId,
  }),
  loadWorkspaces: (): Command => ({ type: 'CMD_LOAD_WORKSPACES' }),
  createWorkspace: (name: string): Command => ({ type: 'CMD_CREATE_WORKSPACE', name }),
  deleteWorkspace: (name: string): Command => ({ type: 'CMD_DELETE_WORKSPACE', name }),
  switchWorkspace: (name: string): Command => ({ type: 'CMD_SWITCH_WORKSPACE', name }),
  fetchChangelog: (): Command => ({ type: 'CMD_FETCH_CHANGELOG' }),
  logout: (): Command => ({ type: 'CMD_LOGOUT' }),
  login: (session: string, csrf: string): Command => ({ type: 'CMD_LOGIN', session, csrf }),
};

export function createInitialModel(username?: string): AppModel {
  return {
    screenState: {
      screen: 'home',
      model: { menuIndex: 0 },
    },
    history: [],
    user: username ? { username, isLoggedIn: true } : null,
    isCheckingAuth: true,
    globalError: null,
    terminalWidth: process.stdout.columns || 80,
    terminalHeight: process.stdout.rows || 24,
    needsRender: true,
  };
}
