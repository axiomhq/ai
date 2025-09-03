import { trace } from '@opentelemetry/api';
import { getEvalContext, updateEvalContext } from './evals/context/storage';

export function createAppScope<
  Flags extends Record<string, any>,
  Facts extends Record<string, any>,
>() {
  type FlagName = keyof Flags;
  type FactName = keyof Facts;

  /**
   * Get a typed flag value with inline default.
   * Checks context overrides first, falls back to provided default.
   */
  function flag<N extends FlagName>(name: N, defaultValue: Flags[N]): Flags[N] {
    const ctx = getEvalContext();

    // Check overrides first (from withFlags() or overrideFlags)
    if (name in ctx.flags) {
      const overrideValue = ctx.flags[name] as Flags[N];

      // Write to current active span (use override value)
      const span = trace.getActiveSpan();
      if (span?.isRecording()) {
        span.setAttributes({ [`flag.${String(name)}`]: String(overrideValue) });
      }

      return overrideValue;
    }

    // Store accessed flag for tracking (only when using default)
    updateEvalContext({ [name as string]: defaultValue });

    // Write to current active span (use default value)
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      span.setAttributes({ [`flag.${String(name)}`]: String(defaultValue) });
    }

    return defaultValue;
  }

  /**
   * Record a typed fact value.
   * Facts are write-only, no defaults needed.
   */
  function fact<N extends FactName>(name: N, value: Facts[N]): void {
    // Store in context for tracking
    updateEvalContext(undefined, { [name as string]: value });

    // Write to current active span
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      span.setAttributes({ [`fact.${String(name)}`]: String(value) });
      // Also record as timestamped event for time-series data
      span.addEvent('fact.recorded', {
        [`fact.${String(name)}`]: String(value),
      });
    }
  }

  return { flag, fact };
}
