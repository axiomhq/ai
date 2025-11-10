import { AxiomCLIError } from '../cli/errors';
import { appendFileSync } from 'node:fs';

/**
 * Global registry for collecting eval and scorer names.
 */
export const nameRegistry = {
  evals: [] as Array<{ name: string }>,
  scorers: [] as Array<{ name: string }>,
};

/**
 * Records an eval or scorer name both in-memory and to the cross-worker registry file.
 */
export function recordName(kind: 'eval' | 'scorer', name: string): void {
  // Keep in-memory registry for backwards compatibility
  nameRegistry[kind === 'eval' ? 'evals' : 'scorers'].push({ name });

  // Write to file for cross-worker validation
  const registryFile = process.env.AXIOM_NAME_REGISTRY_FILE;
  if (registryFile) {
    try {
      appendFileSync(registryFile, JSON.stringify({ kind, name }) + '\n', 'utf8');
    } catch {
      // Silently fail if we can't write to registry file
    }
  }
}

/**
 * Validates that a name contains only allowed characters (A-Z, a-z, 0-9, -, _)
 * and is not empty.
 */
export function validateName(name: string, kind: 'eval' | 'scorer'): void {
  if (name === '') {
    throw new AxiomCLIError(`❌ ${kind} name cannot be empty`);
  }

  const validPattern = /^[A-Za-z0-9_-]+$/;
  if (!validPattern.test(name)) {
    throw new AxiomCLIError(
      `❌ Invalid character in ${kind} name "${name}". Only A-Z, a-z, 0-9, -, _ allowed`,
    );
  }
}


