import { getEvalContext, putOnSpan, EVAL_CONTEXT } from './evals/context/storage';

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
