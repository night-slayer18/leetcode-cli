// LeetCode API Client
import got, { Got } from 'got';
import { z } from 'zod';
import type {
  LeetCodeCredentials,
  Problem,
  ProblemDetail,
  ProblemListFilters,
  DailyChallenge,
  SubmissionResult,
  TestResult,
  Submission,
  SubmissionDetails,
} from '../types.js';
import {
  ProblemSchema,
  ProblemDetailSchema,
  DailyChallengeSchema,
  SubmissionSchema,
  SubmissionDetailsSchema,
  SubmissionResultSchema,
  TestResultSchema,
  UserStatusSchema,
  UserProfileSchema,
} from '../schemas/api.js';
import {
  PROBLEM_LIST_QUERY,
  PROBLEM_DETAIL_QUERY,
  RANDOM_PROBLEM_QUERY,
  USER_STATUS_QUERY,
  USER_PROFILE_QUERY,
  SKILL_STATS_QUERY,
  DAILY_CHALLENGE_QUERY,
  SUBMISSION_LIST_QUERY,
  SUBMISSION_DETAILS_QUERY,
} from './queries.js';

const LEETCODE_BASE_URL = 'https://leetcode.com';

export class LeetCodeClient {
  private client: Got;
  private credentials: LeetCodeCredentials | null = null;

  constructor() {
    this.client = got.extend({
      prefixUrl: LEETCODE_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Origin': LEETCODE_BASE_URL,
        'Referer': `${LEETCODE_BASE_URL}/`,
      },
      timeout: { request: 30000 },
      retry: { limit: 2 },
    });
  }

  setCredentials(credentials: LeetCodeCredentials): void {
    this.credentials = credentials;
    this.client = this.client.extend({
      headers: {
        'Cookie': `LEETCODE_SESSION=${credentials.session}; csrftoken=${credentials.csrfToken}`,
        'X-CSRFToken': credentials.csrfToken,
      },
    });
  }

  getCredentials(): LeetCodeCredentials | null {
    return this.credentials;
  }

  private async graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const response = await this.client.post('graphql', {
      json: { query, variables },
    }).json<{ data: T; errors?: Array<{ message: string }> }>();

    if (response.errors?.length) {
      throw new Error(`GraphQL Error: ${response.errors[0].message}`);
    }

    return response.data;
  }

  async checkAuth(): Promise<{ isSignedIn: boolean; username: string | null }> {
    const data = await this.graphql<{
      userStatus: { isSignedIn: boolean; username: string | null };
    }>(USER_STATUS_QUERY);
    
    const validated = UserStatusSchema.parse(data.userStatus);
    return validated;
  }

  async getProblems(filters: ProblemListFilters = {}): Promise<{ total: number; problems: Problem[] }> {
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

    const data = await this.graphql<{
      problemsetQuestionList: { total: number; questions: Problem[] };
    }>(PROBLEM_LIST_QUERY, variables);

    const validatedProblems = z.array(ProblemSchema).parse(data.problemsetQuestionList.questions);
    
    return {
      total: data.problemsetQuestionList.total,
      problems: validatedProblems,
    };
  }

  async getProblem(titleSlug: string): Promise<ProblemDetail> {
    const data = await this.graphql<{ question: ProblemDetail }>(
      PROBLEM_DETAIL_QUERY,
      { titleSlug }
    );
    
    const validated = ProblemDetailSchema.parse(data.question);
    return validated as ProblemDetail;
  }

  async getProblemById(id: string): Promise<ProblemDetail> {
    // First get the title slug from the problem list
    const { problems } = await this.getProblems({ searchKeywords: id, limit: 10 });
    const problem = problems.find(p => p.questionFrontendId === id);
    
    if (!problem) {
      throw new Error(`Problem #${id} not found`);
    }
    
    return this.getProblem(problem.titleSlug);
  }

  async getDailyChallenge(): Promise<DailyChallenge> {
    const data = await this.graphql<{
      activeDailyCodingChallengeQuestion: DailyChallenge;
    }>(DAILY_CHALLENGE_QUERY);
    
    const validated = DailyChallengeSchema.parse(data.activeDailyCodingChallengeQuestion);
    return validated as DailyChallenge;
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
    }>(RANDOM_PROBLEM_QUERY, variables);

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
    const data = await this.graphql<{
      matchedUser: {
        username: string;
        profile: { realName: string; ranking: number };
        submitStatsGlobal: {
          acSubmissionNum: Array<{ difficulty: string; count: number }>;
        };
        userCalendar: { streak: number; totalActiveDays: number; submissionCalendar: string };
      };
    }>(USER_PROFILE_QUERY, { username });

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
    const data = await this.graphql<{
      matchedUser: {
        tagProblemCounts: {
          fundamental: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
          intermediate: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
          advanced: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
        };
      };
    }>(SKILL_STATS_QUERY, { username });

    return data.matchedUser.tagProblemCounts;
  }

  async getSubmissionList(slug: string, limit: number = 20, offset: number = 0): Promise<Submission[]> {
    const data = await this.graphql<{
      questionSubmissionList: { submissions: Submission[] };
    }>(SUBMISSION_LIST_QUERY, { questionSlug: slug, limit, offset });

    const validated = z.array(SubmissionSchema).parse(data.questionSubmissionList.submissions);
    return validated;
  }

  async getSubmissionDetails(submissionId: number): Promise<SubmissionDetails> {
    const data = await this.graphql<{
      submissionDetails: SubmissionDetails;
    }>(SUBMISSION_DETAILS_QUERY, { submissionId });

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
    // Interpret endpoint for running tests
    const response = await this.client.post(`problems/${titleSlug}/interpret_solution/`, {
      json: {
        data_input: testcases,
        lang,
        typed_code: code,
        question_id: questionId,
      },
    }).json<{ interpret_id: string }>();

    // Poll for results
    return this.pollSubmission<TestResult>(response.interpret_id, 'interpret', TestResultSchema);
  }

  async submitSolution(
    titleSlug: string,
    code: string,
    lang: string,
    questionId: string
  ): Promise<SubmissionResult> {
    const response = await this.client.post(`problems/${titleSlug}/submit/`, {
      json: {
        lang,
        typed_code: code,
        question_id: questionId,
      },
    }).json<{ submission_id: number }>();

    // Poll for results
    return this.pollSubmission<SubmissionResult>(response.submission_id.toString(), 'submission', SubmissionResultSchema);
  }

  private async pollSubmission<T>(id: string, type: 'interpret' | 'submission', schema: z.ZodSchema<T>): Promise<T> {
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
          throw new Error(`${action} check failed: ${error instanceof Error ? error.message : 'Network error'}`);
        }
      }
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const action = type === 'interpret' ? 'Test' : 'Submission';
    throw new Error(`${action} timeout: Result not available after 30 seconds`);
  }
}

// Singleton instance
export const leetcodeClient = new LeetCodeClient();
