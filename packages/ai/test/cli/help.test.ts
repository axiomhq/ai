import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('cli help', () => {
  it('prints help and exits 0', async () => {
    const result = await runCli(['--help'], { stdoutIsTTY: true });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('USAGE');
    expect(result.stdout).toContain('axiom');
  });
});
