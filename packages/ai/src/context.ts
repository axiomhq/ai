import {
  getEvalContext,
  updateEvalContext,
  putOnSpan,
  getConfigScope,
  resolveFlagValue,
  EVAL_CONTEXT,
} from './evals/context/storage';

/**
 * Get the value of a feature flag with a default fallback.
 * If there's a config scope available, delegates to it.
 * Otherwise, uses the eval context with provided default value.
 *
 * @param key - The flag key
 * @param defaultValue - The default value to use if flag is not set
 * @returns The flag value
 */
export function flag<V>(key: string, defaultValue: V): V {
  // Try to delegate to config scope first
  const configScope = getConfigScope();
  if (configScope) {
    try {
      return (configScope as any).flag(key, defaultValue);
    } catch (error) {
      // If config scope fails (e.g., invalid key), fall back to default
      console.warn(`[AxiomAI] Config scope flag access failed for "${key}": ${error}`);
    }
  }

  // Fallback to original behavior with overlay support
  const ctx = getEvalContext();

  // Use overlay-aware resolution if available
  let value: V;
  if (ctx.overrides || ctx.parent) {
    value = resolveFlagValue(ctx, key, defaultValue);
  } else {
    // Legacy path for backwards compatibility
    value = key in ctx.flags ? (ctx.flags[key] as V) : defaultValue;
  }

  updateEvalContext({ [key]: value });

  putOnSpan('flag', key, value);

  return value;
}

/**
 * Record a fact (metadata) about the current evaluation.
 * If there's a config scope available, delegates to it.
 * Otherwise, stores in eval context and span attributes.
 *
 * @param key - The fact key
 * @param value - The fact value
 */
export function fact<V>(key: string, value: V): void {
  // Try to delegate to config scope first
  const configScope = getConfigScope();
  if (configScope) {
    try {
      (configScope as any).fact(key, value);
      return;
    } catch (error) {
      // If config scope fails, fall back to original behavior
      console.warn(`[AxiomAI] Config scope fact recording failed for "${key}": ${error}`);
    }
  }

  // Fallback to original behavior
  updateEvalContext(undefined, { [key]: value });

  putOnSpan('fact', key, value);
}

/**
 * Override flag values for the current evaluation context with trace-specific isolation.
 * Now creates overlay contexts to prevent overrides from leaking to sibling operations.
 *
 * @internal - For framework use only. Use scope.overrideFlags() for typed flag access.
 * @param partial - Partial flag overrides
 */
export function overrideFlags(partial: Record<string, any>): void {
  const current = getEvalContext();

  if (!current) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('overrideFlags called outside of evaluation context');
    }
    return;
  }

  // Create overlay context instead of mutating the current one
  const overlayContext = {
    ...current,
    flags: { ...current.flags, ...partial }, // Merge for backwards compatibility
    parent: current,
    overrides: { ...partial },
  };

  // We need to update the current ALS context in place
  const currentCtx = EVAL_CONTEXT.get();
  if (currentCtx) {
    // Update current context to overlay
    Object.assign(currentCtx, overlayContext);
  }

  // Write all overridden flags to span
  for (const [key, value] of Object.entries(partial)) {
    putOnSpan('flag', key, value);
  }
}
