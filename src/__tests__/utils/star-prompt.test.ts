import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../storage/star-prompt.js', () => {
  let state = {
    totalAccepted: 0,
    shownMilestones: [] as number[],
    submissionsSinceLastPrompt: 0,
    windowStartedAt: null as number | null,
    lastShownAt: null as number | null,
    dismissed: false,
  };

  const RESET_MS = 30 * 24 * 60 * 60 * 1000;

  return {
    STAR_PROMPT_MILESTONES: [10, 20, 30],
    STAR_PROMPT_RECURRING_INTERVAL: 40,
    STAR_PROMPT_RESET_DAYS: 30,
    starPromptStorage: {
      getState: vi.fn(() => ({ ...state, shownMilestones: [...state.shownMilestones] })),
      incrementSubmissionCount: vi.fn(() => {
        const now = Date.now();
        state.totalAccepted += 1;
        if (!state.windowStartedAt || now - state.windowStartedAt >= RESET_MS) {
          state.submissionsSinceLastPrompt = 0;
          state.windowStartedAt = now;
        }
        state.submissionsSinceLastPrompt += 1;
      }),
      markMilestoneShown: vi.fn((milestone: number) => {
        state.lastShownAt = Date.now();
        if (!state.shownMilestones.includes(milestone)) {
          state.shownMilestones.push(milestone);
        }
      }),
      markRecurringShown: vi.fn(() => {
        state.lastShownAt = Date.now();
        state.submissionsSinceLastPrompt = 0;
        state.windowStartedAt = Date.now();
      }),
      dismissPermanently: vi.fn(() => {
        state.dismissed = true;
        state.lastShownAt = Date.now();
      }),
      resetForTests: vi.fn(() => {
        state = {
          totalAccepted: 0,
          shownMilestones: [],
          submissionsSinceLastPrompt: 0,
          windowStartedAt: null,
          lastShownAt: null,
          dismissed: false,
        };
      }),
    },
  };
});

import { starPromptStorage } from '../../storage/star-prompt.js';
import { shouldShowStarPrompt } from '../../utils/star-prompt.js';

const THIRTY_ONE_DAYS_MS = 31 * 24 * 60 * 60 * 1000;

describe('star prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubEnv('VITEST', '');
    vi.stubEnv('CI', '');
    starPromptStorage.resetForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  // --- Milestone phase ---

  it('does not show before reaching the first milestone (10)', () => {
    for (let i = 0; i < 9; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(false);
  });

  it('shows at the 10th submission milestone', () => {
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(true);
  });

  it('shows at 20th and 30th milestones', () => {
    // Reach 10, mark shown
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(10);

    // 11–19: no prompt
    for (let i = 0; i < 9; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(false);

    // 20th: prompt
    starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(true);
    starPromptStorage.markMilestoneShown(20);

    // 21–29: no prompt
    for (let i = 0; i < 9; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(false);

    // 30th: prompt
    starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(true);
  });

  it('does not re-show a milestone already shown', () => {
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(10);
    expect(shouldShowStarPrompt('accepted')).toBe(false);
  });

  // --- Recurring phase (post-milestones) ---

  it('switches to every-40 after all milestones exhausted', () => {
    // Burn through milestones
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(10);
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(20);
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(30);
    starPromptStorage.markRecurringShown(); // reset recurring counter

    // 39 more: no prompt
    for (let i = 0; i < 39; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(false);

    // 40th: prompt
    starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(true);
  });

  // --- 30-day window reset ---

  it('resets recurring counter after 30 days', () => {
    // Exhaust milestones
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(10);
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(20);
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    starPromptStorage.markMilestoneShown(30);
    starPromptStorage.markRecurringShown();

    // Do 20 submissions (< 40)
    for (let i = 0; i < 20; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(false);

    // Advance 31 days — counter resets
    vi.advanceTimersByTime(THIRTY_ONE_DAYS_MS);

    // Next submission starts fresh window at 1
    starPromptStorage.incrementSubmissionCount();
    expect(starPromptStorage.getState().submissionsSinceLastPrompt).toBe(1);
    expect(shouldShowStarPrompt('accepted')).toBe(false);
  });

  // --- Dismissal ---

  it('respects permanent dismissal', () => {
    starPromptStorage.dismissPermanently();
    for (let i = 0; i < 10; i++) starPromptStorage.incrementSubmissionCount();
    expect(shouldShowStarPrompt('accepted')).toBe(false);
  });
});
