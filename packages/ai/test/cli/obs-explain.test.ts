import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('obs explain', () => {
  it('uses env var for explain output', async () => {
    const result = await runCli(['dataset', 'list'], {
      stdoutIsTTY: true,
      env: { AXIOM_EXPLAIN: '1' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe('not implemented\n');
    expect(result.stderr).toContain('explain:');
  });

  it('uses flag override for explain output', async () => {
    const result = await runCli(['dataset', 'list', '--explain'], {
      stdoutIsTTY: true,
      env: { AXIOM_EXPLAIN: '0' },
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe('not implemented\n');
    expect(result.stderr).toContain('explain:');
  });
});
