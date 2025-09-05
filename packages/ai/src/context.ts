import { getEvalContext, updateEvalContext, putOnSpan } from './evals/context/storage';

/**
 * Get the value of a feature flag with a default fallback.
 * If the flag has been overridden, returns the overridden value.
 * Otherwise, returns the provided default value.
 * 
 * @param key - The flag key
 * @param defaultValue - The default value to use if flag is not set
 * @returns The flag value
 */
export function flag<V>(key: string, defaultValue: V): V {
  const ctx = getEvalContext();
  const value = (key in ctx.flags) ? ctx.flags[key] as V : defaultValue;
  
  // Update context with accessed flag (for storage consistency)
  updateEvalContext({ [key]: value });
  
  // Store in span
  putOnSpan('flag', key, value);
  
  return value;
}

/**
 * Record a fact (metadata) about the current evaluation.
 * Facts are stored both in the evaluation context and as span attributes.
 * 
 * @param key - The fact key
 * @param value - The fact value
 */
export function fact<V>(key: string, value: V): void {
  // Store in context + span
  updateEvalContext(undefined, { [key]: value });
  putOnSpan('fact', key, value);
}

/**
 * Override flag values for the current evaluation context.
 * This merges the provided flags with any existing flags.
 * 
 * @param partial - Partial flag overrides
 */
export function overrideFlags(partial: Record<string, any>): void {
  updateEvalContext(partial);
  
  // Write all overridden flags to span
  for (const [key, value] of Object.entries(partial)) {
    putOnSpan('flag', key, value);
  }
  
  // TODO: Add EvalContext wrapper for trace-specific isolation
}
