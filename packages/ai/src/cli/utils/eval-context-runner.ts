import { overrideFlags } from '../../context';
import { withEvalContext } from '../../evals/context/storage';
import { setGlobalFlagOverrides } from '../../evals/context/global-flags';
import type { FlagOverrides } from './parse-flag-overrides';

/**
 * Run evaluation with flag overrides applied to the context.
 * This ensures flag overrides are established before any test files load.
 *
 * @param overrides - Flag overrides from CLI parsing
 * @param runFn - Function that runs the evaluation (typically runVitest)
 */
export async function runEvalWithContext<T>(
  overrides: FlagOverrides,
  runFn: () => Promise<T>,
): Promise<T> {
  setGlobalFlagOverrides(overrides);

  return withEvalContext({ initialFlags: overrides }, async () => {
    // TODO: is this necessary? given the `setGlobalFlagOverrides` call above?
    if (Object.keys(overrides).length > 0) {
      overrideFlags(overrides);
    }

    return runFn();
  });
}
