import chalk from 'chalk';
import open from 'open';
import inquirer from 'inquirer';
import {
  STAR_PROMPT_MILESTONES,
  STAR_PROMPT_RECURRING_INTERVAL,
  starPromptStorage,
} from '../storage/star-prompt.js';

export const GITHUB_REPO_URL = 'https://github.com/night-slayer18/leetcode-cli';

export type StarPromptTrigger = 'accepted';

function shouldSkipPrompt(): boolean {
  if (process.env.VITEST || process.env.CI) return true;
  if (starPromptStorage.getState().dismissed) return true;
  return false;
}

/**
 * Check whether a milestone prompt should fire.
 * Returns the milestone number, or null.
 */
function getPendingMilestone(totalAccepted: number, shownMilestones: number[]): number | null {
  if (STAR_PROMPT_MILESTONES.includes(totalAccepted as (typeof STAR_PROMPT_MILESTONES)[number])) {
    if (!shownMilestones.includes(totalAccepted)) {
      return totalAccepted;
    }
  }
  return null;
}

/**
 * Check whether all milestones are exhausted and the recurring interval has been reached.
 */
function isRecurringReady(
  shownMilestones: number[],
  submissionsSinceLastPrompt: number
): boolean {
  const allMilestonesShown = STAR_PROMPT_MILESTONES.every((m) => shownMilestones.includes(m));
  if (!allMilestonesShown) return false;
  return submissionsSinceLastPrompt >= STAR_PROMPT_RECURRING_INTERVAL;
}

export function shouldShowStarPrompt(trigger: StarPromptTrigger): boolean {
  if (trigger !== 'accepted' || shouldSkipPrompt()) return false;

  const state = starPromptStorage.getState();

  if (getPendingMilestone(state.totalAccepted, state.shownMilestones)) return true;
  if (isRecurringReady(state.shownMilestones, state.submissionsSinceLastPrompt)) return true;

  return false;
}

export async function openGitHubRepo(): Promise<void> {
  await open(GITHUB_REPO_URL, { wait: false });
}

function displayPassivePrompt(): void {
  console.log();
  console.log(
    chalk.yellow('⭐ Enjoying leetcode-cli?') +
      chalk.gray(' Star the repo to help others discover it: ') +
      chalk.cyan.underline(GITHUB_REPO_URL)
  );
  console.log();
}

export async function maybeShowStarPrompt(trigger: StarPromptTrigger): Promise<void> {
  if (trigger === 'accepted') {
    starPromptStorage.incrementSubmissionCount();
  }

  if (!shouldShowStarPrompt(trigger)) return;

  const state = starPromptStorage.getState();
  const milestone = getPendingMilestone(state.totalAccepted, state.shownMilestones);

  if (milestone) {
    starPromptStorage.markMilestoneShown(milestone);
  } else {
    starPromptStorage.markRecurringShown();
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    displayPassivePrompt();
    return;
  }

  console.log();
  const { choice } = await inquirer.prompt<{ choice: 'star' | 'later' | 'dismiss' }>([
    {
      type: 'list',
      name: 'choice',
      message: chalk.yellow(
        'Enjoying leetcode-cli? A GitHub star helps new contributors find the project.'
      ),
      choices: [
        { name: 'Open GitHub to star', value: 'star' },
        { name: 'Maybe later', value: 'later' },
        { name: "Don't ask again", value: 'dismiss' },
      ],
    },
  ]);

  if (choice === 'star') {
    console.log(chalk.gray(`Opening ${GITHUB_REPO_URL}`));
    await openGitHubRepo();
    console.log(chalk.green('Thanks for supporting the project!'));
  } else if (choice === 'dismiss') {
    starPromptStorage.dismissPermanently();
    console.log(chalk.gray("Got it — we won't ask again."));
  }

  console.log();
}
