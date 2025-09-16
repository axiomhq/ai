import { getEvalContext, updateEvalContext, putOnSpan, getConfigScope } from './evals/context/storage';

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

  // Fallback to original behavior
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
 * Override flag values for the current evaluation context.
 * This merges the provided flags with any existing flags.
 * 
 * @internal - For framework use only. Use scope.overrideFlags() for typed flag access.
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
