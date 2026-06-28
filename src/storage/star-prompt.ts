import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/** Show the prompt at these exact submission counts (one-time each, lifetime). */
export const STAR_PROMPT_MILESTONES = [10, 20, 30] as const;

/** After all milestones are exhausted, show every N submissions. */
export const STAR_PROMPT_RECURRING_INTERVAL = 40;

/** Reset the recurring counter if 30 days pass without reaching the interval. */
export const STAR_PROMPT_RESET_DAYS = 30;

interface StarPromptState {
  /** Total accepted submissions tracked for milestone checks. */
  totalAccepted: number;
  /** Milestones that have already been shown (persists across windows). */
  shownMilestones: number[];
  /** Submissions counted since last prompt in the recurring (post-milestone) phase. */
  submissionsSinceLastPrompt: number;
  /** Epoch ms when the recurring counter window started. */
  windowStartedAt: number | null;
  /** Epoch ms when the prompt was last shown. */
  lastShownAt: number | null;
  /** True if the user chose "Don't ask again". */
  dismissed: boolean;
}

const LEETCODE_DIR = join(homedir(), '.leetcode');
const STATE_FILE = join(LEETCODE_DIR, 'star-prompt.json');

const DEFAULT_STATE: StarPromptState = {
  totalAccepted: 0,
  shownMilestones: [],
  submissionsSinceLastPrompt: 0,
  windowStartedAt: null,
  lastShownAt: null,
  dismissed: false,
};

function ensureDir(): void {
  if (!existsSync(LEETCODE_DIR)) {
    mkdirSync(LEETCODE_DIR, { recursive: true });
  }
}

function loadState(): StarPromptState {
  if (existsSync(STATE_FILE)) {
    try {
      return { ...DEFAULT_STATE, ...JSON.parse(readFileSync(STATE_FILE, 'utf-8')) };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }
  return { ...DEFAULT_STATE };
}

function saveState(state: StarPromptState): void {
  ensureDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
}

export const starPromptStorage = {
  getState(): StarPromptState {
    return loadState();
  },

  /**
   * Increment submission counters.
   * Bumps totalAccepted (for milestones) and submissionsSinceLastPrompt (for recurring).
   * If the 30-day window has elapsed, resets the recurring counter first.
   */
  incrementSubmissionCount(): void {
    const state = loadState();
    const now = Date.now();
    const resetMs = STAR_PROMPT_RESET_DAYS * 24 * 60 * 60 * 1000;

    state.totalAccepted += 1;

    if (!state.windowStartedAt || now - state.windowStartedAt >= resetMs) {
      state.submissionsSinceLastPrompt = 0;
      state.windowStartedAt = now;
    }

    state.submissionsSinceLastPrompt += 1;
    saveState(state);
  },

  markMilestoneShown(milestone: number): void {
    const state = loadState();
    state.lastShownAt = Date.now();
    if (!state.shownMilestones.includes(milestone)) {
      state.shownMilestones.push(milestone);
    }
    saveState(state);
  },

  markRecurringShown(): void {
    const state = loadState();
    state.lastShownAt = Date.now();
    state.submissionsSinceLastPrompt = 0;
    state.windowStartedAt = Date.now();
    saveState(state);
  },

  dismissPermanently(): void {
    const state = loadState();
    state.dismissed = true;
    state.lastShownAt = Date.now();
    saveState(state);
  },

  resetForTests(): void {
    saveState({ ...DEFAULT_STATE });
  },
};
