import { VitestTestRunner } from 'vitest/runners';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { validateName } from '../evals/name-validation-runtime';

/**
 * Custom Vitest runner that validates eval and scorer names before running any tests.
 *
 * The default runner doesn't give us a good way of doing this validation
 * before tests start, unfortunately.
 */
export default class AxiomEvalRunner extends VitestTestRunner {
  private validationChecked = false;

  /**
   * Override onBeforeRunSuite to validate names before the first suite runs.
   */
  async onBeforeRunSuite(suite: any): Promise<void> {
    if (!this.validationChecked) {
      this.validationChecked = true;

      const registryFile = process.env.AXIOM_NAME_REGISTRY_FILE;
      const abortFile = process.env.AXIOM_ABORT_FILE;

      // Validate all names from the registry file
      if (registryFile && abortFile && existsSync(registryFile)) {
        const errors: string[] = [];
        const content = readFileSync(registryFile, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        const seenEvals = new Set<string>();
        const seenScorers = new Set<string>();

        for (const line of lines) {
          try {
            const record = JSON.parse(line) as { kind: 'eval' | 'scorer'; name: string };
            const seen = record.kind === 'eval' ? seenEvals : seenScorers;
            if (seen.has(record.name)) continue;
            seen.add(record.name);

            try {
              validateName(record.name, record.kind);
            } catch (error) {
              errors.push((error as Error).message);
            }
          } catch {
            // Skip malformed lines
          }
        }

        if (errors.length > 0) {
          const message = [
            'Validation failed. No tests will run due to the following errors:',
            '',
            ...errors,
            '',
          ].join('\n');

          writeFileSync(abortFile, message, 'utf8');
          throw new Error('\n' + message + '\n');
        }
      }
    }

    await super.onBeforeRunSuite(suite);
  }
}
