import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, unlinkSync } from 'fs';
import keytar from 'keytar';
import { homedir } from 'os';
import { join } from 'path';
import type { LeetCodeCredentials } from '../types.js';

const LEETCODE_DIR = join(homedir(), '.leetcode');
const LEGACY_CREDENTIALS_FILE = join(LEETCODE_DIR, 'credentials.json');
const ENCRYPTED_CREDENTIALS_FILE = join(LEETCODE_DIR, 'credentials.v2.enc.json');

const KEYCHAIN_SERVICE = 'leetcode-cli';
const KEYCHAIN_ACCOUNT = 'auth';

type CredentialBackend = 'keychain' | 'file';
export type CredentialMode = 'env-readonly' | CredentialBackend;
export type CredentialSource = 'env' | 'keychain' | 'file' | null;

export type CredentialStatusReason =
  | 'ENV_PARTIAL'
  | 'KEYCHAIN_UNAVAILABLE'
  | 'KEYCHAIN_ERROR'
  | 'FILE_MISSING_MASTER_KEY'
  | 'FILE_DECRYPT_FAILED'
  | 'LEGACY_CREDENTIALS_IGNORED';

export type CredentialOperationReason = CredentialStatusReason | 'ENV_READONLY';

export interface CredentialStoreStatus {
  readonly mode: CredentialMode;
  readonly backend: CredentialBackend;
  readonly source: CredentialSource;
  readonly hasCredentials: boolean;
  readonly readOnly: boolean;
  readonly reason: CredentialStatusReason | null;
  readonly path: string | null;
}

export interface CredentialOperationResult {
  readonly ok: boolean;
  readonly reason: CredentialOperationReason | null;
  readonly mode: CredentialMode;
  readonly source: CredentialSource;
  readonly path: string | null;
  readonly message: string;
}

interface EncryptedCredentialsV2 {
  v: 2;
  alg: 'aes-256-gcm';
  kdf: 'scrypt';
  salt: string;
  iv: string;
  tag: string;
  ct: string;
}

function isValidCredentials(value: unknown): value is LeetCodeCredentials {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LeetCodeCredentials>;
  return (
    typeof candidate.session === 'string' &&
    candidate.session.length > 0 &&
    typeof candidate.csrfToken === 'string' &&
    candidate.csrfToken.length > 0
  );
}

function getEnvCredentials(): LeetCodeCredentials | null {
  const session = process.env['LEETCODE_SESSION'];
  const csrfToken = process.env['LEETCODE_CSRF_TOKEN'];
  if (!session || !csrfToken) return null;
  return { session, csrfToken };
}

function hasPartialEnvCredentials(): boolean {
  const hasSession = !!process.env['LEETCODE_SESSION'];
  const hasCsrf = !!process.env['LEETCODE_CSRF_TOKEN'];
  return hasSession !== hasCsrf;
}

function getSelectedBackend(): CredentialBackend {
  const raw = process.env['LEETCODECLI_CREDENTIAL_BACKEND']?.trim().toLowerCase();
  return raw === 'file' ? 'file' : 'keychain';
}

function ensureDir(): void {
  if (!existsSync(LEETCODE_DIR)) {
    mkdirSync(LEETCODE_DIR, { recursive: true });
  }
  try {
    chmodSync(LEETCODE_DIR, 0o700);
  } catch {
    void 0;
  }
}

function lockFile(path: string): void {
  if (!existsSync(path)) return;
  try {
    chmodSync(path, 0o600);
  } catch {
    void 0;
  }
}

function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 128 * 1024 * 1024,
  }) as Buffer;
}

function encryptCredentials(creds: LeetCodeCredentials, masterKey: string): EncryptedCredentialsV2 {
  const salt = randomBytes(32);
  const iv = randomBytes(12);
  const key = deriveKey(masterKey, salt);

  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(creds);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 2,
    alg: 'aes-256-gcm',
    kdf: 'scrypt',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ct: ciphertext.toString('hex'),
  };
}

function decryptCredentials(
  encrypted: EncryptedCredentialsV2,
  masterKey: string
): LeetCodeCredentials | null {
  try {
    const salt = Buffer.from(encrypted.salt, 'hex');
    const iv = Buffer.from(encrypted.iv, 'hex');
    const tag = Buffer.from(encrypted.tag, 'hex');
    const ciphertext = Buffer.from(encrypted.ct, 'hex');
    const key = deriveKey(masterKey, salt);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      'utf8'
    );
    const parsed = JSON.parse(plaintext);
    return isValidCredentials(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function parseKeychainSecret(secret: string): LeetCodeCredentials | null {
  try {
    const parsed = JSON.parse(secret);
    return isValidCredentials(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function classifyKeychainError(error: unknown): CredentialStatusReason {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const unavailablePatterns = [
    'not available',
    'unsupported',
    'cannot autolaunch',
    'dbus',
    'secret service',
    'keychain',
    'credential store',
  ];
  return unavailablePatterns.some((pattern) => message.includes(pattern))
    ? 'KEYCHAIN_UNAVAILABLE'
    : 'KEYCHAIN_ERROR';
}

function explainReason(reason: CredentialStatusReason): string {
  switch (reason) {
    case 'ENV_PARTIAL':
      return 'Both LEETCODE_SESSION and LEETCODE_CSRF_TOKEN must be set together.';
    case 'KEYCHAIN_UNAVAILABLE':
      return 'System keychain is unavailable. In headless environments, use LEETCODE_SESSION and LEETCODE_CSRF_TOKEN.';
    case 'KEYCHAIN_ERROR':
      return 'Failed to access system keychain credentials.';
    case 'FILE_MISSING_MASTER_KEY':
      return 'File backend requires LEETCODECLI_MASTER_KEY to read or write credentials.';
    case 'FILE_DECRYPT_FAILED':
      return 'Stored encrypted credentials could not be decrypted. Run "leetcode login" again.';
    case 'LEGACY_CREDENTIALS_IGNORED':
      return 'Legacy plaintext credentials were detected and ignored. Please run "leetcode login" again.';
  }
}

export function describeCredentialStatus(status: CredentialStoreStatus): string {
  if (status.hasCredentials) {
    if (status.source === 'env') {
      return 'Using environment credentials (read-only mode).';
    }
    if (status.source === 'keychain') {
      return 'Using credentials from the system keychain.';
    }
    if (status.source === 'file') {
      return `Using encrypted credentials from ${status.path}.`;
    }
  }
  if (status.reason) {
    return explainReason(status.reason);
  }
  return 'No credentials found. Run "leetcode login".';
}

function successResult(
  mode: CredentialMode,
  source: CredentialSource,
  path: string | null,
  message: string
): CredentialOperationResult {
  return { ok: true, reason: null, mode, source, path, message };
}

function failureResult(
  mode: CredentialMode,
  reason: CredentialOperationReason,
  path: string | null,
  message: string
): CredentialOperationResult {
  return { ok: false, reason, mode, source: null, path, message };
}

async function readFromKeychain(
  envPartial: boolean
): Promise<{ status: CredentialStoreStatus; creds: LeetCodeCredentials | null }> {
  try {
    const secret = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
    if (!secret) {
      const fallbackReason = existsSync(LEGACY_CREDENTIALS_FILE)
        ? 'LEGACY_CREDENTIALS_IGNORED'
        : envPartial
          ? 'ENV_PARTIAL'
          : null;
      return {
        status: {
          mode: 'keychain',
          backend: 'keychain',
          source: null,
          hasCredentials: false,
          readOnly: false,
          reason: fallbackReason,
          path: null,
        },
        creds: null,
      };
    }

    const creds = parseKeychainSecret(secret);
    if (!creds) {
      return {
        status: {
          mode: 'keychain',
          backend: 'keychain',
          source: null,
          hasCredentials: false,
          readOnly: false,
          reason: 'KEYCHAIN_ERROR',
          path: null,
        },
        creds: null,
      };
    }

    return {
      status: {
        mode: 'keychain',
        backend: 'keychain',
        source: 'keychain',
        hasCredentials: true,
        readOnly: false,
        reason: null,
        path: null,
      },
      creds,
    };
  } catch (error) {
    return {
      status: {
        mode: 'keychain',
        backend: 'keychain',
        source: null,
        hasCredentials: false,
        readOnly: false,
        reason: classifyKeychainError(error),
        path: null,
      },
      creds: null,
    };
  }
}

function readFromEncryptedFile(envPartial: boolean): {
  status: CredentialStoreStatus;
  creds: LeetCodeCredentials | null;
} {
  const masterKey = process.env['LEETCODECLI_MASTER_KEY'];
  const path = ENCRYPTED_CREDENTIALS_FILE;

  if (!masterKey) {
    const reason =
      !existsSync(path) && existsSync(LEGACY_CREDENTIALS_FILE)
        ? 'LEGACY_CREDENTIALS_IGNORED'
        : 'FILE_MISSING_MASTER_KEY';
    return {
      status: {
        mode: 'file',
        backend: 'file',
        source: null,
        hasCredentials: false,
        readOnly: false,
        reason,
        path,
      },
      creds: null,
    };
  }

  if (!existsSync(path)) {
    const fallbackReason = existsSync(LEGACY_CREDENTIALS_FILE)
      ? 'LEGACY_CREDENTIALS_IGNORED'
      : envPartial
        ? 'ENV_PARTIAL'
        : null;

    return {
      status: {
        mode: 'file',
        backend: 'file',
        source: null,
        hasCredentials: false,
        readOnly: false,
        reason: fallbackReason,
        path,
      },
      creds: null,
    };
  }

  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<EncryptedCredentialsV2>;
    if (
      parsed.v !== 2 ||
      parsed.alg !== 'aes-256-gcm' ||
      parsed.kdf !== 'scrypt' ||
      typeof parsed.salt !== 'string' ||
      typeof parsed.iv !== 'string' ||
      typeof parsed.tag !== 'string' ||
      typeof parsed.ct !== 'string'
    ) {
      return {
        status: {
          mode: 'file',
          backend: 'file',
          source: null,
          hasCredentials: false,
          readOnly: false,
          reason: 'FILE_DECRYPT_FAILED',
          path,
        },
        creds: null,
      };
    }

    const creds = decryptCredentials(parsed as EncryptedCredentialsV2, masterKey);
    if (!creds) {
      return {
        status: {
          mode: 'file',
          backend: 'file',
          source: null,
          hasCredentials: false,
          readOnly: false,
          reason: 'FILE_DECRYPT_FAILED',
          path,
        },
        creds: null,
      };
    }

    return {
      status: {
        mode: 'file',
        backend: 'file',
        source: 'file',
        hasCredentials: true,
        readOnly: false,
        reason: null,
        path,
      },
      creds,
    };
  } catch {
    return {
      status: {
        mode: 'file',
        backend: 'file',
        source: null,
        hasCredentials: false,
        readOnly: false,
        reason: 'FILE_DECRYPT_FAILED',
        path,
      },
      creds: null,
    };
  }
}

async function resolveCredentialState(): Promise<{
  status: CredentialStoreStatus;
  creds: LeetCodeCredentials | null;
}> {
  const envCreds = getEnvCredentials();
  if (envCreds) {
    return {
      status: {
        mode: 'env-readonly',
        backend: getSelectedBackend(),
        source: 'env',
        hasCredentials: true,
        readOnly: true,
        reason: null,
        path: null,
      },
      creds: envCreds,
    };
  }

  const envPartial = hasPartialEnvCredentials();
  const backend = getSelectedBackend();
  if (backend === 'file') {
    return readFromEncryptedFile(envPartial);
  }
  return readFromKeychain(envPartial);
}

export const credentials = {
  async get(): Promise<LeetCodeCredentials | null> {
    const { creds } = await resolveCredentialState();
    return creds;
  },

  async status(): Promise<CredentialStoreStatus> {
    const { status } = await resolveCredentialState();
    return status;
  },

  async info(): Promise<CredentialStoreStatus> {
    const { status } = await resolveCredentialState();
    return status;
  },

  async set(creds: LeetCodeCredentials): Promise<CredentialOperationResult> {
    const envCreds = getEnvCredentials();
    if (envCreds) {
      return failureResult(
        'env-readonly',
        'ENV_READONLY',
        null,
        'Environment credential mode is read-only. Unset LEETCODE_SESSION and LEETCODE_CSRF_TOKEN to store credentials.'
      );
    }

    const backend = getSelectedBackend();
    if (backend === 'file') {
      const masterKey = process.env['LEETCODECLI_MASTER_KEY'];
      if (!masterKey) {
        return failureResult(
          'file',
          'FILE_MISSING_MASTER_KEY',
          ENCRYPTED_CREDENTIALS_FILE,
          'File backend requires LEETCODECLI_MASTER_KEY.'
        );
      }

      try {
        ensureDir();
        const payload = encryptCredentials(creds, masterKey);
        writeFileSync(ENCRYPTED_CREDENTIALS_FILE, JSON.stringify(payload, null, 2) + '\n', {
          encoding: 'utf8',
          mode: 0o600,
        });
        lockFile(ENCRYPTED_CREDENTIALS_FILE);
        return successResult(
          'file',
          'file',
          ENCRYPTED_CREDENTIALS_FILE,
          `Credentials encrypted and saved to ${ENCRYPTED_CREDENTIALS_FILE}.`
        );
      } catch {
        return failureResult(
          'file',
          'FILE_DECRYPT_FAILED',
          ENCRYPTED_CREDENTIALS_FILE,
          'Failed to write encrypted credentials.'
        );
      }
    }

    try {
      await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, JSON.stringify(creds));
      return successResult(
        'keychain',
        'keychain',
        null,
        'Credentials saved to the system keychain.'
      );
    } catch (error) {
      const reason = classifyKeychainError(error);
      return failureResult('keychain', reason, null, explainReason(reason));
    }
  },

  async clear(): Promise<CredentialOperationResult> {
    const envCreds = getEnvCredentials();
    if (envCreds) {
      return failureResult(
        'env-readonly',
        'ENV_READONLY',
        null,
        'Environment credential mode is read-only. Unset LEETCODE_SESSION and LEETCODE_CSRF_TOKEN to log out.'
      );
    }

    const backend = getSelectedBackend();
    if (backend === 'file') {
      try {
        if (existsSync(ENCRYPTED_CREDENTIALS_FILE)) {
          unlinkSync(ENCRYPTED_CREDENTIALS_FILE);
        }
        return successResult(
          'file',
          'file',
          ENCRYPTED_CREDENTIALS_FILE,
          'Encrypted credentials removed.'
        );
      } catch {
        return failureResult(
          'file',
          'FILE_DECRYPT_FAILED',
          ENCRYPTED_CREDENTIALS_FILE,
          'Failed to remove encrypted credentials file.'
        );
      }
    }

    try {
      await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
      return successResult(
        'keychain',
        'keychain',
        null,
        'Credentials removed from the system keychain.'
      );
    } catch (error) {
      const reason = classifyKeychainError(error);
      return failureResult('keychain', reason, null, explainReason(reason));
    }
  },

  getPath(): string {
    return ENCRYPTED_CREDENTIALS_FILE;
  },
};
