# Testing

This project uses [Vitest](https://vitest.dev/) for testing with a comprehensive test suite covering all CLI commands.

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
├── utils/
│   └── visualize.test.ts   # Visual debugging output
└── integration/
    └── cli.test.ts         # Integration tests (runs actual CLI binary)
```

## Test Categories

### Unit Tests (~177 tests)

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

## Coverage

Current coverage by area:

| Area | Statements | Lines |
|------|------------|-------|
| Commands | 70.33% | 71.47% |
| Overall | 54.64% | 55.93% |

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

## CI Integration

Tests run automatically on every push via GitHub Actions. The CI workflow:

1. Builds the project (`npm run build`)
2. Runs all tests (`npm test`)
3. Fails the build if any test fails
