// LeetCode API Client
import got, { Got, Options } from 'got';
import type {
  LeetCodeCredentials,
  Problem,
  ProblemDetail,
  ProblemListFilters,
  DailyChallenge,
  SubmissionResult,
  TestResult,
} from '../types.js';
import {
  PROBLEM_LIST_QUERY,
  PROBLEM_DETAIL_QUERY,
  USER_STATUS_QUERY,
  USER_PROFILE_QUERY,
  DAILY_CHALLENGE_QUERY,
} from './queries.js';

const LEETCODE_BASE_URL = 'https://leetcode.com';
const LEETCODE_GRAPHQL_URL = `${LEETCODE_BASE_URL}/graphql`;

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
    return data.userStatus;
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

    return {
      total: data.problemsetQuestionList.total,
      problems: data.problemsetQuestionList.questions,
    };
  }

  async getProblem(titleSlug: string): Promise<ProblemDetail> {
    const data = await this.graphql<{ question: ProblemDetail }>(
      PROBLEM_DETAIL_QUERY,
      { titleSlug }
    );
    return data.question;
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
    return data.activeDailyCodingChallengeQuestion;
  }

  async getUserProfile(username: string): Promise<{
    username: string;
    realName: string;
    ranking: number;
    acSubmissionNum: Array<{ difficulty: string; count: number }>;
    streak: number;
    totalActiveDays: number;
  }> {
    const data = await this.graphql<{
      matchedUser: {
        username: string;
        profile: { realName: string; ranking: number };
        submitStatsGlobal: {
          acSubmissionNum: Array<{ difficulty: string; count: number }>;
        };
        userCalendar: { streak: number; totalActiveDays: number };
      };
    }>(USER_PROFILE_QUERY, { username });

    const user = data.matchedUser;
    return {
      username: user.username,
      realName: user.profile.realName,
      ranking: user.profile.ranking,
      acSubmissionNum: user.submitStatsGlobal.acSubmissionNum,
      streak: user.userCalendar.streak,
      totalActiveDays: user.userCalendar.totalActiveDays,
    };
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
    return this.pollSubmission<TestResult>(response.interpret_id, 'interpret');
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
    return this.pollSubmission<SubmissionResult>(response.submission_id.toString(), 'submission');
  }

  private async pollSubmission<T>(id: string, type: 'interpret' | 'submission'): Promise<T> {
    const endpoint = type === 'interpret' 
      ? `submissions/detail/${id}/check/`
      : `submissions/detail/${id}/check/`;

    const maxAttempts = 30;
    const delay = 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.client.get(endpoint).json<T & { state: string }>();

      if (result.state === 'SUCCESS' || result.state === 'FAILURE') {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error('Submission timeout: Result not available after 30 seconds');
  }
}

// Singleton instance
export const leetcodeClient = new LeetCodeClient();
