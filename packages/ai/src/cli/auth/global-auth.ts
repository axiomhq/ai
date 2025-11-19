import { loadGlobalConfig, getActiveProfile } from './config';

export interface AuthContext {
  readonly token: string;
  readonly url: string;
  readonly orgId: string;
}

/**
 * Module-level store for auth context.
 * This provides explicit, type-safe access to auth credentials.
 */
let authContext: AuthContext | null = null;

/**
 * Gets the current auth context.
 * Returns null if auth hasn't been set up yet.
 */
export function getAuthContext(): AuthContext | null {
  return authContext;
}

/**
 * Sets up authentication context by loading config and storing it.
 *
 * @throws {AxiomCLIError} If no active profile is found
 */
export async function setupGlobalAuth(): Promise<AuthContext | null> {
  const config = await loadGlobalConfig();
  const profile = getActiveProfile(config);
  if (profile) {
    // Store in module-level context for explicit access
    authContext = {
      token: profile.token,
      url: profile.url,
      orgId: profile.org_id,
    };
  }

  return authContext;
}

/**
 * Resets the auth context (useful for testing).
 */
export function resetAuthContext(): void {
  authContext = null;
}
