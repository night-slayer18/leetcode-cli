import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeetCodeClient } from '../../api/client.js';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('got', () => ({ default: { extend: () => ({ post }) } }));

describe('submission API site compatibility', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it.each(['leetcode.cn', 'leetcode.com'] as const)(
    'fetches paginated submissions on %s using its schema',
    async (site) => {
      const submissions = [
        {
          id: '123',
          statusDisplay: 'Accepted',
          lang: 'python3',
          runtime: '3 ms',
          memory: '20 MB',
          timestamp: '1700000000',
        },
      ];
      post.mockImplementation((endpoint, { json: { query, variables } }) => ({
        json: async () => {
          expect(endpoint).toBe(site === 'leetcode.cn' ? 'graphql/' : 'graphql');
          // CN rejects the global root field with HTTP 400.
          expect(query).toMatch(
            site === 'leetcode.cn'
              ? /questionSubmissionList:\s*submissionList\(/
              : /questionSubmissionList\(/
          );
          expect(variables).toEqual({ questionSlug: 'two-sum', limit: 5, offset: 10 });
          return { data: { questionSubmissionList: { submissions } } };
        },
      }));
      await expect(new LeetCodeClient(site).getSubmissionList('two-sum', 5, 10)).resolves.toEqual(
        submissions
      );
      expect(post).toHaveBeenCalledTimes(1);
    }
  );

  it.each(['leetcode.cn', 'leetcode.com'] as const)(
    'normalizes submission code and metadata on %s for download and diff',
    async (site) => {
      post.mockImplementation((endpoint, { json: { query, variables } }) => ({
        json: async () => {
          expect(endpoint).toBe(site === 'leetcode.cn' ? 'graphql/' : 'graphql');
          expect(query).toMatch(
            site === 'leetcode.cn'
              ? /submissionDetails:\s*submissionDetail\(/
              : /submissionDetails\(/
          );
          expect(query).toContain(
            site === 'leetcode.cn' ? '$submissionId: ID!' : '$submissionId: Int!'
          );
          expect(variables).toEqual({ submissionId: 123 });
          return {
            data: {
              submissionDetails: {
                code: 'print(1)',
                lang: site === 'leetcode.cn' ? 'python3' : { name: 'python3' },
                runtime: '3 ms',
                memory: '20 MB',
                runtimePercentile: null,
                memoryPercentile: 90,
              },
            },
          };
        },
      }));
      await expect(new LeetCodeClient(site).getSubmissionDetails(123)).resolves.toEqual({
        code: 'print(1)',
        lang: { name: 'python3' },
        runtime: '3 ms',
        memory: '20 MB',
        runtimePercentile: null,
        memoryPercentile: 90,
      });
      expect(post).toHaveBeenCalledTimes(1);
    }
  );

  it('returns an empty submission history unchanged', async () => {
    post.mockReturnValue({
      json: async () => ({ data: { questionSubmissionList: { submissions: [] } } }),
    });
    await expect(new LeetCodeClient('leetcode.cn').getSubmissionList('two-sum')).resolves.toEqual(
      []
    );
  });

  it('explains unavailable submission details', async () => {
    post.mockReturnValue({ json: async () => ({ data: { submissionDetails: null } }) });
    await expect(new LeetCodeClient('leetcode.cn').getSubmissionDetails(123)).rejects.toThrow(
      'Submission 123 is unavailable'
    );
  });
});
