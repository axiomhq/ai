import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('completion command', () => {
  it('prints bash completion script', async () => {
    const result = await runCli(['completion', 'bash']);

    const expected = readFileSync(
      resolve(process.cwd(), 'generated/completions/axiom.bash'),
      'utf8',
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(expected);
  });

  it('errors for unsupported shells', async () => {
    const result = await runCli(['completion', 'tcsh']);
    expect(result.exitCode).toBe(1);
  });
});
