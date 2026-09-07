# Testing

This project uses [Vitest](https://vitest.dev/) for testing with a comprehensive suite covering CLI commands and core TUI state behavior.

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run tests in watch mode (during development)
npm run test:watch

# Run specific test file
npm test -- src/__tests__/commands/auth.test.ts
```

## Test Structure

```
src/__tests__/
├── setup.ts                 # Global test setup (console mocking)
├── mocks/                   # Shared mock implementations
│   ├── leetcodeClient.ts   # Mock LeetCode API client
│   └── storage.ts          # Mock storage modules
├── commands/                # Unit tests for each command
│   ├── auth.test.ts        # login, logout, whoami
│   ├── browse.test.ts      # list, show, daily, random
│   ├── changelog.test.ts   # changelog
│   ├── collab.test.ts      # collab host/join/sync/compare/leave/status
│   ├── config.test.ts      # config
│   ├── diff.test.ts        # diff command
│   ├── hint.test.ts        # hint command
│   ├── notes.test.ts       # notes, bookmark
│   ├── progress.test.ts    # stat, submissions, today
│   ├── snapshot.test.ts    # snapshot save/list/restore/diff/delete
│   ├── solve.test.ts       # pick, test, submit (+ security tests)
│   ├── sync.test.ts        # sync
│   ├── timer.test.ts       # timer
│   ├── update.test.ts      # update
│   └── workspace.test.ts   # workspace create/use/list/delete
├── storage/
│   └── workspace-integration.test.ts  # Multi-workspace isolation
├── tui/
│   └── problem-screen.test.ts # TUI problem drawer/navigation behavior
├── utils/
│   ├── file-utils-sql.test.ts # SQL extension/lang slug resolution
│   ├── languages.test.ts   # Shared language normalization and SQL dialect resolver
│   └── visualize.test.ts   # Visual debugging output
└── integration/
    ├── cli.test.ts         # Integration tests (runs actual CLI binary)
    └── cli-cross-os-e2e.test.ts # Cross-OS CLI command flow checks
```

## Test Categories

### Unit Tests (~182 tests)

Test individual command logic with mocked dependencies:

- API client is mocked to avoid network calls
- Storage modules are mocked to avoid file system access
- All command options and input variations are tested
- **Security tests**: Path traversal prevention in test/submit/diff

### Integration Tests (~49 tests)

Run the actual compiled CLI binary to catch:

- Missing shebang in `dist/index.js`
- Broken imports or build errors
- Commands not registered with Commander.js
- Missing command aliases
- Help text and error handling

### Cross-OS E2E-Style Checks

Deterministic CLI command-flow checks run in the CI OS matrix (Linux/macOS/Windows):

- Config set/read with SQL language and path values
- Config set/read with site selection (`leetcode.com` / `leetcode.cn`)
- Workspace create/use/list/current command flows
- Snapshot save/list/diff flow on real SQL files
- Built CLI help output includes SQL language support

## Coverage

Current coverage by area:

| Area     | Statements | Lines  |
| -------- | ---------- | ------ |
| Commands | 70.33%     | 71.47% |
| Overall  | 54.64%     | 55.93% |

Lower overall coverage is expected because we mock:

- `src/api/client.ts` - LeetCode API calls
- `src/storage/*` - Configuration persistence
- `src/utils/display.ts` - Console output formatting

These are intentionally mocked in unit tests to isolate command logic.

## Writing New Tests

When adding a new command:

1. Create a test file in `src/__tests__/commands/`
2. Mock dependencies using `vi.mock()`
3. Import the command function after mocking
4. Test all options and input variations
5. Add an integration test in `cli.test.ts` for command registration

Example test structure:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies first
vi.mock('../../api/client.js', () => ({
  leetcodeClient: {
    // Mock methods
  },
}));

// Import after mocking
import { myCommand } from '../../commands/myCommand.js';

describe('myCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle basic usage', async () => {
    await myCommand({});
    // assertions
  });
});
```

## China submission API regression

Run `npx vitest run src/__tests__/api/client-submissions.test.ts` to check both sites'
submission queries, pagination, detail normalization, and unavailable submissions.

For a live check, build first, select `leetcode.cn`, and log in with a China account:

```bash
npm run build
node dist/index.js config --site leetcode.cn
node dist/index.js login
node dist/index.js submissions 1
node dist/index.js submissions 1 --download
node dist/index.js diff 1
```

Use a problem with an accepted submission in that account. `--download` writes a
submission-specific file into the configured solutions directory. `diff` requires
a local solution file; use `pick <id> --no-open` and save your solution if needed.

China uses `submissionList` and `submissionDetail` on `/graphql/`; the Global root
fields (`questionSubmissionList` and `submissionDetails`) produce schema errors
on China. China detail IDs use `ID!`, and `lang` is a string rather than an object.
The client aliases the root fields and normalizes the language for shared commands.
Do not include account cookies or personal submission code in test fixtures.

## CI Integration

Tests run automatically on every push via GitHub Actions. The CI workflow:

1. Builds the project (`npm run build`)
2. Runs all tests (`npm test`)
3. Fails the build if any test fails
