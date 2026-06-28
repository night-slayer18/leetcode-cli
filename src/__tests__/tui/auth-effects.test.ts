import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AppMsg } from '../../tui/types.js';

const { mockCredentials, mockLeetCodeClient } = vi.hoisted(() => ({
  mockCredentials: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => ({
      ok: true,
      reason: null,
      mode: 'keychain',
      source: 'keychain',
      path: null,
      message: 'saved',
    })),
    clear: vi.fn(async () => ({
      ok: true,
      reason: null,
      mode: 'keychain',
      source: 'keychain',
      path: null,
      message: 'cleared',
    })),
    status: vi.fn(async () => ({
      mode: 'keychain',
      backend: 'keychain',
      source: null,
      hasCredentials: false,
      readOnly: false,
      reason: null,
      path: null,
    })),
    info: vi.fn(async () => ({
      mode: 'keychain',
      backend: 'keychain',
      source: null,
      hasCredentials: false,
      readOnly: false,
      reason: null,
      path: null,
    })),
    getPath: vi.fn(() => '/tmp/.leetcode/credentials.v2.enc.json'),
  },
  mockLeetCodeClient: {
    setSite: vi.fn(),
    setCredentials: vi.fn(),
    checkAuth: vi.fn(),
  },
}));

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    setSite: vi.fn(),
    getSite: vi.fn(() => 'leetcode.com'),
    getConfig: vi.fn(() => ({ site: 'leetcode.com' })),
  },
}));

vi.mock('../../storage/credentials.js', () => ({
  credentials: mockCredentials,
  describeCredentialStatus: vi.fn((status: { reason: string | null }) => {
    if (status.reason === 'KEYCHAIN_UNAVAILABLE') {
      return 'System keychain is unavailable.';
    }
    return 'No credentials found.';
  }),
}));

vi.mock('../../api/client.js', () => ({
  leetcodeClient: mockLeetCodeClient,
}));

vi.mock('../../storage/config.js', () => ({
  config: mockConfig,
}));

import { executeCommand } from '../../tui/commands/effects.js';

async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('TUI auth effects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block interactive login in env-readonly mode', async () => {
    mockCredentials.status.mockResolvedValueOnce({
      mode: 'env-readonly',
      backend: 'keychain',
      source: 'env',
      hasCredentials: true,
      readOnly: true,
      reason: null,
      path: null,
    } as any);

    const dispatched: AppMsg[] = [];
    executeCommand(
      { type: 'CMD_LOGIN', session: 'session-token', csrf: 'csrf-token', site: 'leetcode.com' },
      (msg) => dispatched.push(msg)
    );

    await flushAsync();

    expect(dispatched).toContainEqual(
      expect.objectContaining({ type: 'LOGIN_ERROR', error: expect.stringContaining('read-only') })
    );
    expect(mockCredentials.set).not.toHaveBeenCalled();
  });

  it('should block interactive login when keychain is unavailable', async () => {
    mockCredentials.status.mockResolvedValueOnce({
      mode: 'keychain',
      backend: 'keychain',
      source: null,
      hasCredentials: false,
      readOnly: false,
      reason: 'KEYCHAIN_UNAVAILABLE',
      path: null,
    } as any);

    const dispatched: AppMsg[] = [];
    executeCommand(
      { type: 'CMD_LOGIN', session: 'session-token', csrf: 'csrf-token', site: 'leetcode.com' },
      (msg) => dispatched.push(msg)
    );

    await flushAsync();

    expect(dispatched).toContainEqual(
      expect.objectContaining({
        type: 'LOGIN_ERROR',
        error: expect.stringContaining('System keychain is unavailable'),
      })
    );
    expect(mockCredentials.set).not.toHaveBeenCalled();
  });

  it('should emit GLOBAL_ERROR when logout is blocked in env-readonly mode', async () => {
    mockCredentials.clear.mockResolvedValueOnce({
      ok: false,
      reason: 'ENV_READONLY',
      mode: 'env-readonly',
      source: null,
      path: null,
      message: 'Unset LEETCODE_SESSION and LEETCODE_CSRF_TOKEN to log out.',
    } as any);

    const dispatched: AppMsg[] = [];
    executeCommand({ type: 'CMD_LOGOUT' }, (msg) => dispatched.push(msg));

    await flushAsync();

    expect(dispatched).toContainEqual({
      type: 'GLOBAL_ERROR',
      error: 'Unset LEETCODE_SESSION and LEETCODE_CSRF_TOKEN to log out.',
    });
  });

  it('should surface keychain-unavailable reason during auth check', async () => {
    mockCredentials.get.mockResolvedValueOnce(null);
    mockCredentials.status.mockResolvedValueOnce({
      mode: 'keychain',
      backend: 'keychain',
      source: null,
      hasCredentials: false,
      readOnly: false,
      reason: 'KEYCHAIN_UNAVAILABLE',
      path: null,
    } as any);

    const dispatched: AppMsg[] = [];
    executeCommand({ type: 'CMD_CHECK_AUTH' }, (msg) => dispatched.push(msg));

    await flushAsync();

    expect(dispatched).toContainEqual({
      type: 'GLOBAL_ERROR',
      error: 'System keychain is unavailable.',
    });
    expect(dispatched).toContainEqual({ type: 'AUTH_CHECK_COMPLETE', user: null });
  });

  it('should persist selected site before verifying login credentials', async () => {
    mockCredentials.status.mockResolvedValueOnce({
      mode: 'keychain',
      backend: 'keychain',
      source: null,
      hasCredentials: false,
      readOnly: false,
      reason: null,
      path: null,
    } as any);
    mockLeetCodeClient.checkAuth.mockResolvedValueOnce({
      isSignedIn: true,
      username: 'dong',
    });

    const dispatched: AppMsg[] = [];
    executeCommand(
      { type: 'CMD_LOGIN', session: 'session-token', csrf: 'csrf-token', site: 'leetcode.cn' },
      (msg) => dispatched.push(msg)
    );

    await flushAsync();

    expect(mockConfig.setSite).toHaveBeenCalledWith('leetcode.cn');
    expect(mockLeetCodeClient.setSite).toHaveBeenCalledWith('leetcode.cn');
    expect(dispatched).toContainEqual({ type: 'LOGIN_SUCCESS', username: 'dong' });
  });
});
