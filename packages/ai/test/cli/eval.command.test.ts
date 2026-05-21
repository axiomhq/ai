import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';

import { loadEvalCommand } from '../../src/cli/commands/eval.command';

vi.mock('../../src/config/loader', () => ({
  loadConfig: vi.fn().mockResolvedValue({
    config: {
      eval: {
        url: 'https://api.axiom.co',
        edgeUrl: 'https://api.axiom.co',
        token: 'test-token',
        dataset: 'test-dataset',
        orgId: 'test-org',
        flagSchema: null,
        instrumentation: {},
        timeoutMs: 60000,
        include: ['**/*.eval.ts'],
        exclude: [],
      },
    },
  }),
}));

vi.mock('../../src/cli/utils/eval-context-runner', () => ({
  runEvalWithContext: vi.fn(async (_overrides: unknown, fn: () => Promise<unknown>) => fn()),
}));

vi.mock('../../src/evals/run-vitest', () => ({
  runVitest: vi.fn().mockResolvedValue(undefined),
}));

describe('eval command token validation', () => {
  let originalFetch: typeof global.fetch;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalFetch = global.fetch;
    (globalThis as any).__SDK_VERSION__ = 'test-version';
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit: ${code}`);
    }) as any);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('prints validation errors returned from the validate endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        valid: false,
        permissions: {
          canWrite: false,
          canRead: false,
        },
        errors: [
          'the token does not have ingest capability for the dataset',
          'the token does not have read capability for the dataset',
        ],
      }),
    });

    const program = new Command();
    loadEvalCommand(program);

    await expect(
      program.parseAsync([
        'node',
        'axiom',
        'eval',
        '--token',
        'test-token',
        '--dataset',
        'test-dataset',
        '--url',
        'https://api.axiom.co',
        '--org-id',
        'test-org',
      ]),
    ).rejects.toThrow(/process\.exit: 1/);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorOutput = consoleErrorSpy.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(errorOutput).toContain('Token does not have required permissions for dataset "test-dataset".');
    expect(errorOutput).toContain('Missing write permission to ingest traces.');
    expect(errorOutput).toContain('Missing read permission to query results.');
  });
});
