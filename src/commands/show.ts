// Show command - display problem description
import ora from 'ora';
import { requireAuth } from '../utils/auth.js';
import { displayProblemDetail } from '../utils/display.js';
import { resolveProblem } from '../utils/problem-resolver.js';

export async function showCommand(idOrSlug: string): Promise<void> {
  const { authorized } = await requireAuth();
  if (!authorized) return;

  const spinner = ora('Fetching problem...').start();

  const problem = await resolveProblem(idOrSlug, { spinner });
  if (!problem) return;

  spinner.stop();
  displayProblemDetail(problem);
}
