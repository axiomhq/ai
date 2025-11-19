import { AxiomCLIError } from '../cli/errors';
import { appendFileSync } from 'node:fs';
import { isValidName } from '../util/name-validation-runtime';

/**
 * Records an eval, scorer, capability, or step name
 * Uses a file to work cross-worker
 */
export function recordName(kind: 'eval' | 'scorer' | 'capability' | 'step', name: string): void {
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
 * and is not empty. Throws AxiomCLIError if validation fails.
 */
export function validateName(name: string, kind: 'eval' | 'scorer' | 'capability' | 'step'): void {
  const validation = isValidName(name);
  if (!validation.valid) {
    throw new AxiomCLIError(`❌ ${kind} name: ${validation.error}`);
  }
}
