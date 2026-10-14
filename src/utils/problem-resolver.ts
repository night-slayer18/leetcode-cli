import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { leetcodeClient } from '../api/client.js';
import { requireAuth } from './auth.js';
import { isProblemId, isTitleSlug } from './validation.js';
import type { ProblemDetail } from '../types.js';

export interface ResolveProblemOptions {
  spinner?: Ora | null;
  silent?: boolean;
  failMessage?: string;
}

export interface ResolvedProblemIdentifier {
  problemId: string;
  problem: ProblemDetail | null;
}

/**
 * Checks whether an error represents a "problem not found" response.
 * Handles both GraphQL null responses (Zod validation failure) and
 * ID lookup errors ("Problem #X not found").
 */
export function isProblemNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes('expected object, received null') ||
    /^Problem #.+ not found$/i.test(error.message)
  );
}

/**
 * Validates and resolves a problem by either numeric ID or title slug,
 * returning the full ProblemDetail. Catches Zod null-response errors cleanly
 * and prevents dumping raw Zod validation errors to stdout.
 */
export async function resolveProblem(
  idOrSlug: string,
  options: ResolveProblemOptions = {}
): Promise<ProblemDetail | null> {
  const slug = idOrSlug.trim();
  const isId = isProblemId(slug);
  const isSlug = isTitleSlug(slug);

  if (!isId && !isSlug) {
    if (options.spinner) {
      options.spinner.fail(`Invalid problem ID or name: ${idOrSlug}`);
    } else if (!options.silent) {
      console.log(chalk.red(`Invalid problem ID or name: ${idOrSlug}`));
    }
    if (!options.silent) {
      console.log(chalk.gray('Use a problem ID (e.g. 1) or a problem name (e.g. two-sum)'));
    }
    return null;
  }

  try {
    const problem = isId
      ? await leetcodeClient.getProblemById(slug)
      : await leetcodeClient.getProblem(slug);

    if (!problem) {
      if (options.spinner) {
        options.spinner.fail(`Problem "${idOrSlug}" not found`);
      } else if (!options.silent) {
        console.log(chalk.red(`Problem "${idOrSlug}" not found`));
      }
      return null;
    }

    return problem;
  } catch (error) {
    const notFound = isProblemNotFoundError(error);
    const message = error instanceof Error ? error.message : '';

    if (options.spinner) {
      options.spinner.fail(
        notFound
          ? `Problem "${idOrSlug}" not found`
          : (options.failMessage ?? 'Failed to fetch problem')
      );
    } else if (!options.silent && notFound) {
      console.log(chalk.red(`Problem "${idOrSlug}" not found`));
    }

    if (!options.silent) {
      if (notFound) {
        if (isSlug) {
          console.log(chalk.gray('Check the problem name, or use the problem ID instead.'));
        }
      } else if (message) {
        console.log(chalk.red(message));
      }
    }

    return null;
  }
}

/**
 * Resolves a problem identifier for commands (like `note`) that primarily need
 * the numeric ID, deferring full problem fetching when an ID is already supplied.
 * If a slug is supplied, fetches the problem and returns both the numeric ID and detail.
 */
export async function resolveProblemIdentifier(
  idOrName: string,
  options: { silent?: boolean } = {}
): Promise<ResolvedProblemIdentifier | null> {
  const slug = idOrName.trim();

  if (isProblemId(slug)) {
    return { problemId: slug, problem: null };
  }

  if (!isTitleSlug(slug)) {
    if (!options.silent) {
      console.log(chalk.red(`Invalid problem ID or name: ${idOrName}`));
      console.log(chalk.gray('Use a problem ID (e.g. 1) or a problem name (e.g. two-sum)'));
    }
    return null;
  }

  const { authorized } = await requireAuth();
  if (!authorized) return null;

  const spinner = options.silent
    ? null
    : ora({ text: `Looking up "${slug}"...`, spinner: 'dots' }).start();

  try {
    const problem = await leetcodeClient.getProblem(slug);
    spinner?.succeed(`Found ${problem.questionFrontendId}. ${problem.title}`);
    return { problemId: problem.questionFrontendId, problem };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const notFound = isProblemNotFoundError(error);

    spinner?.fail(notFound ? `Problem "${slug}" not found` : `Failed to look up "${slug}"`);

    if (!options.silent) {
      if (notFound) {
        console.log(chalk.gray('Check the problem name, or use the problem ID instead.'));
      } else if (message) {
        console.log(chalk.red(message));
      }
    }
    return null;
  }
}
