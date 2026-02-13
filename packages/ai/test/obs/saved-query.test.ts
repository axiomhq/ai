import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

describe('saved query commands', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists saved queries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'sq_1',
              name: 'Error count',
              description: 'Errors per service',
              dataset: 'traces',
              query: 'filter status == "error"',
            },
          ]),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', 'saved', 'list', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('sq_1');
    expect(result.stdout).toContain('Error count');
  });

  it('gets a saved query', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'sq_1',
            name: 'Error count',
            description: 'Errors per service',
            dataset: 'traces',
            query: 'filter status == "error"',
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', 'saved', 'get', 'sq_1', '--format', 'json'], {
      env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"id": "sq_1"');
    expect(result.stdout).toContain('"dataset": "traces"');
  });

  it('runs a saved query', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'sq_1',
            dataset: 'traces',
            query: 'group by service | count() ',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ matches: [{ service: 'checkout', count: 7 }] }), {
          status: 200,
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', 'saved', 'run', 'sq_1', '--format', 'mcp'], {
      env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('# Saved Query Result');
    expect(result.stdout).toContain('```apl');
    expect(result.stdout).toContain('```csv');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.axiom.co/v2/datasets/traces/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: 'group by service | count()', maxBinAutoGroups: 40 }),
      }),
    );
  });
});
