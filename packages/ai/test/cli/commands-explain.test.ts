import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('cli command explain', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses env var for explain output', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: [
              { name: 'trace_id' },
              { name: 'span_id' },
              { name: 'service.name' },
              { name: 'name' },
              { name: 'duration_ms' },
              { name: 'status.code' },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ matches: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['traces', 'get', 'trace-1', '--dataset', 'traces', '--since', 'now-30m', '--until', 'now'], {
      stdoutIsTTY: true,
      env: { AXIOM_EXPLAIN: '1', AXIOM_TOKEN: 'token', AXIOM_ORG_ID: 'org' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('explain:');
    expect(result.stderr).toContain('/v2/datasets/traces/fields');
    expect(result.stderr).toContain('/v1/datasets/_apl?format=legacy');
  });

  it('uses flag override for explain output', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: [
              { name: 'trace_id' },
              { name: 'span_id' },
              { name: 'service.name' },
              { name: 'name' },
              { name: 'duration_ms' },
              { name: 'status.code' },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ matches: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['traces', 'get', 'trace-1', '--dataset', 'traces', '--since', 'now-30m', '--until', 'now', '--explain'],
      {
      stdoutIsTTY: true,
      env: { AXIOM_EXPLAIN: '0', AXIOM_TOKEN: 'token', AXIOM_ORG_ID: 'org' },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('explain:');
    expect(result.stderr).toContain('/v2/datasets/traces/fields');
    expect(result.stderr).toContain('/v1/datasets/_apl?format=legacy');
  });
});
