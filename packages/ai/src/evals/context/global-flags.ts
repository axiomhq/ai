/**
 * Global flag overrides storage for CLI flag functionality.
 * Uses globalThis for process-wide flag persistence.
 */

const GLOBAL_OVERRIDES_SYMBOL = Symbol.for('axiom.global_flag_overrides');

function getRoot(): Record<string, any> {
  return (globalThis as any)[GLOBAL_OVERRIDES_SYMBOL] ?? {};
}

function setRoot(val: Record<string, any>): void {
  (globalThis as any)[GLOBAL_OVERRIDES_SYMBOL] = val;
}

/**
 * Set global flag overrides (called by CLI) - persists until cleared
 */
export function setGlobalFlagOverrides(overrides: Record<string, any>): void {
  setRoot(overrides);
}

/**
 * Get global flag overrides (called by flag functions)
 */
export function getGlobalFlagOverrides(): Record<string, any> {
  return getRoot();
}

/**
 * Clear global flag overrides (for testing)
 */
export function clearGlobalFlagOverrides(): void {
  setRoot({});
}
