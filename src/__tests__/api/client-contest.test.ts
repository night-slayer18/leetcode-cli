import { describe, expect, it, vi } from 'vitest';
import { LeetCodeClient } from '../../api/client.js';

type GraphqlMethod = (
  operation: string,
  query: string,
  variables?: Record<string, unknown>
) => Promise<unknown>;

function mockGraphql(client: LeetCodeClient) {
  return vi.spyOn(client as unknown as { graphql: GraphqlMethod }, 'graphql');
}

describe('LeetCodeClient contests', () => {
  it('returns contests in API order', async () => {
    const client = new LeetCodeClient();
    const graphql = mockGraphql(client);
    graphql.mockResolvedValueOnce({
      allContests: [
        {
          title: 'Later Contest',
          titleSlug: 'later-contest',
          startTime: 2,
          duration: 5400,
          originStartTime: 2,
          isVirtual: false,
          containsPremium: false,
        },
        {
          title: 'Earlier Contest',
          titleSlug: 'earlier-contest',
          startTime: 1,
          duration: 5400,
          originStartTime: 1,
          isVirtual: false,
          containsPremium: true,
        },
      ],
    });

    const contests = await client.getContests();

    expect(contests.map((contest) => contest.titleSlug)).toEqual([
      'later-contest',
      'earlier-contest',
    ]);
    expect(graphql).toHaveBeenCalledWith('CONTEST_LIST', expect.any(String));
  });

  it('returns ordered contest questions without requiring full Problem fields', async () => {
    const client = new LeetCodeClient();
    const graphql = mockGraphql(client);
    graphql.mockResolvedValueOnce({
      contest: {
        title: 'Weekly Contest',
        titleSlug: 'weekly-contest',
        startTime: 1,
        duration: 5400,
        originStartTime: null,
        isVirtual: false,
        containsPremium: false,
        description: null,
          questions: [
          {
            questionId: '2',
            title: 'Second',
            titleSlug: 'second',
          },
          {
            questionId: '1',
            title: 'First',
            titleSlug: 'first',
          },
        ],
      },
    });

    const contest = await client.getContest('weekly-contest');

    expect(contest.questions.map((question) => question.titleSlug)).toEqual(['second', 'first']);
    expect(graphql).toHaveBeenCalledWith('CONTEST_DETAIL', expect.any(String), {
      titleSlug: 'weekly-contest',
    });
  });

  it('throws a descriptive error when the contest detail is null', async () => {
    const client = new LeetCodeClient();
    const graphql = mockGraphql(client);
    graphql.mockResolvedValueOnce({ contest: null });

    await expect(client.getContest('missing-contest')).rejects.toThrow(
      'Contest "missing-contest" not found'
    );
  });

  it('normalizes CN contest history in API order', async () => {
    const client = new LeetCodeClient('leetcode.cn');
    const graphql = mockGraphql(client);
    graphql.mockResolvedValueOnce({
      contestHistory: {
        totalNum: 2,
        contests: [
          {
            containsPremium: false,
            title: 'Later Contest',
            titleSlug: 'later-contest',
            description: 'Later',
            startTime: 2,
            duration: 5400,
            originStartTime: 2,
            isVirtual: false,
          },
          {
            containsPremium: true,
            title: 'Earlier Contest',
            titleSlug: 'earlier-contest',
            description: null,
            startTime: 1,
            duration: 5400,
            originStartTime: 1,
            isVirtual: false,
          },
        ],
      },
    });

    await expect(client.getContests()).resolves.toEqual([
      {
        title: 'Later Contest',
        titleSlug: 'later-contest',
        startTime: 2,
        duration: 5400,
        originStartTime: 2,
        isVirtual: false,
        containsPremium: false,
      },
      {
        title: 'Earlier Contest',
        titleSlug: 'earlier-contest',
        startTime: 1,
        duration: 5400,
        originStartTime: 1,
        isVirtual: false,
        containsPremium: true,
      },
    ]);
    expect(graphql).toHaveBeenCalledWith('CONTEST_LIST', expect.stringContaining('contestHistory'), {
      pageNum: 1,
      pageSize: 100,
    });
  });

  it('fetches additional CN contest history pages in API order', async () => {
    const client = new LeetCodeClient('leetcode.cn');
    const graphql = mockGraphql(client);
    graphql
      .mockResolvedValueOnce({
        contestHistory: {
          totalNum: 2,
          contests: [
            {
              containsPremium: false,
              title: 'First Contest',
              titleSlug: 'first-contest',
              description: null,
              startTime: 1,
              duration: 5400,
              originStartTime: 1,
              isVirtual: false,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        contestHistory: {
          totalNum: 2,
          contests: [
            {
              containsPremium: true,
              title: 'Second Contest',
              titleSlug: 'second-contest',
              description: null,
              startTime: 2,
              duration: 5400,
              originStartTime: 2,
              isVirtual: false,
            },
          ],
        },
      });

    const contests = await client.getContests();

    expect(contests.map((contest) => contest.titleSlug)).toEqual([
      'first-contest',
      'second-contest',
    ]);
    expect(graphql).toHaveBeenNthCalledWith(
      2,
      'CONTEST_LIST',
      expect.stringContaining('contestHistory'),
      { pageNum: 2, pageSize: 100 }
    );
  });

  it('fails clearly when a contest list response is malformed', async () => {
    const client = new LeetCodeClient();
    const graphql = mockGraphql(client);
    graphql.mockResolvedValueOnce({});

    await expect(client.getContests()).rejects.toThrow(/allContests/);
  });

  it('fails clearly when a CN contest history response is malformed', async () => {
    const client = new LeetCodeClient('leetcode.cn');
    const graphql = mockGraphql(client);
    graphql.mockResolvedValueOnce({ contestHistory: {} });

    await expect(client.getContests()).rejects.toThrow(/totalNum|contests/);
  });
});
