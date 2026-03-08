import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('cli numeric option validation', () => {
  it('rejects invalid --format choices', async () => {
    const result = await runCli(['query', 'limit 1', '--format', 'jsno']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`option '--format <format>' argument 'jsno' is invalid`);
    expect(result.stderr).toContain(
      'Allowed choices are auto, table, csv, json, ndjson, jsonl, mcp.',
    );
  });

  it('rejects removed --limit flag', async () => {
    const result = await runCli(['query', 'limit 1', '--limit', '5', '--format', 'json']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option '--limit'");
    expect(result.stdout).toBe('');
  });

  it('rejects removed --max-cells flag', async () => {
    const result = await runCli(['query', 'limit 1', '--max-cells', '10', '--format', 'json']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option '--max-cells'");
  });

  it('rejects removed --columns flag', async () => {
    const result = await runCli(['query', 'limit 1', '--columns', 'a,b', '--format', 'csv']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("unknown option '--columns'");
  });

  it('rejects invalid --max-bin-auto-groups values', async () => {
    const result = await runCli([
      'query',
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
