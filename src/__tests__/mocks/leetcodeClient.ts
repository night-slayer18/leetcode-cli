// Mock LeetCode API client
import { vi } from 'vitest';

// Sample problem data
export const mockProblem = {
  questionId: '1',
  questionFrontendId: '1',
  title: 'Two Sum',
  titleSlug: 'two-sum',
  difficulty: 'Easy',
  content: '<p>Given an array of integers nums...</p>',
  topicTags: [{ name: 'Array' }, { name: 'Hash Table' }],
  codeSnippets: [
    { lang: 'TypeScript', langSlug: 'typescript', code: 'function twoSum(nums: number[], target: number): number[] {\n\n}' },
    { lang: 'Java', langSlug: 'java', code: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n\n    }\n}' },
  ],
  exampleTestcases: '[2,7,11,15]\n9',
  sampleTestCase: '[2,7,11,15]\n9',
};

export const mockProblems = [
  { questionId: '1', questionFrontendId: '1', title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', status: 'ac' },
  { questionId: '2', questionFrontendId: '2', title: 'Add Two Numbers', titleSlug: 'add-two-numbers', difficulty: 'Medium', status: null },
  { questionId: '3', questionFrontendId: '3', title: 'Longest Substring', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', status: 'notac' },
];

export const mockDailyChallenge = {
  date: '2026-01-10',
  question: mockProblem,
};

export const mockSubmissionResult = {
  status_code: 10,
  status_msg: 'Accepted',
  status_runtime: '0 ms',
  status_memory: '42.1 MB',
  total_correct: 57,
  total_testcases: 57,
  runtime_percentile: 100,
  memory_percentile: 90,
};

export const mockTestResult = {
  status_code: 10,
  status_msg: 'Accepted',
  code_answer: ['[0,1]'],
  expected_code_answer: ['[0,1]'],
  total_correct: 1,
  total_testcases: 1,
};

export const mockUserStats = {
  username: 'TestUser',
  profile: {
    realName: 'Test User',
    ranking: 12345,
  },
  submitStats: {
    acSubmissionNum: [
      { difficulty: 'All', count: 100 },
      { difficulty: 'Easy', count: 50 },
      { difficulty: 'Medium', count: 40 },
      { difficulty: 'Hard', count: 10 },
    ],
  },
  submissionCalendar: JSON.stringify({ '1704067200': 5, '1704153600': 3 }),
};

// Create mock client
export function createMockLeetCodeClient() {
  return {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getProblems: vi.fn().mockResolvedValue(mockProblems),
    getProblem: vi.fn().mockResolvedValue(mockProblem),
    getDailyChallenge: vi.fn().mockResolvedValue(mockDailyChallenge),
    testSolution: vi.fn().mockResolvedValue(mockTestResult),
    submitSolution: vi.fn().mockResolvedValue(mockSubmissionResult),
    getUserStats: vi.fn().mockResolvedValue(mockUserStats),
    getSubmissions: vi.fn().mockResolvedValue([]),
  };
}
