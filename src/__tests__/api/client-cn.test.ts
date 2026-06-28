import { describe, expect, it, vi } from 'vitest';
import { LeetCodeClient } from '../../api/client.js';

describe('LeetCodeClient cn getProblemById', () => {
  it('uses list search to resolve cn problem ids by exact frontend id', async () => {
    const client = new LeetCodeClient('leetcode.cn');

    const getProblemsSpy = vi.spyOn(client, 'getProblems').mockResolvedValueOnce({
      total: 1,
      problems: [
        {
          questionId: '1',
          questionFrontendId: '1',
          title: '两数之和',
          titleSlug: 'two-sum',
          difficulty: 'Easy',
          isPaidOnly: false,
          acRate: 52.3,
          topicTags: [],
          status: 'ac',
        },
      ],
    });

    const getProblemSpy = vi.spyOn(client, 'getProblem').mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: '两数之和',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      isPaidOnly: false,
      acRate: 52.3,
      topicTags: [],
      status: 'ac',
      content: '<p>Given an array of integers...</p>',
      codeSnippets: [],
      sampleTestCase: '',
      exampleTestcases: '',
      hints: [],
      companyTags: [],
      stats: '{}',
    });

    const result = await client.getProblemById('1');

    expect(getProblemsSpy).toHaveBeenCalledWith({ searchKeywords: '1', limit: 50, skip: 0 });
    expect(getProblemSpy).toHaveBeenCalledWith('two-sum');
    expect(result.titleSlug).toBe('two-sum');
  });

  it('throws when cn list search does not contain the exact frontend id', async () => {
    const client = new LeetCodeClient('leetcode.cn');

    const getProblemsSpy = vi.spyOn(client, 'getProblems').mockResolvedValueOnce({
      total: 12,
      problems: [
        {
          questionId: '200',
          questionFrontendId: '200',
          title: '岛屿数量',
          titleSlug: 'number-of-islands',
          difficulty: 'Medium',
          isPaidOnly: false,
          acRate: 61.2,
          topicTags: [],
          status: null,
        },
      ],
    });

    const getProblemSpy = vi.spyOn(client, 'getProblem');

    await expect(client.getProblemById('2')).rejects.toThrow('Problem #2 not found');

    expect(getProblemsSpy).toHaveBeenCalledWith({ searchKeywords: '2', limit: 50, skip: 0 });
    expect(getProblemSpy).not.toHaveBeenCalled();
  });

  it('searches additional cn result pages until the exact frontend id is found', async () => {
    const client = new LeetCodeClient('leetcode.cn');

    const getProblemsSpy = vi
      .spyOn(client, 'getProblems')
      .mockResolvedValueOnce({
        total: 120,
        problems: Array.from({ length: 50 }, (_, index) => ({
          questionId: String(index + 100),
          questionFrontendId: String(index + 100),
          title: `Problem ${index + 100}`,
          titleSlug: `problem-${index + 100}`,
          difficulty: 'Easy' as const,
          isPaidOnly: false,
          acRate: 50,
          topicTags: [],
          status: null,
        })),
      })
      .mockResolvedValueOnce({
        total: 120,
        problems: [
          {
            questionId: '1',
            questionFrontendId: '1',
            title: '两数之和',
            titleSlug: 'two-sum',
            difficulty: 'Easy',
            isPaidOnly: false,
            acRate: 52.3,
            topicTags: [],
            status: 'ac',
          },
        ],
      });

    const getProblemSpy = vi.spyOn(client, 'getProblem').mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: '两数之和',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      isPaidOnly: false,
      acRate: 52.3,
      topicTags: [],
      status: 'ac',
      content: '<p>Given an array of integers...</p>',
      codeSnippets: [],
      sampleTestCase: '',
      exampleTestcases: '',
      hints: [],
      companyTags: [],
      stats: '{}',
    });

    await client.getProblemById('1');

    expect(getProblemsSpy).toHaveBeenNthCalledWith(1, { searchKeywords: '1', limit: 50, skip: 0 });
    expect(getProblemsSpy).toHaveBeenNthCalledWith(2, { searchKeywords: '1', limit: 50, skip: 50 });
    expect(getProblemSpy).toHaveBeenCalledWith('two-sum');
  });
});
