import { describe, it, expect } from 'vitest';
import { flag } from 'src/context';
import { runEvalWithContext } from 'src/cli/utils/eval-context-runner';

describe('CLI E2E Flag Override', () => {
  it('should demonstrate the target validation: --flag.temperature=0.9 correctly overrides default', async () => {
    const flagOverrides = { temperature: 0.9 }; // This would come from CLI parsing

    let actualTemperature: number | undefined;

    await runEvalWithContext(flagOverrides, async () => {
      actualTemperature = flag('temperature', 0.7); // Default is 0.7
      return Promise.resolve();
    });

    expect(actualTemperature).toBe(0.9);
  });

  it('should work with the complete CLI argument parsing pipeline', async () => {
    const argv = ['eval', 'some-test.eval.ts', '--flag.temperature=0.9'];

    const { extractFlagOverrides } = await import('src/cli/utils/parse-flag-overrides');
    const { cleanedArgv, overrides } = extractFlagOverrides(argv);

    expect(cleanedArgv).toEqual(['eval', 'some-test.eval.ts']);
    expect(overrides).toEqual({ temperature: 0.9 });

    let actualTemperature: number | undefined;

    await runEvalWithContext(overrides, async () => {
      actualTemperature = flag('temperature', 0.7);
      return Promise.resolve();
    });

    expect(actualTemperature).toBe(0.9);
  });
});
