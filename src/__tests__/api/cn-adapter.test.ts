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
