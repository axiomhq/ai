/**
 * Global flag overrides storage for CLI flag functionality.
 */

import { createAsyncHook } from './manager.js';

const flagOverridesHook = createAsyncHook<Record<string, any>>('flag-overrides');

/**
 * Set global flag overrides (called by CLI)
 */
export function setGlobalFlagOverrides(overrides: Record<string, any>): void {
  return flagOverridesHook.run(overrides, () => {});
}

/**
 * Get global flag overrides (called by flag functions)
 */
export function getGlobalFlagOverrides(): Record<string, any> {
  return flagOverridesHook.get() ?? {};
}

/**
 * Clear global flag overrides (for testing)
 */
export function clearGlobalFlagOverrides(): void {
  return flagOverridesHook.run({}, () => {});
}
