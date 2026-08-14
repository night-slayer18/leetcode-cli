import type { DailyChallenge, Problem, ProblemDetail } from '../../types.js';

interface CnTopicTag {
  name?: string | null;
  nameTranslated?: string | null;
  id?: string | number | null;
}

interface CnQuestion {
  questionId?: string | number | null;
  frontendQuestionId?: string | number | null;
  questionFrontendId?: string | number | null;
  difficulty?: string | null;
  title?: string | null;
  titleCn?: string | null;
  titleSlug?: string | null;
  paidOnly?: boolean | null;
  isPaidOnly?: boolean | null;
  acRate?: number | string | null;
  status?: string | null;
  topicTags?: CnTopicTag[] | null;
}

interface CnProblemListItem {
  frontendQuestionId?: string | number | null;
  title?: string | null;
  titleCn?: string | null;
  titleSlug?: string | null;
  difficulty?: string | null;
  paidOnly?: boolean | null;
  acRate?: number | string | null;
  status?: string | null;
  topicTags?: Array<CnTopicTag & { slug?: string | null }> | null;
}

interface CnProblemDetailTag {
  name?: string | null;
  slug?: string | null;
  translatedName?: string | null;
}

interface CnProblemDetailShape {
  question: {
    questionId?: string | number | null;
    questionFrontendId?: string | number | null;
    title?: string | null;
    translatedTitle?: string | null;
    titleSlug?: string | null;
    translatedContent?: string | null;
    difficulty?: string | null;
    isPaidOnly?: boolean | null;
    acRate?: number | string | null;
    status?: string | null;
    topicTags?: CnProblemDetailTag[] | null;
    codeSnippets?: Array<{ lang: string; langSlug: string; code: string }> | null;
    sampleTestCase?: string | null;
    exampleTestcases?: string | null;
    hints?: string[] | null;
    stats?: string | null;
  };
}

interface CnDailyRecord {
  date?: string;
  link?: string;
  question?: CnQuestion;
}

interface CnAcceptedItem {
  difficulty?: string;
  count?: number;
}

interface CnProfileShape {
  userProfilePublicProfile?: {
    siteRanking?: number;
    profile?: {
      userSlug?: string;
      realName?: string;
    };
  } | null;
  userProfileUserQuestionProgress?: {
    numAcceptedQuestions?: CnAcceptedItem[];
  } | null;
}

interface CnSkillScore {
  score?: number;
  topicArea?: {
    name?: string;
    slug?: string;
  } | null;
}

interface CnSkillShape {
  userProfilePublicProfile?: {
    profile?: {
      skillSet?: {
        topicAreaScores?: CnSkillScore[];
      } | null;
    } | null;
  } | null;
}

function toTitleCaseDifficulty(difficulty?: string | null): Problem['difficulty'] {
  const value = (difficulty ?? '').toLowerCase();
  if (value === 'easy') return 'Easy';
  if (value === 'hard') return 'Hard';
  return 'Medium';
}

function toStatus(status: string | null | undefined): Problem['status'] {
  const value = (status ?? '').toLowerCase();
  if (value === 'ac') return 'ac';
  if (value === 'notac' || value === 'tried') return 'notac';
  if (value === 'not_started') return null;
  return null;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toProblem(question: CnQuestion): Problem {
  const title = question.titleCn || question.title || 'Unknown Problem';
  const titleSlug = question.titleSlug || toSlug(title);
  const tags = (question.topicTags ?? []).map((tag) => {
    const tagName = tag.nameTranslated || tag.name || 'Tag';
    return {
      name: tagName,
      slug: tag.id !== undefined && tag.id !== null ? String(tag.id) : toSlug(tagName),
    };
  });

  return {
    questionId: String(question.questionId ?? ''),
    questionFrontendId: String(question.frontendQuestionId ?? question.questionFrontendId ?? ''),
    title,
    titleSlug,
    difficulty: toTitleCaseDifficulty(question.difficulty),
    isPaidOnly: Boolean(question.paidOnly ?? question.isPaidOnly),
    acRate: Number(question.acRate ?? 0),
    topicTags: tags,
    status: toStatus(question.status),
  };
}

function toProblemFromListEntry(question: CnProblemListItem): Problem {
  const title = question.titleCn || question.title || 'Unknown Problem';
  const titleSlug = question.titleSlug || toSlug(title);
  const tags = (question.topicTags ?? []).map((tag) => {
    const tagName = tag.nameTranslated || tag.name || 'Tag';
    return {
      name: tagName,
      slug:
        tag.slug ||
        (tag.id !== undefined && tag.id !== null ? String(tag.id) : toSlug(tagName)),
    };
  });

  return {
    questionId: String(question.frontendQuestionId ?? ''),
    questionFrontendId: String(question.frontendQuestionId ?? ''),
    title,
    titleSlug,
    difficulty: toTitleCaseDifficulty(question.difficulty),
    isPaidOnly: Boolean(question.paidOnly),
    acRate: Number(question.acRate ?? 0),
    topicTags: tags,
    status: toStatus(question.status),
  };
}

export function normalizeCnDailyChallenge(input: {
  todayRecord?: CnDailyRecord[];
}): DailyChallenge {
  const record = input.todayRecord?.[0];
  if (!record || !record.question) {
    throw new Error('No daily challenge found for leetcode.cn');
  }

  const problem = toProblem(record.question);

  return {
    date: record.date ?? new Date().toISOString().slice(0, 10),
    link: record.link || `/problems/${problem.titleSlug}/`,
    question: problem,
  };
}

export function normalizeCnProblemList(input: {
  problemsetQuestionList: { total: number; questions: CnProblemListItem[] };
}): { total: number; problems: Problem[] } {
  return {
    total: input.problemsetQuestionList.total,
    problems: input.problemsetQuestionList.questions.map((question) =>
      toProblemFromListEntry(question)
    ),
  };
}

export function normalizeCnProblemDetail(input: CnProblemDetailShape): ProblemDetail {
  const question = input.question;
  const title = question.translatedTitle || question.title || 'Unknown Problem';
  const titleSlug = question.titleSlug || toSlug(title);
  const topicTags = (question.topicTags ?? []).map((tag) => ({
    name: tag.translatedName || tag.name || 'Tag',
    slug: tag.slug || toSlug(tag.translatedName || tag.name || 'tag'),
  }));

  return {
    questionId: String(question.questionId ?? ''),
    questionFrontendId: String(question.questionFrontendId ?? ''),
    title,
    titleSlug,
    content: question.translatedContent ?? null,
    difficulty: toTitleCaseDifficulty(question.difficulty),
    isPaidOnly: Boolean(question.isPaidOnly),
    acRate: Number(question.acRate ?? 0),
    topicTags,
    codeSnippets: question.codeSnippets ?? null,
    sampleTestCase: question.sampleTestCase ?? '',
    exampleTestcases: question.exampleTestcases ?? '',
    hints: question.hints ?? [],
    companyTags: null,
    stats: question.stats ?? '{}',
    status: toStatus(question.status),
  };
}

export function normalizeCnUserProfile(
  username: string,
  input: CnProfileShape
): {
  username: string;
  realName: string;
  ranking: number;
  acSubmissionNum: Array<{ difficulty: string; count: number }>;
  streak: number;
  totalActiveDays: number;
  submissionCalendar: string;
} {
  const publicProfile = input.userProfilePublicProfile?.profile;
  const accepted = input.userProfileUserQuestionProgress?.numAcceptedQuestions ?? [];
  const countMap = new Map<string, number>([
    ['All', 0],
    ['Easy', 0],
    ['Medium', 0],
    ['Hard', 0],
  ]);

  for (const item of accepted) {
    const key = toTitleCaseDifficulty(item.difficulty);
    const value = Number(item.count ?? 0);
    countMap.set(key, value);
  }

  const all =
    (countMap.get('Easy') ?? 0) + (countMap.get('Medium') ?? 0) + (countMap.get('Hard') ?? 0);
  countMap.set('All', Math.max(countMap.get('All') ?? 0, all));

  return {
    username: publicProfile?.userSlug || username,
    realName: publicProfile?.realName || username,
    ranking: Number(input.userProfilePublicProfile?.siteRanking ?? 0),
    acSubmissionNum: [
      { difficulty: 'All', count: countMap.get('All') ?? 0 },
      { difficulty: 'Easy', count: countMap.get('Easy') ?? 0 },
      { difficulty: 'Medium', count: countMap.get('Medium') ?? 0 },
      { difficulty: 'Hard', count: countMap.get('Hard') ?? 0 },
    ],
    streak: 0,
    totalActiveDays: 0,
    submissionCalendar: '',
  };
}

export function normalizeCnSkillStats(input: CnSkillShape): {
  fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
} {
  const topicScores = input.userProfilePublicProfile?.profile?.skillSet?.topicAreaScores ?? [];
  const ordered = topicScores
    .map((entry) => ({
      tagName: entry.topicArea?.name || 'Topic',
      tagSlug: entry.topicArea?.slug || toSlug(entry.topicArea?.name || 'topic'),
      problemsSolved: Math.max(0, Math.round(Number(entry.score ?? 0))),
    }))
    .sort((a, b) => b.problemsSolved - a.problemsSolved);

  if (ordered.length === 0) {
    return { fundamental: [], intermediate: [], advanced: [] };
  }

  const third = Math.max(1, Math.ceil(ordered.length / 3));
  const advanced = ordered.slice(0, third);
  const intermediate = ordered.slice(third, third * 2);
  const fundamental = ordered.slice(third * 2);

  return { fundamental, intermediate, advanced };
}
