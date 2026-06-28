import { describe, expect, it, vi } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    getSite: vi.fn(() => 'leetcode.com'),
    getConfig: vi.fn(() => ({ site: 'leetcode.com' })),
  },
}));

vi.mock('../../storage/config.js', () => ({
  config: mockConfig,
}));

import { init, update } from '../../tui/screens/login/index.js';

describe('TUI login screen', () => {
  it('should move from instructions to site selection before credential entry', () => {
    const [initialModel] = init();

    const [siteModel] = update({ type: 'LOGIN_SUBMIT' }, initialModel);
    const [inputModel] = update({ type: 'LOGIN_SUBMIT' }, siteModel);

    expect(siteModel.step).toBe('site');
    expect(inputModel.step).toBe('input');
    expect(inputModel.site).toBe('leetcode.com');
  });

  it('should include selected site in the login command payload', () => {
    const [initialModel] = init();
    const [siteModel] = update({ type: 'LOGIN_SUBMIT' }, initialModel);
    const [cnModel] = update({ type: 'LOGIN_SWITCH_SITE' }, siteModel);
    const [inputModel] = update({ type: 'LOGIN_SUBMIT' }, cnModel);
    const [sessionModel] = update(
      { type: 'LOGIN_SESSION_INPUT', value: 'session-token' },
      inputModel
    );
    const [readyModel] = update({ type: 'LOGIN_CSRF_INPUT', value: 'csrf-token' }, sessionModel);
    const [, cmd] = update({ type: 'LOGIN_SUBMIT' }, readyModel);

    expect(cmd).toEqual({
      type: 'CMD_LOGIN',
      session: 'session-token',
      csrf: 'csrf-token',
      site: 'leetcode.cn',
    });
  });
});
