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
  // Store flag overrides globally so they persist across async contexts
  setGlobalFlagOverrides(overrides);

  // Establish eval context with flag overrides
  return withEvalContext({ initialFlags: overrides }, async () => {
    // Apply overrides to global context state
    if (Object.keys(overrides).length > 0) {
      overrideFlags(overrides);
    }

    // Run the evaluation within this context
    return runFn();
  });
}
