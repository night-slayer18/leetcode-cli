import { describe, expect, it } from 'vitest';
import { getQueryPack } from '../../api/query-resolver.js';
import { PROBLEM_LIST_QUERY as PROBLEM_LIST_QUERY_GLOBAL } from '../../api/queries.global.js';
import { PROBLEM_DETAIL_QUERY as PROBLEM_DETAIL_QUERY_GLOBAL } from '../../api/queries.global.js';
import { DAILY_CHALLENGE_QUERY as DAILY_CHALLENGE_QUERY_GLOBAL } from '../../api/queries.global.js';
import { CONTEST_DETAIL_QUERY as CONTEST_DETAIL_QUERY_GLOBAL } from '../../api/queries.global.js';
import { CONTEST_LIST_QUERY as CONTEST_LIST_QUERY_GLOBAL } from '../../api/queries.global.js';
import { DAILY_CHALLENGE_QUERY_CN } from '../../api/queries.cn.js';
import {
  CONTEST_DETAIL_QUERY_CN,
  CONTEST_LIST_QUERY_CN,
} from '../../api/queries.cn.js';

describe('query resolver', () => {
  it('returns global query pack for leetcode.com', () => {
    const pack = getQueryPack('leetcode.com');
    expect(pack.DAILY_CHALLENGE_QUERY).toContain('activeDailyCodingChallengeQuestion');
    expect(pack.DAILY_CHALLENGE_QUERY).toBe(DAILY_CHALLENGE_QUERY_GLOBAL);
  });

  it('returns cn query pack for leetcode.cn', () => {
    const pack = getQueryPack('leetcode.cn');
    expect(pack.DAILY_CHALLENGE_QUERY).toContain('todayRecord');
    expect(pack.DAILY_CHALLENGE_QUERY).toBe(DAILY_CHALLENGE_QUERY_CN);
    expect(pack.PROBLEM_LIST_QUERY).not.toBe(PROBLEM_LIST_QUERY_GLOBAL);
    expect(pack.PROBLEM_LIST_QUERY).toContain('titleCn');
    expect(pack.PROBLEM_LIST_QUERY).toContain('frontendQuestionId');
    expect(pack.PROBLEM_DETAIL_QUERY).not.toBe(PROBLEM_DETAIL_QUERY_GLOBAL);
    expect(pack.PROBLEM_DETAIL_QUERY).toContain('translatedTitle');
    expect(pack.PROBLEM_DETAIL_QUERY).toContain('translatedContent');
  });

  it('resolves contest queries for both supported sites', () => {
    const globalPack = getQueryPack('leetcode.com');
    const cnPack = getQueryPack('leetcode.cn');

    expect(globalPack.CONTEST_LIST_QUERY).toBe(CONTEST_LIST_QUERY_GLOBAL);
    expect(globalPack.CONTEST_LIST_QUERY).toContain('allContests');
    expect(globalPack.CONTEST_DETAIL_QUERY).toBe(CONTEST_DETAIL_QUERY_GLOBAL);
    expect(globalPack.CONTEST_DETAIL_QUERY).toContain('contest(titleSlug:');
    expect(globalPack.CONTEST_DETAIL_QUERY).toMatch(
      /questions\s*\{\s*questionId\s+title\s+titleSlug\s*\}/
    );
    expect(globalPack.CONTEST_DETAIL_QUERY).not.toContain('difficulty');
    expect(cnPack.CONTEST_LIST_QUERY).toBe(CONTEST_LIST_QUERY_CN);
    expect(cnPack.CONTEST_LIST_QUERY).toContain('contestHistory(pageNum:');
    expect(cnPack.CONTEST_LIST_QUERY).toContain('totalNum');
    expect(cnPack.CONTEST_DETAIL_QUERY).toBe(CONTEST_DETAIL_QUERY_CN);
    expect(cnPack.CONTEST_DETAIL_QUERY).toMatch(
      /questions\s*\{\s*questionId\s+title\s+titleSlug\s*\}/
    );
    expect(cnPack.CONTEST_DETAIL_QUERY).not.toContain('difficulty');
  });
});
