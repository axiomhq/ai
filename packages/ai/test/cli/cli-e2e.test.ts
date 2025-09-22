import { describe, it, expect } from 'vitest';
import { flag } from 'src/context';
import { runEvalWithContext } from 'src/cli/utils/eval-context-runner';
import { extractOverrides } from 'src/cli/utils/parse-flag-overrides';

describe('CLI E2E Flag Override', () => {
  it('should allow overriding defaults in runEvalWithContext', async () => {
    const DEFAULT = 0.7;
    const OVERRIDE = 0.9;

    const flagOverrides = { temperature: OVERRIDE }; // This would come from CLI parsing

    let actualTemperature: number | undefined;

    await runEvalWithContext(flagOverrides, async () => {
      actualTemperature = flag('temperature', DEFAULT); // Default is 0.7
      return Promise.resolve();
    });

    expect(actualTemperature).toBe(OVERRIDE);
  });

  it('should work e2e (parse cli args)', async () => {
    const DEFAULT = 0.7;
    const OVERRIDE = 0.9;

    const argv = ['eval', 'some-test.eval.ts', '--flag.temperature=0.9'];

    const { cleanedArgv, overrides } = extractOverrides(argv);

    expect(cleanedArgv).toEqual(['eval', 'some-test.eval.ts']);
    expect(overrides).toEqual({ temperature: OVERRIDE });

    let actualTemperature: number | undefined;

    await runEvalWithContext(overrides, async () => {
      actualTemperature = flag('temperature', DEFAULT);
      return Promise.resolve();
    });

    expect(actualTemperature).toBe(OVERRIDE);
  });
});
