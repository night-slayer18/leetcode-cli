// Progress commands tests (stat, submissions, today)
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../storage/credentials.js', () => ({
  credentials: {
    get: vi.fn(() => ({ session: 'test', csrfToken: 'test' })),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: {
    getConfig: vi.fn(() => ({ language: 'typescript', workDir: '/tmp/leetcode' })),
    getWorkDir: vi.fn(() => '/tmp/leetcode'),
  },
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    setCredentials: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue({ isSignedIn: true, username: 'TestUser' }),
    getUserProfile: vi.fn().mockResolvedValue({
      username: 'TestUser',
      realName: 'Test User',
      ranking: 12345,
      acSubmissionNum: [
        { difficulty: 'All', count: 100 },
        { difficulty: 'Easy', count: 50 },
        { difficulty: 'Medium', count: 40 },
        { difficulty: 'Hard', count: 10 },
      ],
      submissionCalendar: JSON.stringify({ '1704067200': 5 }),
      skillStats: { fundamental: [], intermediate: [], advanced: [] },
    }),
    getSkillStats: vi.fn().mockResolvedValue({
      fundamental: [],
      intermediate: [],
      advanced: [],
    }),
    getProblemById: vi.fn().mockResolvedValue({
      questionId: '1',
      questionFrontendId: '1',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      topicTags: [{ name: 'Array' }],
    }),
    getSubmissionList: vi.fn().mockResolvedValue([
      { id: '123', statusDisplay: 'Accepted', lang: { name: 'typescript' }, timestamp: '1704067200' },
      { id: '122', statusDisplay: 'Wrong Answer', lang: { name: 'typescript' }, timestamp: '1704066000' },
    ]),
    getSubmissionDetails: vi.fn().mockResolvedValue({
      code: 'function twoSum() { return [0,1]; }',
      lang: { name: 'typescript' },
    }),
    getDailyChallenge: vi.fn().mockResolvedValue({
      date: '2026-01-10',
      question: { questionId: '1', title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy' },
    }),
  },
}));

vi.mock('../../utils/display.js', () => ({
  displayUserStats: vi.fn(),
  displaySubmissionsList: vi.fn(),
  displayDailyChallenge: vi.fn(),
}));

vi.mock('../../utils/stats-display.js', () => ({
  renderHeatmap: vi.fn(),
  renderSkillStats: vi.fn(),
  renderTrendChart: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    text: '',
  })),
}));

// Import after mocking
import { statCommand } from '../../commands/stat.js';
import { submissionsCommand } from '../../commands/submissions.js';
import { todayCommand } from '../../commands/today.js';
import { leetcodeClient } from '../../api/client.js';
import { renderHeatmap, renderSkillStats, renderTrendChart } from '../../utils/stats-display.js';

describe('Progress Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('statCommand', () => {
    describe('basic usage', () => {
      it('should fetch stats for current user', async () => {
        await statCommand(undefined, {});

        expect(leetcodeClient.getUserProfile).toHaveBeenCalled();
      });

      it('should fetch stats for specified user', async () => {
        await statCommand('OtherUser', {});

        expect(leetcodeClient.getUserProfile).toHaveBeenCalledWith('OtherUser');
      });
    });

    describe('options', () => {
      it('should show calendar heatmap with --calendar', async () => {
        await statCommand(undefined, { calendar: true });

        expect(renderHeatmap).toHaveBeenCalled();
      });

      it('should show skills with --skills', async () => {
        await statCommand(undefined, { skills: true });

        expect(renderSkillStats).toHaveBeenCalled();
      });

      it('should show trend with --trend', async () => {
        await statCommand(undefined, { trend: true });

        expect(renderTrendChart).toHaveBeenCalled();
      });
    });
  });

  describe('submissionsCommand', () => {
    describe('basic usage', () => {
      it('should fetch submissions for problem by ID', async () => {
        await submissionsCommand('1', {});

        expect(leetcodeClient.getSubmissionList).toHaveBeenCalled();
      });
    });

    describe('options', () => {
      it('should respect --limit option', async () => {
        await submissionsCommand('1', { limit: '10' });

        expect(leetcodeClient.getSubmissionList).toHaveBeenCalledWith('two-sum', 10);
      });

      it('should show last accepted with --last', async () => {
        await submissionsCommand('1', { last: true });

        expect(leetcodeClient.getSubmissionList).toHaveBeenCalled();
      });

      it('should download submission with --download', async () => {
        const { writeFile } = await import('fs/promises');

        await submissionsCommand('1', { download: true });

        expect(leetcodeClient.getSubmissionDetails).toHaveBeenCalled();
        expect(writeFile).toHaveBeenCalled();
      });
    });
  });

  describe('todayCommand', () => {
    it('should fetch daily challenge', async () => {
      await todayCommand();

      expect(leetcodeClient.getDailyChallenge).toHaveBeenCalled();
    });
  });
});
