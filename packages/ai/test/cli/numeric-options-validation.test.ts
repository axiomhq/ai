import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('cli numeric option validation', () => {
  it('rejects non-numeric --limit values', async () => {
    const result = await runCli([
      'query',
      'run',
      '--apl',
      'limit 1',
      '--limit',
      'nope',
      '--format',
      'json',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`option '--limit <n>' argument 'nope' is invalid`);
    expect(result.stderr).toContain('must be a positive integer');
    expect(result.stdout).toBe('');
  });

  it('rejects non-positive --limit values', async () => {
    const result = await runCli([
      'query',
      'run',
      '--apl',
      'limit 1',
      '--limit',
      '0',
      '--format',
      'json',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`option '--limit <n>' argument '0' is invalid`);
    expect(result.stderr).toContain('must be a positive integer');
  });

  it('rejects invalid --max-cells values', async () => {
    const result = await runCli([
      'query',
      'run',
      '--apl',
      'limit 1',
      '--max-cells',
      'NaN',
      '--format',
      'json',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`option '--max-cells <n>' argument 'NaN' is invalid`);
    expect(result.stderr).toContain('must be a positive integer');
  });

  it('rejects invalid --max-bin-auto-groups values', async () => {
    const result = await runCli([
      'query',
      'run',
      '--apl',
      'limit 1',
      '--max-bin-auto-groups',
      'abc',
      '--format',
      'json',
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      `option '--max-bin-auto-groups <n>' argument 'abc' is invalid`,
    );
    expect(result.stderr).toContain('must be a positive integer');
  });
});
