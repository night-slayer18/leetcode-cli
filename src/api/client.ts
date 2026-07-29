// LeetCode API Client
import got, { Got } from 'got';
import { z } from 'zod';
import type {
  Contest,
  ContestDetail,
  DailyChallenge,
  LeetCodeCredentials,
  LeetCodeSite,
  Problem,
  ProblemDetail,
  ProblemListFilters,
  Submission,
  SubmissionDetails,
  SubmissionResult,
  TestResult,
} from '../types.js';
import {
  CnProblemDetailSchema,
  CnProblemListSchema,
  CnDailyChallengeSchema,
  CnContestHistorySchema,
  CnSkillStatsSchema,
  CnUserProfileSchema,
  ContestDetailResponseSchema,
  ContestListSchema,
  DailyChallengeSchema,
  ProblemDetailSchema,
  ProblemSchema,
  SubmissionDetailsSchema,
  SubmissionResultSchema,
  SubmissionSchema,
  TestResultSchema,
  UserProfileSchema,
  UserStatusSchema,
} from '../schemas/api.js';
import { getQueryPack } from './query-resolver.js';
import type { QueryPack } from './queries.global.js';
import {
  normalizeCnDailyChallenge,
  normalizeCnProblemDetail,
  normalizeCnProblemList,
  normalizeCnSkillStats,
  normalizeCnUserProfile,
} from './adapters/index.js';

const BASE_URLS: Record<LeetCodeSite, string> = {
  'leetcode.com': 'https://leetcode.com',
  'leetcode.cn': 'https://leetcode.cn',
};

type GraphQLOperation =
  | 'USER_STATUS'
  | 'PROBLEM_LIST'
  | 'PROBLEM_DETAIL'
  | 'DAILY_CHALLENGE'
  | 'RANDOM_PROBLEM'
  | 'USER_PROFILE'
  | 'SKILL_STATS'
  | 'SUBMISSION_LIST'
  | 'SUBMISSION_DETAILS'
  | 'CONTEST_LIST'
  | 'CONTEST_DETAIL';

const OPERATION_LABEL: Record<GraphQLOperation, string> = {
  USER_STATUS: 'user status',
  PROBLEM_LIST: 'problem list',
  PROBLEM_DETAIL: 'problem detail',
  DAILY_CHALLENGE: 'daily challenge',
  RANDOM_PROBLEM: 'random problem',
  USER_PROFILE: 'user profile',
  SKILL_STATS: 'skill stats',
  SUBMISSION_LIST: 'submission list',
  SUBMISSION_DETAILS: 'submission details',
  CONTEST_LIST: 'contest list',
  CONTEST_DETAIL: 'contest detail',
};

function isSchemaMismatchError(message: string): boolean {
  return /(cannot query field|unknown argument|unknown type|did you mean|validation error)/i.test(
    message
  );
}

export class LeetCodeClient {
  private client: Got;
  private credentials: LeetCodeCredentials | null = null;
  private site: LeetCodeSite;
  private queries: QueryPack;

  constructor(site: LeetCodeSite = 'leetcode.com') {
    this.site = site;
    this.queries = getQueryPack(site);
    this.client = this.createHttpClient(site);
  }

  private createHttpClient(site: LeetCodeSite): Got {
    const baseUrl = BASE_URLS[site];
    return got.extend({
      prefixUrl: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Origin: baseUrl,
        Referer: `${baseUrl}/`,
      },
      timeout: { request: 30000 },
      retry: { limit: 2 },
    });
  }

  setSite(site: LeetCodeSite): void {
    if (site === this.site) {
      return;
    }

    this.site = site;
    this.queries = getQueryPack(site);
    this.client = this.createHttpClient(site);

    if (this.credentials) {
      this.setCredentials(this.credentials);
    }
  }

  getSite(): LeetCodeSite {
    return this.site;
  }

  setCredentials(credentials: LeetCodeCredentials): void {
    this.credentials = credentials;
    this.client = this.client.extend({
      headers: {
        Cookie: `LEETCODE_SESSION=${credentials.session}; csrftoken=${credentials.csrfToken}`,
        'X-CSRFToken': credentials.csrfToken,
      },
    });
  }

  getCredentials(): LeetCodeCredentials | null {
    return this.credentials;
  }

  private resolveGraphQLEndpoints(operation: GraphQLOperation): readonly string[] {
    if (this.site === 'leetcode.cn') {
      if (operation === 'SUBMISSION_LIST' || operation === 'SUBMISSION_DETAILS') {
        return ['graphql/noj-go/', 'graphql/'];
      }
      return ['graphql/'];
    }

    return ['graphql'];
  }

  private formatGraphQLError(operation: GraphQLOperation, message: string): string {
    const label = OPERATION_LABEL[operation];

    if (this.site === 'leetcode.cn') {
      if (isSchemaMismatchError(message)) {
        return `LeetCode CN schema mismatch for ${label}: ${message}. If you intended Global LeetCode, run: leetcode config --site leetcode.com`;
      }
      return `LeetCode CN API error for ${label}: ${message}`;
    }

    return `GraphQL Error (${label}): ${message}`;
  }

  private async graphql<T>(
    operation: GraphQLOperation,
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<T> {
    const endpoints = this.resolveGraphQLEndpoints(operation);
    let lastError: unknown = null;

    for (const endpoint of endpoints) {
      try {
        const response = await this.client
          .post(endpoint, {
            json: { query, variables },
          })
          .json<{ data?: T; errors?: Array<{ message: string }> }>();

        if (response.errors?.length) {
          const message = response.errors.map((entry) => entry.message).join('; ');
          lastError = new Error(this.formatGraphQLError(operation, message));
          continue;
        }

        if (response.data === undefined) {
          lastError = new Error(this.formatGraphQLError(operation, 'Empty GraphQL response data'));
          continue;
        }

        return response.data;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }

    throw new Error(`Failed to fetch ${OPERATION_LABEL[operation]}`);
  }

  async checkAuth(): Promise<{ isSignedIn: boolean; username: string | null }> {
    const data = await this.graphql<{
      userStatus: { isSignedIn: boolean; username: string | null };
    }>('USER_STATUS', this.queries.USER_STATUS_QUERY);

    const validated = UserStatusSchema.parse(data.userStatus);
    return validated;
  }

  async getProblems(
    filters: ProblemListFilters = {}
  ): Promise<{ total: number; problems: Problem[] }> {
    const variables: Record<string, unknown> = {
      categorySlug: '',
      limit: filters.limit ?? 50,
      skip: filters.skip ?? 0,
      filters: {},
    };

    if (filters.difficulty) {
      (variables.filters as Record<string, unknown>).difficulty = filters.difficulty;
    }
    if (filters.status) {
      (variables.filters as Record<string, unknown>).status = filters.status;
    }
    if (filters.tags?.length) {
      (variables.filters as Record<string, unknown>).tags = filters.tags;
    }
    if (filters.searchKeywords) {
      (variables.filters as Record<string, unknown>).searchKeywords = filters.searchKeywords;
    }

    if (this.site === 'leetcode.cn') {
      const data = await this.graphql<unknown>(
        'PROBLEM_LIST',
        this.queries.PROBLEM_LIST_QUERY,
        variables
      );
      const validated = CnProblemListSchema.parse(data);
      return normalizeCnProblemList(validated);
    }

    const data = await this.graphql<{
      problemsetQuestionList: { total: number; questions: Problem[] };
    }>('PROBLEM_LIST', this.queries.PROBLEM_LIST_QUERY, variables);

    const validatedProblems = z.array(ProblemSchema).parse(data.problemsetQuestionList.questions);

    return {
      total: data.problemsetQuestionList.total,
      problems: validatedProblems,
    };
  }

  async getProblem(titleSlug: string): Promise<ProblemDetail> {
    if (this.site === 'leetcode.cn') {
      const data = await this.graphql<unknown>(
        'PROBLEM_DETAIL',
        this.queries.PROBLEM_DETAIL_QUERY,
        {
          titleSlug,
        }
      );
      const validated = CnProblemDetailSchema.parse(data);
      return normalizeCnProblemDetail(validated);
    }

    const data = await this.graphql<{ question: ProblemDetail }>(
      'PROBLEM_DETAIL',
      this.queries.PROBLEM_DETAIL_QUERY,
      {
        titleSlug,
      }
    );

    const validated = ProblemDetailSchema.parse(data.question);
    return validated as ProblemDetail;
  }

  async getProblemById(id: string): Promise<ProblemDetail> {
    if (this.site === 'leetcode.cn') {
      const limit = 50;
      let skip = 0;
      let total = 0;
      let problem: Problem | undefined;

      do {
        const result = await this.getProblems({ searchKeywords: id, limit, skip });
        total = result.total;
        problem = result.problems.find((p) => p.questionFrontendId === id);
        skip += limit;
      } while (!problem && skip < total);

      if (!problem) {
        throw new Error(`Problem #${id} not found`);
      }

      return this.getProblem(problem.titleSlug);
    }

    const { problems } = await this.getProblems({ searchKeywords: id, limit: 10 });
    const problem = problems.find((p) => p.questionFrontendId === id);

    if (!problem) {
      throw new Error(`Problem #${id} not found`);
    }

    return this.getProblem(problem.titleSlug);
  }

  async getDailyChallenge(): Promise<DailyChallenge> {
    if (this.site === 'leetcode.cn') {
      const data = await this.graphql<unknown>(
        'DAILY_CHALLENGE',
        this.queries.DAILY_CHALLENGE_QUERY
      );
      const validated = CnDailyChallengeSchema.parse(data);
      return normalizeCnDailyChallenge(validated);
    }

    const data = await this.graphql<{
      activeDailyCodingChallengeQuestion: DailyChallenge;
    }>('DAILY_CHALLENGE', this.queries.DAILY_CHALLENGE_QUERY);

    const validated = DailyChallengeSchema.parse(data.activeDailyCodingChallengeQuestion);
    return validated as DailyChallenge;
  }

  async getContests(): Promise<Contest[]> {
    if (this.site === 'leetcode.cn') {
      const pageSize = 100;
      const contests: Contest[] = [];
      let pageNum = 1;
      let totalNum = 0;

      do {
        const data = await this.graphql<unknown>(
          'CONTEST_LIST',
          this.queries.CONTEST_LIST_QUERY,
          { pageNum, pageSize }
        );
        const validated = CnContestHistorySchema.parse(data);
        const page = validated.contestHistory.contests;

        if (pageNum === 1) {
          totalNum = validated.contestHistory.totalNum;
        }

        if (totalNum > contests.length && page.length === 0) {
          throw new Error('LeetCode CN contest history returned an incomplete page');
        }

        contests.push(
          ...page.map((contest) => ({
            title: contest.title,
            titleSlug: contest.titleSlug,
            startTime: contest.startTime,
            duration: contest.duration,
            originStartTime: contest.originStartTime,
            isVirtual: contest.isVirtual,
            containsPremium: contest.containsPremium,
          }))
        );
        pageNum += 1;
      } while (contests.length < totalNum);

      return contests;
    }

    const data = await this.graphql<unknown>('CONTEST_LIST', this.queries.CONTEST_LIST_QUERY);
    const validated = ContestListSchema.parse(data);
    return validated.allContests;
  }

  async getContest(titleSlug: string): Promise<ContestDetail> {
    const data = await this.graphql<unknown>('CONTEST_DETAIL', this.queries.CONTEST_DETAIL_QUERY, {
      titleSlug,
    });
    const validated = ContestDetailResponseSchema.parse(data);

    if (!validated.contest) {
      throw new Error(`Contest "${titleSlug}" not found`);
    }

    return validated.contest;
  }

  async getRandomProblem(filters: ProblemListFilters = {}): Promise<string> {
    const variables: Record<string, unknown> = {
      categorySlug: '',
      filters: {},
    };

    if (filters.difficulty) {
      (variables.filters as Record<string, unknown>).difficulty = filters.difficulty;
    }
    if (filters.tags?.length) {
      (variables.filters as Record<string, unknown>).tags = filters.tags;
    }

    const data = await this.graphql<{
      randomQuestion: { titleSlug: string };
    }>('RANDOM_PROBLEM', this.queries.RANDOM_PROBLEM_QUERY, variables);

    const validated = z.object({ titleSlug: z.string() }).parse(data.randomQuestion);
    return validated.titleSlug;
  }

  async getUserProfile(username: string): Promise<{
    username: string;
    realName: string;
    ranking: number;
    acSubmissionNum: Array<{ difficulty: string; count: number }>;
    streak: number;
    totalActiveDays: number;
    submissionCalendar: string;
  }> {
    if (this.site === 'leetcode.cn') {
      const data = await this.graphql<unknown>('USER_PROFILE', this.queries.USER_PROFILE_QUERY, {
        username,
      });
      const validated = CnUserProfileSchema.parse(data);
      return normalizeCnUserProfile(username, validated);
    }

    const data = await this.graphql<{
      matchedUser: {
        username: string;
        profile: { realName: string; ranking: number };
        submitStatsGlobal: {
          acSubmissionNum: Array<{ difficulty: string; count: number }>;
        };
        userCalendar: { streak: number; totalActiveDays: number; submissionCalendar: string };
      };
    }>('USER_PROFILE', this.queries.USER_PROFILE_QUERY, { username });

    const user = data.matchedUser;
    const validated = UserProfileSchema.parse(user);

    return {
      username: validated.username,
      realName: validated.profile.realName,
      ranking: validated.profile.ranking,
      acSubmissionNum: validated.submitStatsGlobal.acSubmissionNum,
      streak: validated.userCalendar.streak,
      totalActiveDays: validated.userCalendar.totalActiveDays,
      submissionCalendar: user.userCalendar.submissionCalendar,
    };
  }

  async getSkillStats(username: string): Promise<{
    fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  }> {
    if (this.site === 'leetcode.cn') {
      const data = await this.graphql<unknown>('SKILL_STATS', this.queries.SKILL_STATS_QUERY, {
        username,
      });
      const validated = CnSkillStatsSchema.parse(data);
      return normalizeCnSkillStats(validated);
    }

    const data = await this.graphql<{
      matchedUser: {
        tagProblemCounts: {
          fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
          intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
          advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
        };
      };
    }>('SKILL_STATS', this.queries.SKILL_STATS_QUERY, { username });

    return data.matchedUser.tagProblemCounts;
  }

  async getSubmissionList(
    slug: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Submission[]> {
    const data = await this.graphql<{
      questionSubmissionList: { submissions: Submission[] };
    }>('SUBMISSION_LIST', this.queries.SUBMISSION_LIST_QUERY, {
      questionSlug: slug,
      limit,
      offset,
    });

    const validated = z.array(SubmissionSchema).parse(data.questionSubmissionList.submissions);
    return validated;
  }

  async getSubmissionDetails(submissionId: number): Promise<SubmissionDetails> {
    const data = await this.graphql<{
      submissionDetails: SubmissionDetails;
    }>('SUBMISSION_DETAILS', this.queries.SUBMISSION_DETAILS_QUERY, { submissionId });

    const validated = SubmissionDetailsSchema.parse(data.submissionDetails);
    return validated;
  }

  async testSolution(
    titleSlug: string,
    code: string,
    lang: string,
    testcases: string,
    questionId: string
  ): Promise<TestResult> {
    const response = await this.client
      .post(`problems/${titleSlug}/interpret_solution/`, {
        json: {
          data_input: testcases,
          lang,
          typed_code: code,
          question_id: questionId,
        },
      })
      .json<{ interpret_id: string }>();

    return this.pollSubmission<TestResult>(response.interpret_id, 'interpret', TestResultSchema);
  }

  async submitSolution(
    titleSlug: string,
    code: string,
    lang: string,
    questionId: string
  ): Promise<SubmissionResult> {
    const response = await this.client
      .post(`problems/${titleSlug}/submit/`, {
        json: {
          lang,
          typed_code: code,
          question_id: questionId,
        },
      })
      .json<{ submission_id: number }>();

    return this.pollSubmission<SubmissionResult>(
      response.submission_id.toString(),
      'submission',
      SubmissionResultSchema
    );
  }

  private async pollSubmission<T>(
    id: string,
    type: 'interpret' | 'submission',
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const endpoint = `submissions/detail/${id}/check/`;

    const maxAttempts = 12;
    const initialDelay = 500;
    const maxDelay = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.client.get(endpoint).json<T & { state: string }>();

        if (result.state === 'SUCCESS' || result.state === 'FAILURE') {
          return schema.parse(result);
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          const action = type === 'interpret' ? 'Test' : 'Submission';
          throw new Error(
            `${action} check failed: ${error instanceof Error ? error.message : 'Network error'}`
          );
        }
      }
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const action = type === 'interpret' ? 'Test' : 'Submission';
    throw new Error(`${action} timeout: Result not available after 30 seconds`);
  }
}

export const leetcodeClient = new LeetCodeClient();
