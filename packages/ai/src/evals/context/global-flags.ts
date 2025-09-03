/**
 * Global flag overrides storage for CLI flag functionality.
 * Uses process.env for persistence across module boundaries.
 */

const GLOBAL_FLAGS_ENV_KEY = '__AXIOM_CLI_FLAGS__';

/**
 * Set global flag overrides (called by CLI)
 */
export function setGlobalFlagOverrides(overrides: Record<string, any>): void {
  // Store in process.env as JSON string
  process.env[GLOBAL_FLAGS_ENV_KEY] = JSON.stringify(overrides);
}

/**
 * Get global flag overrides (called by flag functions)
 */
export function getGlobalFlagOverrides(): Record<string, any> {
  const stored = process.env[GLOBAL_FLAGS_ENV_KEY];
  if (!stored) {
    return {};
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    // Silently ignore parsing errors and return empty
    return {};
  }
}

/**
 * Clear global flag overrides (for testing)
 */
export function clearGlobalFlagOverrides(): void {
  delete process.env[GLOBAL_FLAGS_ENV_KEY];
}
