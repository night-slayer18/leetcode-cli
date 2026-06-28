import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync } from 'fs';

const ORIGINAL_ENV = { ...process.env };

let tempHome = '';
let keytarMock: {
  getPassword: ReturnType<typeof vi.fn>;
  setPassword: ReturnType<typeof vi.fn>;
  deletePassword: ReturnType<typeof vi.fn>;
};

function resetCredentialEnv(): void {
  delete process.env['LEETCODE_SESSION'];
  delete process.env['LEETCODE_CSRF_TOKEN'];
  delete process.env['LEETCODECLI_CREDENTIAL_BACKEND'];
  delete process.env['LEETCODECLI_MASTER_KEY'];
}

async function loadCredentialsModule() {
  vi.resetModules();

  keytarMock = {
    getPassword: vi.fn(async () => null),
    setPassword: vi.fn(async () => undefined),
    deletePassword: vi.fn(async () => true),
  };

  vi.doMock('keytar', () => ({
    default: keytarMock,
  }));

  vi.doMock('os', async () => {
    const actual = await vi.importActual<typeof import('os')>('os');
    return {
      ...actual,
      homedir: () => tempHome,
    };
  });

  return import('../../storage/credentials.js');
}

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), 'leetcode-cli-creds-'));
  process.env = { ...ORIGINAL_ENV };
  resetCredentialEnv();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.clearAllMocks();
});

describe('credentials storage resolver', () => {
  it('should use env-readonly mode when both env credentials are set', async () => {
    process.env['LEETCODE_SESSION'] = 'env-session';
    process.env['LEETCODE_CSRF_TOKEN'] = 'env-csrf';

    const { credentials } = await loadCredentialsModule();

    await expect(credentials.get()).resolves.toEqual({
      session: 'env-session',
      csrfToken: 'env-csrf',
    });

    const status = await credentials.status();
    expect(status.mode).toBe('env-readonly');
    expect(status.source).toBe('env');
    expect(status.readOnly).toBe(true);
    expect(status.reason).toBeNull();
  });

  it('should surface ENV_PARTIAL when only one env var is present and no backend credentials exist', async () => {
    process.env['LEETCODE_SESSION'] = 'partial-only';

    const { credentials } = await loadCredentialsModule();
    const status = await credentials.status();

    expect(status.mode).toBe('keychain');
    expect(status.hasCredentials).toBe(false);
    expect(status.reason).toBe('ENV_PARTIAL');
  });

  it('should use keychain backend by default', async () => {
    const { credentials } = await loadCredentialsModule();
    keytarMock.getPassword.mockResolvedValue(
      JSON.stringify({ session: 'kc-session', csrfToken: 'kc-csrf' })
    );

    await expect(credentials.get()).resolves.toEqual({
      session: 'kc-session',
      csrfToken: 'kc-csrf',
    });

    const status = await credentials.status();
    expect(status.source).toBe('keychain');
    expect(status.mode).toBe('keychain');
  });

  it('should surface KEYCHAIN_UNAVAILABLE when keychain access fails', async () => {
    const { credentials } = await loadCredentialsModule();
    keytarMock.getPassword.mockRejectedValueOnce(
      new Error('Cannot autolaunch D-Bus without X11 $DISPLAY')
    );

    const status = await credentials.status();
    expect(status.reason).toBe('KEYCHAIN_UNAVAILABLE');
    expect(status.hasCredentials).toBe(false);
  });

  it('should surface LEGACY_CREDENTIALS_IGNORED when only legacy plaintext credentials exist', async () => {
    const legacyPath = join(tempHome, '.leetcode', 'credentials.json');
    mkdirSync(join(tempHome, '.leetcode'), { recursive: true });
    writeFileSync(
      legacyPath,
      JSON.stringify({ session: 'legacy-session', csrfToken: 'legacy-csrf' }, null, 2)
    );

    const { credentials } = await loadCredentialsModule();
    const status = await credentials.status();

    expect(status.hasCredentials).toBe(false);
    expect(status.reason).toBe('LEGACY_CREDENTIALS_IGNORED');
  });
});

describe('credentials file backend', () => {
  it('should surface FILE_MISSING_MASTER_KEY when file backend is selected without master key', async () => {
    process.env['LEETCODECLI_CREDENTIAL_BACKEND'] = 'file';

    const filePath = join(tempHome, '.leetcode', 'credentials.v2.enc.json');
    mkdirSync(join(tempHome, '.leetcode'), { recursive: true });
    writeFileSync(filePath, '{}\n');

    const { credentials } = await loadCredentialsModule();
    const status = await credentials.status();

    expect(status.mode).toBe('file');
    expect(status.reason).toBe('FILE_MISSING_MASTER_KEY');
  });

  it('should surface FILE_DECRYPT_FAILED for invalid encrypted payload', async () => {
    process.env['LEETCODECLI_CREDENTIAL_BACKEND'] = 'file';
    process.env['LEETCODECLI_MASTER_KEY'] = 'test-master-key';

    const filePath = join(tempHome, '.leetcode', 'credentials.v2.enc.json');
    mkdirSync(join(tempHome, '.leetcode'), { recursive: true });
    writeFileSync(
      filePath,
      JSON.stringify({
        v: 2,
        alg: 'aes-256-gcm',
        kdf: 'scrypt',
        salt: '00',
        iv: '00',
        tag: '00',
        ct: 'ff',
      }) + '\n'
    );

    const { credentials } = await loadCredentialsModule();
    const status = await credentials.status();

    expect(status.reason).toBe('FILE_DECRYPT_FAILED');
  });

  it('should write, read, and clear encrypted credentials in file mode', async () => {
    process.env['LEETCODECLI_CREDENTIAL_BACKEND'] = 'file';
    process.env['LEETCODECLI_MASTER_KEY'] = 'test-master-key';

    const { credentials } = await loadCredentialsModule();

    const setResult = await credentials.set({ session: 'file-session', csrfToken: 'file-csrf' });
    if (!setResult.ok) {
      throw new Error(`set failed: ${JSON.stringify(setResult)}`);
    }
    expect(setResult.ok).toBe(true);
    expect(setResult.source).toBe('file');

    const filePath = join(tempHome, '.leetcode', 'credentials.v2.enc.json');
    expect(existsSync(filePath)).toBe(true);

    const raw = readFileSync(filePath, 'utf8');
    expect(raw).toContain('"v": 2');

    await expect(credentials.get()).resolves.toEqual({
      session: 'file-session',
      csrfToken: 'file-csrf',
    });

    const clearResult = await credentials.clear();
    expect(clearResult.ok).toBe(true);
    expect(existsSync(filePath)).toBe(false);
  });

  it('should return read-only error for set/clear in env mode', async () => {
    process.env['LEETCODE_SESSION'] = 'env-session';
    process.env['LEETCODE_CSRF_TOKEN'] = 'env-csrf';

    const { credentials } = await loadCredentialsModule();

    const setResult = await credentials.set({ session: 'x', csrfToken: 'y' });
    expect(setResult.ok).toBe(false);
    expect(setResult.reason).toBe('ENV_READONLY');

    const clearResult = await credentials.clear();
    expect(clearResult.ok).toBe(false);
    expect(clearResult.reason).toBe('ENV_READONLY');
  });
});
