// LeetCode API Types

export interface LeetCodeCredentials {
  csrfToken: string;
  session: string;
}

export interface Problem {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPaidOnly: boolean;
  acRate: number;
  topicTags: TopicTag[];
  status: 'ac' | 'notac' | null;
}

export interface TopicTag {
  name: string;
  slug: string;
}

export interface ProblemDetail extends Problem {
  content: string | null;
  codeSnippets: CodeSnippet[] | null;
  sampleTestCase: string;
  exampleTestcases: string;
  hints: string[];
  companyTags: CompanyTag[] | null;
  stats: string;
}

export interface CodeSnippet {
  lang: string;
  langSlug: string;
  code: string;
}

export interface CompanyTag {
  name: string;
  slug: string;
}

export interface UserStats {
  username: string;
  realName: string;
  ranking: number;
  submitStats: {
    acSubmissionNum: AcSubmission[];
    totalSubmissionNum: TotalSubmission[];
  };
  userCalendar: {
    streak: number;
    totalActiveDays: number;
  };
}

export interface AcSubmission {
  difficulty: string;
  count: number;
}

export interface TotalSubmission {
  difficulty: string;
  count: number;
  submissions: number;
}

export interface DailyChallenge {
  date: string;
  link: string;
  question: Problem;
}

export interface SubmissionResult {
  status_code: number;
  status_msg: string;
  state: string;
  run_success: boolean;
  total_correct: number;
  total_testcases: number;
  status_runtime: string;
  status_memory: string;
  runtime_percentile: number;
  memory_percentile: number;
  code_output?: string;
  std_output?: string;
  expected_output?: string;
  compile_error?: string;
  runtime_error?: string;
  last_testcase?: string;
}

export interface TestResult {
  status_code: number;
  status_msg: string;
  state: string;
  run_success: boolean;
  code_answer?: string[];
  expected_code_answer?: string[];
  correct_answer?: boolean;
  std_output_list?: string[];
  compile_error?: string;
  runtime_error?: string;
}

export interface Submission {
  id: string;
  statusDisplay: string;
  lang: string;
  runtime: string;
  timestamp: string;
  memory: string;
}

export interface SubmissionDetails {
  code: string;
  lang: {
    name: string;
  };
}

export interface ProblemListFilters {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  status?: 'NOT_STARTED' | 'AC' | 'TRIED';
  tags?: string[];
  searchKeywords?: string;
  limit?: number;
  skip?: number;
}

export type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python3'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'kotlin'
  | 'swift';

export interface UserConfig {
  language: SupportedLanguage;
  editor?: string;
  workDir: string;
  repo?: string;
}
