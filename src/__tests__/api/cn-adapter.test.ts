import { describe, expect, it } from 'vitest';
import {
  normalizeCnDailyChallenge,
  normalizeCnProblemDetail,
  normalizeCnProblemList,
  normalizeCnSkillStats,
  normalizeCnUserProfile,
} from '../../api/adapters/cn.js';
import { CnProblemDetailSchema, CnProblemListSchema } from '../../schemas/api.js';

describe('cn adapters', () => {
  it('normalizes daily challenge payload from todayRecord', () => {
    const result = normalizeCnDailyChallenge({
      todayRecord: [
        {
          date: '2026-04-20',
          question: {
            questionId: '1',
            frontendQuestionId: '1',
            difficulty: 'Easy',
            title: 'Two Sum',
            titleCn: '两数之和',
            titleSlug: 'two-sum',
            paidOnly: false,
            acRate: 52.3,
            status: 'ac',
            topicTags: [{ name: 'Array', id: 'array' }],
          },
        },
      ],
    });

    expect(result.question.title).toBe('两数之和');
    expect(result.question.titleSlug).toBe('two-sum');
    expect(result.question.questionFrontendId).toBe('1');
    expect(result.link).toBe('/problems/two-sum/');
  });

  it('normalizes problem list payload from leetcode.cn', () => {
    const result = normalizeCnProblemList({
      problemsetQuestionList: {
        total: 3,
        questions: [
          {
            frontendQuestionId: '1',
            title: 'Two Sum',
            titleCn: '两数之和',
            titleSlug: 'two-sum',
            difficulty: 'Easy',
            paidOnly: false,
            acRate: '52.3',
            status: 'AC',
            topicTags: [{ name: 'Array', nameTranslated: '数组', id: 'array', slug: 'array' }],
          },
          {
            frontendQuestionId: '2',
            title: 'Add Two Numbers',
            titleCn: '两数相加',
            titleSlug: 'add-two-numbers',
            difficulty: 'Medium',
            paidOnly: false,
            acRate: '42.1',
            status: 'TRIED',
            topicTags: [],
          },
          {
            frontendQuestionId: '3',
            title: 'Longest Substring Without Repeating Characters',
            titleCn: '无重复字符的最长子串',
            titleSlug: 'longest-substring-without-repeating-characters',
            difficulty: 'Medium',
            paidOnly: false,
            acRate: '38.4',
            status: 'NOT_STARTED',
            topicTags: [],
          },
        ],
      },
    });

    expect(result.total).toBe(3);
    expect(result.problems[0]).toMatchObject({
      questionId: '1',
      questionFrontendId: '1',
      title: '两数之和',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      isPaidOnly: false,
      acRate: 52.3,
      status: 'ac',
    });
    expect(result.problems[0]?.topicTags).toEqual([{ name: '数组', slug: 'array' }]);
    expect(result.problems[1]?.status).toBe('notac');
    expect(result.problems[2]?.status).toBeNull();
  });

  it('accepts leetcode.cn problem list status enums before normalization', () => {
    const parsed = CnProblemListSchema.parse({
      problemsetQuestionList: {
        total: 3,
        questions: [
          { frontendQuestionId: '1', status: 'AC' },
          { frontendQuestionId: '2', status: 'TRIED' },
          { frontendQuestionId: '3', status: 'NOT_STARTED' },
        ],
      },
    });

    expect(parsed.problemsetQuestionList.questions).toHaveLength(3);
  });

  it('normalizes problem detail payload from leetcode.cn', () => {
    const parsed = CnProblemDetailSchema.parse({
      question: {
        questionId: '1',
        questionFrontendId: '1',
        title: 'Two Sum',
        translatedTitle: '两数之和',
        titleSlug: 'two-sum',
        translatedContent: '<p>给定一个整数数组 nums 和一个整数目标值 target...</p>',
        difficulty: 'Easy',
        isPaidOnly: false,
        acRate: '52.3',
        status: 'AC',
        topicTags: [{ name: 'Array', slug: 'array', translatedName: '数组' }],
        codeSnippets: [
          { lang: 'TypeScript', langSlug: 'typescript', code: 'function twoSum() {}' },
        ],
        sampleTestCase: '[2,7,11,15]\n9',
        exampleTestcases: '[2,7,11,15]\n9',
        hints: ['Use a hash map.'],
        stats: '{}',
      },
    });

    const result = normalizeCnProblemDetail(parsed);

    expect(result).toMatchObject({
      questionId: '1',
      questionFrontendId: '1',
      title: '两数之和',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      isPaidOnly: false,
      acRate: 52.3,
      status: 'ac',
      sampleTestCase: '[2,7,11,15]\n9',
      exampleTestcases: '[2,7,11,15]\n9',
    });
    expect(result.topicTags).toEqual([{ name: '数组', slug: 'array' }]);
    expect(result.companyTags).toBeNull();
  });

  it('handles null translatedName in topicTags without failing validation', () => {
    const raw = {
      question: {
        questionId: '22',
        questionFrontendId: '22',
        title: 'Generate Parentheses',
        translatedTitle: '括号生成',
        titleSlug: 'generate-parentheses',
        translatedContent: '<p>数字 n 代表生成括号的对数...</p>',
        difficulty: 'Medium',
        isPaidOnly: false,
        acRate: 0.78,
        status: null,
        topicTags: [
          { name: 'String', slug: 'string', translatedName: '字符串' },
          { name: 'Dynamic Programming', slug: 'dynamic-programming', translatedName: '动态规划' },
          { name: 'Backtracking', slug: 'backtracking', translatedName: '回溯' },
          { name: 'SpecialTagWithoutTranslation', slug: 'special', translatedName: null },
        ],
        codeSnippets: null,
        sampleTestCase: '3',
        exampleTestcases: '3\n1',
        hints: null,
        stats: null,
      },
    };

    const parsed = CnProblemDetailSchema.parse(raw);
    const result = normalizeCnProblemDetail(parsed);

    expect(result.title).toBe('括号生成');
    expect(result.topicTags).toEqual([
      { name: '字符串', slug: 'string' },
      { name: '动态规划', slug: 'dynamic-programming' },
      { name: '回溯', slug: 'backtracking' },
      { name: 'SpecialTagWithoutTranslation', slug: 'special' },
    ]);
    expect(result.hints).toEqual([]);
    expect(result.stats).toBe('{}');
  });

  it('handles null nameTranslated in problem list and daily challenge schemas', () => {
    const listParsed = CnProblemListSchema.parse({
      problemsetQuestionList: {
        total: 1,
        questions: [
          {
            frontendQuestionId: '22',
            title: 'Generate Parentheses',
            titleCn: '括号生成',
            titleSlug: 'generate-parentheses',
            difficulty: 'Medium',
            paidOnly: false,
            topicTags: [{ name: 'Backtracking', nameTranslated: null, slug: 'backtracking' }],
          },
        ],
      },
    });

    const listResult = normalizeCnProblemList(listParsed);
    expect(listResult.problems[0]?.topicTags).toEqual([{ name: 'Backtracking', slug: 'backtracking' }]);

    const dailyResult = normalizeCnDailyChallenge({
      todayRecord: [
        {
          date: '2026-08-14',
          question: {
            questionId: '22',
            title: 'Generate Parentheses',
            titleCn: null,
            topicTags: [{ name: 'Backtracking', nameTranslated: null, id: null }],
          },
        },
      ],
    });
    expect(dailyResult.question.title).toBe('Generate Parentheses');
    expect(dailyResult.question.topicTags).toEqual([{ name: 'Backtracking', slug: 'backtracking' }]);
  });

  it('normalizes cn profile payload into shared user profile shape', () => {
    const profile = normalizeCnUserProfile('night-slayer', {
      userProfilePublicProfile: {
        siteRanking: 123,
        profile: {
          userSlug: 'night-slayer',
          realName: 'Night Slayer',
        },
      },
      userProfileUserQuestionProgress: {
        numAcceptedQuestions: [
          { difficulty: 'Easy', count: 10 },
          { difficulty: 'Medium', count: 7 },
          { difficulty: 'Hard', count: 2 },
        ],
      },
    });

    expect(profile.username).toBe('night-slayer');
    expect(profile.ranking).toBe(123);
    expect(profile.acSubmissionNum.find((entry) => entry.difficulty === 'All')?.count).toBe(19);
    expect(profile.streak).toBe(0);
    expect(profile.submissionCalendar).toBe('');
  });

  it('normalizes cn skill scores into three buckets', () => {
    const stats = normalizeCnSkillStats({
      userProfilePublicProfile: {
        profile: {
          skillSet: {
            topicAreaScores: [
              { score: 12, topicArea: { name: 'Array', slug: 'array' } },
              { score: 6, topicArea: { name: 'Graph', slug: 'graph' } },
              { score: 3, topicArea: { name: 'DP', slug: 'dynamic-programming' } },
            ],
          },
        },
      },
    });

    expect(stats.advanced.length).toBeGreaterThan(0);
    expect(stats.intermediate.length).toBeGreaterThan(0);
    expect(stats.fundamental.length).toBeGreaterThan(0);
  });
});
