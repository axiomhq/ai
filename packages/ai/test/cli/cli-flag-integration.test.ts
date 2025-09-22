import { describe, it, expect, vi } from 'vitest';
import { extractOverrides } from 'src/cli/utils/parse-flag-overrides';
import { runEvalWithContext } from 'src/cli/utils/eval-context-runner';
import { flag } from 'src/context';

// Mock runVitest to avoid actual test execution
vi.mock('src/evals/run-vitest', () => ({
  runVitest: vi.fn().mockResolvedValue(undefined),
}));

describe('CLI flag integration', () => {
  it('should parse CLI flags and make them available in eval context', async () => {
    const argv = ['eval', 'test.eval.ts', '--flag.temperature=0.9', '--flag.model=gpt-4'];
    const { cleanedArgv, overrides } = extractOverrides(argv);

    expect(cleanedArgv).toEqual(['eval', 'test.eval.ts']);
    expect(overrides).toEqual({
      temperature: 0.9,
      model: 'gpt-4',
    });

    // Test that overrides are available in eval context
    let capturedTemperature: number | undefined;
    let capturedModel: string | undefined;

    await runEvalWithContext(overrides, async () => {
      // These should return the CLI overridden values
      capturedTemperature = flag('temperature', 0.7);
      capturedModel = flag('model', 'gpt-3.5');

      return Promise.resolve();
    });

    expect(capturedTemperature).toBe(0.9); // CLI override
    expect(capturedModel).toBe('gpt-4'); // CLI override
  });

  it('should use defaults when no CLI overrides provided', async () => {
    const overrides = {}; // No CLI flags

    let capturedTemperature: number | undefined;

    await runEvalWithContext(overrides, async () => {
      capturedTemperature = flag('temperature', 0.7);
      return Promise.resolve();
    });

    expect(capturedTemperature).toBe(0.7); // Default value
  });

  it('should handle mixed CLI flags and defaults', async () => {
    const overrides = { temperature: 0.9 }; // Only temperature overridden

    let capturedTemperature: number | undefined;
    let capturedModel: string | undefined;

    await runEvalWithContext(overrides, async () => {
      capturedTemperature = flag('temperature', 0.7);
      capturedModel = flag('model', 'gpt-3.5');
      return Promise.resolve();
    });

    expect(capturedTemperature).toBe(0.9); // CLI override
    expect(capturedModel).toBe('gpt-3.5'); // Default value
  });
});
