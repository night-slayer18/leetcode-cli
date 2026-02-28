import type { Command, AppMsg, ProblemListFilters } from '../types.js';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { config } from '../../storage/config.js';
import {
  getCodeTemplate,
  generateSolutionFile,
  getSolutionFileName,
  getPremiumPlaceholderCode,
} from '../../utils/templates.js';
import { normalizeLanguageInput, resolveLeetCodeLangSlug } from '../../utils/languages.js';
import { snapshotStorage } from '../../storage/snapshots.js';
import { diffLines } from 'diff';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { requestExit } from '../runtime.js';
import got from 'got';

const RELEASES_URL =
  'https://raw.githubusercontent.com/night-slayer18/leetcode-cli/main/docs/releases.md';

type Dispatch = (msg: AppMsg) => void;

let timerInterval: NodeJS.Timeout | null = null;

export function executeCommand(cmd: Command, dispatch: Dispatch): void {
  switch (cmd.type) {
    case 'CMD_NONE':
      return;

    case 'CMD_BATCH':
      for (const c of cmd.commands) {
        executeCommand(c, dispatch);
      }
      return;

    case 'CMD_FETCH_STATS':
      fetchStats(dispatch);
      return;

    case 'CMD_CHECK_AUTH':
      checkAuth(dispatch);
      return;

    case 'CMD_FETCH_PROBLEMS':
      fetchProblems(cmd.filters, cmd.append, dispatch);
      return;

    case 'CMD_FETCH_PROBLEM_DETAIL':
      fetchProblemDetail(cmd.slug, dispatch);
      return;

    case 'CMD_START_TIMER_SUBSCRIPTION':
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        dispatch({ type: 'TIMER_TICK' });
      }, cmd.intervalMs);
      return;

    case 'CMD_STOP_TIMER_SUBSCRIPTION':
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      return;

    case 'CMD_PICK_PROBLEM':
      pickProblem(cmd.slug, dispatch);
      return;

    case 'CMD_TEST_SOLUTION':
      testSolution(cmd.slug, dispatch);
      return;

    case 'CMD_SUBMIT_SOLUTION':
      submitSolution(cmd.slug, dispatch);
      return;

    case 'CMD_SAVE_CONFIG':
      saveConfig(cmd.key, cmd.value);
      return;

    case 'CMD_EXIT':
      requestExit();
      return;

    case 'CMD_FETCH_DAILY':
      fetchDaily(dispatch);
      return;

    case 'CMD_FETCH_RANDOM':
      fetchRandom(dispatch);
      return;

    case 'CMD_FETCH_SUBMISSIONS':
      fetchSubmissions(cmd.slug, dispatch);
      return;

    case 'CMD_LOAD_NOTE':
      loadNote(cmd.problemId, dispatch);
      return;

    case 'CMD_DIFF_SNAPSHOT':
      diffSnapshot(cmd.slug, cmd.snapshotId, dispatch);
      return;

    case 'CMD_RESTORE_SNAPSHOT':
      restoreSnapshot(cmd.slug, cmd.snapshotId, dispatch);
      return;

    case 'CMD_FETCH_CHANGELOG':
      fetchChangelog(dispatch);
      return;

    case 'CMD_LOGOUT':
      logout(dispatch);
      return;

    case 'CMD_LOGIN':
      login(cmd.session, cmd.csrf, dispatch);
      return;

    default:
      return;
  }
}

async function checkAuth(dispatch: Dispatch): Promise<void> {
  const creds = credentials.get();
  if (!creds) {
    dispatch({ type: 'AUTH_CHECK_COMPLETE', user: null });
    return;
  }

  leetcodeClient.setCredentials(creds);

  try {
    const status = await leetcodeClient.checkAuth();
    if (status.isSignedIn && status.username) {
      dispatch({ type: 'AUTH_CHECK_COMPLETE', user: { username: status.username } });
    } else {
      dispatch({ type: 'AUTH_CHECK_COMPLETE', user: null });
    }
  } catch {
    dispatch({ type: 'AUTH_CHECK_COMPLETE', user: null });
  }
}

async function fetchProblems(
  filters: ProblemListFilters,
  append: boolean,
  dispatch: Dispatch
): Promise<void> {
  dispatch({ type: 'LIST_FETCH_START' });

  try {
    const creds = credentials.get();
    if (creds) leetcodeClient.setCredentials(creds);

    const result = await leetcodeClient.getProblems(filters);

    const problems = result.problems.map((p) => ({
      questionId: p.questionId,
      questionFrontendId: p.questionFrontendId,
      title: p.title,
      titleSlug: p.titleSlug,
      difficulty: p.difficulty,
      isPaidOnly: p.isPaidOnly,
      acRate: p.acRate,
      topicTags: p.topicTags,
      status: p.status,
    }));

    dispatch({ type: 'LIST_FETCH_SUCCESS', problems, total: result.total, append });
  } catch (err) {
    dispatch({
      type: 'LIST_FETCH_ERROR',
      error: err instanceof Error ? err.message : 'Failed to fetch problems',
    });
  }
}

async function fetchProblemDetail(slug: string, dispatch: Dispatch): Promise<void> {
  try {
    const detail = await leetcodeClient.getProblem(slug);
    dispatch({ type: 'PROBLEM_DETAIL_LOADED', detail });
  } catch (err) {
    dispatch({
      type: 'PROBLEM_DETAIL_ERROR',
      error: err instanceof Error ? err.message : 'Failed to fetch problem',
    });
  }
}

async function fetchStats(dispatch: Dispatch): Promise<void> {
  dispatch({ type: 'STATS_FETCH_START' });

  try {
    const creds = credentials.get();
    if (!creds) {
      throw new Error('You must be logged in to view stats');
    }
    leetcodeClient.setCredentials(creds);

    const status = await leetcodeClient.checkAuth();
    if (!status.isSignedIn || !status.username) {
      throw new Error('Not logged in');
    }

    const [profile, skills, daily] = await Promise.all([
      leetcodeClient.getUserProfile(status.username),
      leetcodeClient.getSkillStats(status.username),
      leetcodeClient.getDailyChallenge(),
    ]);

    dispatch({
      type: 'STATS_FETCH_SUCCESS',
      stats: profile,
      skills: skills,
      daily: daily,
    });
  } catch (err) {
    dispatch({
      type: 'STATS_FETCH_ERROR',
      error: err instanceof Error ? err.message : 'Failed to fetch statistics',
    });
  }
}

function saveConfig(key: string, value: string): void {
  switch (key) {
    case 'language':
      config.setLanguage(value as any);
      break;
    case 'editor':
      config.setEditor(value);
      break;
    case 'workdir':
      config.setWorkDir(value);
      break;
    case 'repo':
      config.setRepo(value);
      break;
  }
}

async function getSolutionCode(
  slug: string
): Promise<{ code: string; lang: string; questionId: string }> {
  const configLang = config.getLanguage();

  const problem = await leetcodeClient.getProblem(slug);
  const leetcodeLang = resolveLeetCodeLangSlug(configLang, problem.codeSnippets);

  const fileName = getSolutionFileName(problem.questionFrontendId, problem.titleSlug, configLang);

  const workDir = config.getWorkDir();
  const difficulty = problem.difficulty;
  const category =
    problem.topicTags.length > 0
      ? problem.topicTags[0].name.replace(/[^\w\s-]/g, '').trim()
      : 'Uncategorized';

  const filePath = path.join(workDir, difficulty, category, fileName);

  try {
    const code = await fs.readFile(filePath, 'utf-8');
    return { code, lang: leetcodeLang, questionId: problem.questionId };
  } catch (e) {
    const rootPath = path.join(workDir, fileName);
    try {
      const code = await fs.readFile(rootPath, 'utf-8');
      return { code, lang: leetcodeLang, questionId: problem.questionId };
    } catch {
      throw new Error(
        `Could not read solution file at ${filePath}. Make sure you have picked the problem first.`
      );
    }
  }
}

async function pickProblem(slug: string, dispatch: Dispatch): Promise<void> {
  try {
    const problem = await leetcodeClient.getProblem(slug);

    const langInput = config.getLanguage();
    const language = normalizeLanguageInput(langInput);
    if (!language) {
      throw new Error(`Unsupported language: ${langInput}`);
    }

    const snippets = problem.codeSnippets ?? [];
    const template = getCodeTemplate(snippets, language);

    if (snippets.length > 0 && !template) {
      throw new Error(`No code template available for ${language}`);
    }

    const code = template ? template.code : getPremiumPlaceholderCode(language, problem.title);

    const content = generateSolutionFile(
      problem.questionFrontendId,
      problem.titleSlug,
      problem.title,
      problem.difficulty,
      code,
      language,
      problem.content ?? undefined
    );

    const workDir = config.getWorkDir();
    const difficulty = problem.difficulty;
    const category =
      problem.topicTags.length > 0
        ? problem.topicTags[0].name.replace(/[^\w\s-]/g, '').trim()
        : 'Uncategorized';

    const targetDir = path.join(workDir, difficulty, category);

    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (e) {}

    const fileName = getSolutionFileName(problem.questionFrontendId, problem.titleSlug, language);
    const filePath = path.join(targetDir, fileName);

    if (!existsSync(filePath)) {
      await fs.writeFile(filePath, content, 'utf-8');
      dispatch({ type: 'PROBLEM_ACTION_SUCCESS', message: `Created ${fileName}` });
    } else {
      dispatch({ type: 'PROBLEM_ACTION_SUCCESS', message: `File ready: ${fileName}` });
    }
  } catch (err) {
    dispatch({
      type: 'PROBLEM_ACTION_ERROR',
      error: err instanceof Error ? err.message : 'Failed to pick problem',
    });
  }
}

async function testSolution(slug: string, dispatch: Dispatch): Promise<void> {
  try {
    const { code, lang } = await getSolutionCode(slug);
    const problem = await leetcodeClient.getProblem(slug);

    const result = await leetcodeClient.testSolution(
      slug,
      code,
      lang,
      problem.exampleTestcases,
      problem.questionId
    );

    dispatch({ type: 'PROBLEM_TEST_RESULT', result });
  } catch (err) {
    dispatch({
      type: 'PROBLEM_ACTION_ERROR',
      error: err instanceof Error ? err.message : 'Test failed',
    });
  }
}

async function submitSolution(slug: string, dispatch: Dispatch): Promise<void> {
  try {
    const { code, lang } = await getSolutionCode(slug);
    const problem = await leetcodeClient.getProblem(slug);

    const result = await leetcodeClient.submitSolution(slug, code, lang, problem.questionId);

    dispatch({ type: 'PROBLEM_SUBMIT_RESULT', result });
  } catch (err) {
    dispatch({
      type: 'PROBLEM_ACTION_ERROR',
      error: err instanceof Error ? err.message : 'Submit failed',
    });
  }
}

async function fetchDaily(dispatch: Dispatch): Promise<void> {
  try {
    const daily = await leetcodeClient.getDailyChallenge();
    if (daily && daily.question && daily.question.titleSlug) {
      dispatch({ type: 'FETCH_DAILY_SUCCESS', slug: daily.question.titleSlug });
    } else {
      throw new Error('No daily challenge found');
    }
  } catch (err) {
    dispatch({
      type: 'GLOBAL_ERROR',
      error: err instanceof Error ? err.message : 'Failed to fetch daily challenge',
    });
  }
}

async function fetchRandom(dispatch: Dispatch): Promise<void> {
  try {
    const slug = await leetcodeClient.getRandomProblem();
    if (slug) {
      dispatch({ type: 'FETCH_RANDOM_SUCCESS', slug: slug });
    } else {
      throw new Error('No random problem found');
    }
  } catch (err) {
    dispatch({
      type: 'GLOBAL_ERROR',
      error: err instanceof Error ? err.message : 'Failed to fetch random problem',
    });
  }
}

async function loadNote(problemId: string, dispatch: Dispatch): Promise<void> {
  try {
    const notesDir = path.join(config.getWorkDir(), '.notes');
    const notePath = path.join(notesDir, `${problemId}.md`);

    if (existsSync(notePath)) {
      const content = await fs.readFile(notePath, 'utf-8');
      dispatch({ type: 'PROBLEM_NOTE_LOADED', content });
    } else {
      dispatch({
        type: 'PROBLEM_NOTE_LOADED',
        content: 'No notes found. Press "n" again to create/edit.',
      });
    }
  } catch (err) {
    dispatch({ type: 'PROBLEM_ACTION_ERROR', error: 'Failed to load note' });
  }
}

async function diffSnapshot(slug: string, snapshotId: string, dispatch: Dispatch): Promise<void> {
  try {
    const { code: currentCode } = await getSolutionCode(slug);

    const problem = await leetcodeClient.getProblem(slug);
    const problemId = problem.questionFrontendId;

    const snapshot = snapshotStorage.get(problemId, snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');

    const snapshotCode = snapshotStorage.getCode(problemId, snapshot);

    const diff = diffLines(currentCode, snapshotCode);

    let output = '';
    diff.forEach((part: any) => {
      const color = part.added ? '[green]' : part.removed ? '[red]' : '[grey]';
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
      part.value.split('\n').forEach((line: string) => {
        if (line) output += `${color}${prefix}${line}\n`;
      });
    });

    dispatch({ type: 'PROBLEM_DIFF_LOADED', content: output });
  } catch (err) {
    dispatch({
      type: 'PROBLEM_ACTION_ERROR',
      error: err instanceof Error ? err.message : 'Diff failed',
    });
  }
}

async function restoreSnapshot(
  slug: string,
  snapshotId: string,
  dispatch: Dispatch
): Promise<void> {
  try {
    const problem = await leetcodeClient.getProblem(slug);
    const problemId = problem.questionFrontendId;

    const snapshot = snapshotStorage.get(problemId, snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');

    const snapshotCode = snapshotStorage.getCode(problemId, snapshot);

    const configLang = config.getLanguage();
    const fileName = getSolutionFileName(
      problem.questionFrontendId,
      problem.titleSlug,
      (snapshot.language as any) || configLang
    );
    const workDir = config.getWorkDir();
    const difficulty = problem.difficulty;
    const category =
      problem.topicTags.length > 0
        ? problem.topicTags[0].name.replace(/[^\w\s-]/g, '').trim()
        : 'Uncategorized';
    const targetDir = path.join(workDir, difficulty, category);
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, snapshotCode, 'utf-8');

    dispatch({ type: 'PROBLEM_ACTION_SUCCESS', message: `Restored snapshot '${snapshot.name}'` });
  } catch (err) {
    dispatch({ type: 'PROBLEM_ACTION_ERROR', error: 'Restore failed' });
  }
}
async function fetchSubmissions(slug: string, dispatch: Dispatch): Promise<void> {
  try {
    const submissions = await leetcodeClient.getSubmissionList(slug, 20);
    dispatch({ type: 'PROBLEM_SUBMISSIONS_LOADED', submissions });
  } catch (err) {
    dispatch({
      type: 'PROBLEM_SUBMISSIONS_ERROR',
      error: err instanceof Error ? err.message : 'Failed to fetch submissions',
    });
  }
}

async function fetchChangelog(dispatch: Dispatch): Promise<void> {
  dispatch({ type: 'CHANGELOG_FETCH_START' });
  try {
    const content = await got(RELEASES_URL).text();
    dispatch({ type: 'CHANGELOG_FETCH_SUCCESS', content });
  } catch (e: any) {
    dispatch({ type: 'CHANGELOG_FETCH_ERROR', error: e.message || 'Failed to fetch changelog' });
  }
}

export function shutdownEffects(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function logout(dispatch: Dispatch): void {
  credentials.clear();

  dispatch({ type: 'AUTH_CHECK_COMPLETE', user: null });
}

async function login(session: string, csrf: string, dispatch: Dispatch): Promise<void> {
  const creds = { session, csrfToken: csrf };
  leetcodeClient.setCredentials(creds);

  try {
    const status = await leetcodeClient.checkAuth();
    if (status.isSignedIn && status.username) {
      credentials.set(creds);
      dispatch({ type: 'LOGIN_SUCCESS', username: status.username });
      // Also update global app state
      setTimeout(() => {
        dispatch({ type: 'AUTH_CHECK_COMPLETE', user: { username: status.username! } });
      }, 1000);
    } else {
      dispatch({
        type: 'LOGIN_ERROR',
        error: 'Invalid credentials. Please check your session cookies.',
      });
    }
  } catch (e) {
    dispatch({ type: 'LOGIN_ERROR', error: e instanceof Error ? e.message : 'Login failed' });
  }
}
