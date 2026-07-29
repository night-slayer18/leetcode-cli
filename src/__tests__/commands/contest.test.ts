import { describe, it, expect, vi, beforeEach } from 'vitest';

const getContests = vi.hoisted(() => vi.fn());
const getContest = vi.hoisted(() => vi.fn());
const prompt = vi.hoisted(() => vi.fn());
const pickCommand = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const spinner = vi.hoisted(() => ({
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: { getContests, getContest },
}));

vi.mock('../../utils/auth.js', () => ({
  requireAuth: vi.fn().mockResolvedValue({ authorized: true }),
}));

vi.mock('../../commands/pick.js', () => ({ pickCommand }));

vi.mock('inquirer', () => ({
  default: { prompt },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => spinner),
}));

import { contestCommand } from '../../commands/contest.js';
import { outputContains } from '../setup.js';

describe('Contest Command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getContests.mockResolvedValue([
      { title: 'Weekly Contest 1', titleSlug: 'weekly-contest-1' },
      { title: 'Biweekly Contest 1', titleSlug: 'biweekly-contest-1' },
    ]);
    getContest.mockResolvedValue({
      title: 'Biweekly Contest 1',
      titleSlug: 'biweekly-contest-1',
      startTime: 0,
      duration: 0,
      questions: [
        {
          questionId: '1',
          title: 'Contest Problem 1',
          titleSlug: 'contest-problem-1',
        },
        {
          questionId: '2',
          title: 'Contest Problem 2',
          titleSlug: 'contest-problem-2',
        },
      ],
    });
    pickCommand.mockResolvedValue(true);
  });

  it('selects contests and problems in API order', async () => {
    prompt
      .mockResolvedValueOnce({ contestSlug: 'biweekly-contest-1' })
      .mockResolvedValueOnce({ questionSlug: 'contest-problem-2' });

    await contestCommand(undefined, { lang: 'python3', open: false });

    expect(prompt).toHaveBeenCalledTimes(2);
    expect(prompt.mock.calls[0][0][0].choices).toEqual([
      { name: 'Weekly Contest 1 (weekly-contest-1)', value: 'weekly-contest-1' },
      { name: 'Biweekly Contest 1 (biweekly-contest-1)', value: 'biweekly-contest-1' },
    ]);
    expect(prompt.mock.calls[1][0][0].choices).toEqual([
      { name: '1. Contest Problem 1 (contest-problem-1)', value: 'contest-problem-1' },
      { name: '2. Contest Problem 2 (contest-problem-2)', value: 'contest-problem-2' },
    ]);
    expect(getContest).toHaveBeenCalledWith('biweekly-contest-1');
    expect(pickCommand).toHaveBeenCalledWith('contest-problem-2', {
      lang: 'python3',
      open: false,
    });
  });

  it('supports a direct contest slug without fetching the contest list', async () => {
    prompt.mockResolvedValueOnce({ questionSlug: 'contest-problem-1' });

    await contestCommand('weekly-contest-1');

    expect(getContests).not.toHaveBeenCalled();
    expect(getContest).toHaveBeenCalledWith('weekly-contest-1');
    expect(pickCommand).toHaveBeenCalledWith('contest-problem-1', {});
    expect(spinner.stop).toHaveBeenCalledTimes(2);
  });

  it('handles empty contest lists and unavailable contests', async () => {
    getContests.mockResolvedValueOnce([]);
    await contestCommand();
    expect(prompt).not.toHaveBeenCalled();

    getContest.mockResolvedValueOnce(null);
    await contestCommand('missing-contest');
    expect(prompt).not.toHaveBeenCalled();
  });

  it('rejects malicious contest problem slugs', async () => {
    getContest.mockResolvedValueOnce({
      title: 'Weekly Contest 1',
      titleSlug: 'weekly-contest-1',
      startTime: 0,
      duration: 0,
      questions: [
        {
          questionId: 'outside',
          title: 'Outside',
          titleSlug: '../outside',
        },
      ],
    });
    prompt.mockResolvedValueOnce({ questionSlug: '../outside' });

    await contestCommand('weekly-contest-1');

    expect(pickCommand).not.toHaveBeenCalled();
    expect(outputContains('unavailable or has an invalid slug')).toBe(true);
  });

  it('handles prompt cancellation without selecting a problem', async () => {
    const cancellation = new Error('User force closed the prompt');
    cancellation.name = 'ExitPromptError';
    prompt.mockRejectedValueOnce(cancellation);

    await expect(contestCommand()).resolves.toBeUndefined();
    expect(getContest).not.toHaveBeenCalled();
    expect(pickCommand).not.toHaveBeenCalled();
  });

  it('handles contest API errors without throwing', async () => {
    getContests.mockRejectedValueOnce(new Error('API unavailable'));

    await expect(contestCommand()).resolves.toBeUndefined();
    expect(pickCommand).not.toHaveBeenCalled();
  });
});
