// Zod schemas for LeetCode API validation
import { z } from 'zod';

// --- Basic Building Blocks ---

export const TopicTagSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const CompanyTagSchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const CodeSnippetSchema = z.object({
  lang: z.string(),
  langSlug: z.string(),
  code: z.string(),
});

// --- Problem Schemas ---

export const ProblemSchema = z.object({
  questionId: z.string(),
  questionFrontendId: z.string(),
  title: z.string(),
  titleSlug: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  isPaidOnly: z.boolean(),
  acRate: z.number().optional().default(0),
  topicTags: z.array(TopicTagSchema),
  status: z.enum(['ac', 'notac']).nullable(),
});

export const ProblemDetailSchema = ProblemSchema.extend({
  content: z.string().nullable(),
  codeSnippets: z.array(CodeSnippetSchema).nullable(),
  sampleTestCase: z.string(),
  exampleTestcases: z.string(),
  hints: z.array(z.string()),
  companyTags: z.array(CompanyTagSchema).nullable(),
  stats: z.string(),
});

// --- Daily Challenge ---

export const DailyChallengeSchema = z.object({
  date: z.string(),
  link: z.string(),
  question: ProblemSchema,
});

// --- Submission Schemas ---

export const SubmissionSchema = z.object({
  id: z.string(),
  statusDisplay: z.string(),
  lang: z.string(),
  runtime: z.string(),
  timestamp: z.string(),
  memory: z.string(),
});

export const SubmissionDetailsSchema = z.object({
  code: z.string(),
  lang: z.object({
    name: z.string(),
  }),
});

export const TestResultSchema = z.object({
  status_code: z.number(),
  status_msg: z.string(),
  state: z.string(),
  run_success: z.boolean(),
  code_answer: z.array(z.string()).optional(),
  expected_code_answer: z.array(z.string()).optional(),
  correct_answer: z.boolean().optional(),
  std_output_list: z.array(z.string()).optional(),
  compile_error: z.string().optional(),
  runtime_error: z.string().optional(),
});

export const SubmissionResultSchema = z.object({
  status_code: z.number(),
  status_msg: z.string(),
  state: z.string(),
  run_success: z.boolean(),
  total_correct: z.number(),
  total_testcases: z.number(),
  status_runtime: z.string(),
  status_memory: z.string(),
  runtime_percentile: z.number(),
  memory_percentile: z.number(),
  code_output: z.string().optional(),
  std_output: z.string().optional(),
  expected_output: z.string().optional(),
  compile_error: z.string().optional(),
  runtime_error: z.string().optional(),
  last_testcase: z.string().optional(),
});

// --- User Profile ---

export const UserProfileSchema = z.object({
  username: z.string(),
  profile: z.object({
    realName: z.string(),
    ranking: z.number(),
  }),
  submitStatsGlobal: z.object({
    acSubmissionNum: z.array(z.object({
      difficulty: z.string(),
      count: z.number(),
    })),
  }),
  userCalendar: z.object({
    streak: z.number(),
    totalActiveDays: z.number(),
  }),
});

// --- User Status ---

export const UserStatusSchema = z.object({
  isSignedIn: z.boolean(),
  username: z.string().nullable(),
});

// --- Inferred Types (for convenience) ---

export type ValidatedProblem = z.infer<typeof ProblemSchema>;
export type ValidatedProblemDetail = z.infer<typeof ProblemDetailSchema>;
export type ValidatedDailyChallenge = z.infer<typeof DailyChallengeSchema>;
export type ValidatedSubmission = z.infer<typeof SubmissionSchema>;
export type ValidatedSubmissionDetails = z.infer<typeof SubmissionDetailsSchema>;
export type ValidatedTestResult = z.infer<typeof TestResultSchema>;
export type ValidatedSubmissionResult = z.infer<typeof SubmissionResultSchema>;
