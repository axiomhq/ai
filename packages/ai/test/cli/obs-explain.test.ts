import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('obs explain', () => {
  it('prints explain header for stub commands', async () => {
    const result = await runCli(['dataset', 'list', '--explain'], { stdoutIsTTY: true });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe('not implemented\n');
    expect(result.stderr).toContain('explain:');
    expect(result.stderr).toContain('requests:');
    expect(result.stderr).toContain('queries:');
  });
});
