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

export const CnDailyChallengeSchema = z.object({
  todayRecord: z
    .array(
      z.object({
        date: z.string().optional(),
        link: z.string().optional(),
        question: z
          .object({
            questionId: z.union([z.string(), z.number()]).optional(),
            frontendQuestionId: z.union([z.string(), z.number()]).optional(),
            questionFrontendId: z.union([z.string(), z.number()]).optional(),
            difficulty: z.string().optional(),
            title: z.string().optional(),
            titleCn: z.string().optional(),
            titleSlug: z.string().optional(),
            paidOnly: z.boolean().optional(),
            isPaidOnly: z.boolean().optional(),
            acRate: z.union([z.number(), z.string()]).optional(),
            status: z.union([z.literal('ac'), z.literal('notac'), z.null()]).optional(),
            topicTags: z
              .array(
                z.object({
                  name: z.string().optional(),
                  nameTranslated: z.string().optional(),
                  id: z.union([z.string(), z.number()]).optional(),
                })
              )
              .optional(),
          })
          .optional(),
      })
    )
    .optional(),
});

export const CnProblemListSchema = z.object({
  problemsetQuestionList: z.object({
    total: z.number(),
    questions: z.array(
      z.object({
        frontendQuestionId: z.union([z.string(), z.number()]).optional(),
        title: z.string().optional(),
        titleCn: z.string().optional(),
        titleSlug: z.string().optional(),
        difficulty: z.string().optional(),
        paidOnly: z.boolean().optional(),
        acRate: z.union([z.number(), z.string()]).optional(),
        status: z.string().nullable().optional(),
        topicTags: z
          .array(
            z.object({
              name: z.string().optional(),
              nameTranslated: z.string().optional(),
              id: z.union([z.string(), z.number()]).optional(),
              slug: z.string().optional(),
            })
          )
          .optional(),
      })
    ),
  }),
});

export const CnProblemDetailSchema = z.object({
  question: z.object({
    questionId: z.union([z.string(), z.number()]).optional(),
    questionFrontendId: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    translatedTitle: z.string().optional(),
    titleSlug: z.string().optional(),
    translatedContent: z.string().nullable().optional(),
    difficulty: z.string().optional(),
    isPaidOnly: z.boolean().optional(),
    acRate: z.union([z.number(), z.string()]).optional(),
    status: z.string().nullable().optional(),
    topicTags: z
      .array(
        z.object({
          name: z.string().optional(),
          slug: z.string().optional(),
          translatedName: z.string().optional(),
        })
      )
      .optional(),
    codeSnippets: z
      .array(
        z.object({
          lang: z.string(),
          langSlug: z.string(),
          code: z.string(),
        })
      )
      .nullable()
      .optional(),
    sampleTestCase: z.string().optional(),
    exampleTestcases: z.string().optional(),
    hints: z.array(z.string()).optional(),
    stats: z.string().optional(),
  }),
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
  runtime: z.string().optional().nullable(),
  runtimeDisplay: z.string().optional().nullable(),
  runtimePercentile: z.number().optional().nullable(),
  memory: z.string().optional().nullable(),
  memoryDisplay: z.string().optional().nullable(),
  memoryPercentile: z.number().optional().nullable(),
  statusDisplay: z.string().optional().nullable(),
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
  runtime_percentile: z.number().nullable(),
  memory_percentile: z.number().nullable(),
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
    acSubmissionNum: z.array(
      z.object({
        difficulty: z.string(),
        count: z.number(),
      })
    ),
  }),
  userCalendar: z.object({
    streak: z.number(),
    totalActiveDays: z.number(),
    submissionCalendar: z.string().optional(),
  }),
});

export const CnUserProfileSchema = z.object({
  userProfilePublicProfile: z
    .object({
      siteRanking: z.number().optional(),
      profile: z
        .object({
          userSlug: z.string().optional(),
          realName: z.string().optional(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  userProfileUserQuestionProgress: z
    .object({
      numAcceptedQuestions: z
        .array(
          z.object({
            difficulty: z.string().optional(),
            count: z.number().optional(),
          })
        )
        .optional(),
    })
    .nullable()
    .optional(),
});

export const CnSkillStatsSchema = z.object({
  userProfilePublicProfile: z
    .object({
      profile: z
        .object({
          skillSet: z
            .object({
              topicAreaScores: z
                .array(
                  z.object({
                    score: z.number().optional(),
                    topicArea: z
                      .object({
                        name: z.string().optional(),
                        slug: z.string().optional(),
                      })
                      .nullable()
                      .optional(),
                  })
                )
                .optional(),
            })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
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
export type ValidatedCnDailyChallenge = z.infer<typeof CnDailyChallengeSchema>;
export type ValidatedCnProblemList = z.infer<typeof CnProblemListSchema>;
export type ValidatedCnProblemDetail = z.infer<typeof CnProblemDetailSchema>;
export type ValidatedCnUserProfile = z.infer<typeof CnUserProfileSchema>;
export type ValidatedCnSkillStats = z.infer<typeof CnSkillStatsSchema>;
