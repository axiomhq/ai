import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { runEvalWithContext } from '../../src/cli/utils/eval-context-runner';
import { createAppScope } from '../../src/app-scope';
import { extractOverrides } from '../../src/cli/utils/parse-flag-overrides';

// Mock runVitest to avoid actual test execution
vi.mock('src/evals/run-vitest', () => ({
  runVitest: vi.fn().mockResolvedValue(undefined),
}));

describe('CLI flag integration', () => {
  // Create a schema that matches the flags used in tests
  const flagSchema = z.object({
    temperature: z.number().default(0.5),
    model: z.string().default('gpt-3.5-turbo'),
  });

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
      const { flag } = createAppScope({ flagSchema });
      // These should return the CLI overridden values
      capturedTemperature = flag('temperature');
      capturedModel = flag('model');

      return Promise.resolve();
    });

    expect(capturedTemperature).toBe(0.9); // CLI override
    expect(capturedModel).toBe('gpt-4'); // CLI override
  });

  it('should read flags from eval context', async () => {
    const overrides = { temperature: 0.7 }; // Initial context value

    let capturedTemperature: number | undefined;

    await runEvalWithContext(overrides, async () => {
      const { flag } = createAppScope({ flagSchema });
      capturedTemperature = flag('temperature');
      return Promise.resolve();
    });

    expect(capturedTemperature).toBe(0.7); // Context value
  });

  it('should handle multiple flag overrides in eval context', async () => {
    const overrides = { temperature: 0.9, model: 'gpt-3.5' }; // Multiple context overrides

    let capturedTemperature: number | undefined;
    let capturedModel: string | undefined;

    await runEvalWithContext(overrides, async () => {
      const { flag } = createAppScope({ flagSchema });
      capturedTemperature = flag('temperature');
      capturedModel = flag('model');
      return Promise.resolve();
    });

    expect(capturedTemperature).toBe(0.9); // Context override
    expect(capturedModel).toBe('gpt-3.5'); // Context override
  });
});
