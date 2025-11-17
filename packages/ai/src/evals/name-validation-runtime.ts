import { AxiomCLIError } from '../cli/errors';
import { appendFileSync } from 'node:fs';

/**
 * Records an eval or scorer name
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
 * and is not empty.
 */
export function validateName(name: string, kind: 'eval' | 'scorer' | 'capability' | 'step'): void {
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
