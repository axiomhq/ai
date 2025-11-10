import type { Reporter, TestSuite, Vitest } from 'vitest/node';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { validateName } from './name-validation-runtime';

interface NameRecord {
  kind: 'eval' | 'scorer';
  name: string;
}

/**
 * Vitest reporter that validates eval and scorer names in the main process
 * after all test files are collected but before execution begins.
 */
export class NameValidationReporter implements Reporter {
  private validated = false;

  onInit(_vitest: Vitest): void {
    this.validated = false;
  }

  onTestSuiteReady(_testSuite: TestSuite): void {
    // Validate once before first suite runs
    if (!this.validated) {
      this.validated = true;
      this.validateAllNames();
    }
  }

  private validateAllNames(): void {
    const registryFile = process.env.AXIOM_NAME_REGISTRY_FILE;
    const abortFile = process.env.AXIOM_ABORT_FILE;

    if (!registryFile || !abortFile) {
      return;
    }

    if (!existsSync(registryFile)) {
      return;
    }

    const errors: string[] = [];
    const seenEvals = new Set<string>();
    const seenScorers = new Set<string>();

    // Read all name records from JSONL file
    const content = readFileSync(registryFile, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const record: NameRecord = JSON.parse(line);

        // Track duplicates
        const seen = record.kind === 'eval' ? seenEvals : seenScorers;
        if (seen.has(record.name)) {
          continue; // Skip validation for duplicates (they're the same name)
        }
        seen.add(record.name);

        // Validate name
        try {
          validateName(record.name, record.kind);
        } catch (error) {
          errors.push((error as Error).message);
        }
      } catch {
        // Skip malformed lines
      }
    }

    // If any errors, write abort file and fail
    if (errors.length > 0) {
      const message = [
        'Validation failed. No tests will run due to the following errors:',
        '',
        ...errors,
        '',
      ].join('\n');

      writeFileSync(abortFile, message, 'utf8');
      console.error('\n' + message);
    }
  }
}
