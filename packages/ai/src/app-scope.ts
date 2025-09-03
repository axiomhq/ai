import { trace } from '@opentelemetry/api';
import { getEvalContext, updateEvalContext } from './evals/context/storage';
import { getGlobalFlagOverrides } from './evals/context/global-flags';

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
    const globalOverrides = getGlobalFlagOverrides();

    // Check global CLI overrides first (highest priority)
    if (name as string in globalOverrides) {
      const overrideValue = globalOverrides[name as string] as Flags[N];

      // Store in context for tracking
      updateEvalContext({ [name as string]: overrideValue });

      // Write to current active span (use global override value)
      const span = trace.getActiveSpan();
      if (span?.isRecording()) {
        span.setAttributes({ [`flag.${String(name)}`]: String(overrideValue) });
      }

      return overrideValue;
    }

    // Check context overrides (from withFlags() or overrideFlags)
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
