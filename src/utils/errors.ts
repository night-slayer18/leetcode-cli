// Custom error types

export class LeetCodeError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LeetCodeError';
  }
}

export class AuthenticationError extends LeetCodeError {
  constructor(message: string = 'Authentication required. Please run: leetcode login') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class ProblemNotFoundError extends LeetCodeError {
  constructor(problemId: string) {
    super(`Problem "${problemId}" not found`, 'PROBLEM_NOT_FOUND');
    this.name = 'ProblemNotFoundError';
  }
}

export class SessionExpiredError extends LeetCodeError {
  constructor() {
    super('Session expired. Please run: leetcode login', 'SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

export class SolutionNotFoundError extends LeetCodeError {
  constructor(identifier: string, workDir: string) {
    super(
      `No solution file found for "${identifier}"\nLooking in: ${workDir}\nRun "leetcode pick ${identifier}" first to create a solution file.`,
      'SOLUTION_NOT_FOUND'
    );
    this.name = 'SolutionNotFoundError';
  }
}

export class InvalidFileFormatError extends LeetCodeError {
  constructor(expectedFormat: string = '{id}.{title-slug}.{ext}') {
    super(
      `Invalid filename format.\nExpected format: ${expectedFormat}\nExample: 1.two-sum.ts`,
      'INVALID_FILE_FORMAT'
    );
    this.name = 'InvalidFileFormatError';
  }
}

export class UnsupportedLanguageError extends LeetCodeError {
  constructor(extension: string) {
    super(`Unsupported file extension: .${extension}`, 'UNSUPPORTED_LANGUAGE');
    this.name = 'UnsupportedLanguageError';
  }
}

export class FileNotFoundError extends LeetCodeError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
  }
}

export class PremiumRequiredError extends LeetCodeError {
  constructor(problemTitle?: string) {
    const msg = problemTitle
      ? `"${problemTitle}" is a Premium problem and requires a LeetCode Premium subscription`
      : 'This content requires a LeetCode Premium subscription';
    super(msg, 'PREMIUM_REQUIRED');
    this.name = 'PremiumRequiredError';
  }
}
