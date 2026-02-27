import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

const tracesSchema = {
  fields: [
    { name: 'trace_id' },
    { name: 'span_id' },
    { name: 'parent_span_id' },
    { name: 'service.name' },
    { name: 'name' },
    { name: 'kind' },
    { name: 'status.code' },
    { name: 'duration_ms' },
  ],
};

describe('trace commands', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('trace get builds a tree when parent relationships exist', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                start: '2026-01-01T00:00:00Z',
                duration_ms: 100,
                service: 'checkout',
                operation: 'GET /checkout',
                kind: 'server',
                status: 'ok',
                span_id: 'root',
                parent_span_id: null,
              },
              {
                _source: 'traces',
                start: '2026-01-01T00:00:01Z',
                duration_ms: 40,
                service: 'payments',
                operation: 'POST /charge',
                kind: 'client',
                status: 'error',
                span_id: 'child',
                parent_span_id: 'root',
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      [
        'traces',
        'get',
        'trace-1',
        '--dataset',
        'traces',
        '--since',
        'now-30m',
        '--until',
        'now',
        '--format',
        'json',
      ],
      { env },
    );

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      data: {
        metadata: { tree_mode: string };
        tree: Array<{ spans: string; span_id: string }>;
      };
    };
    expect(payload.data.metadata.tree_mode).toBe('tree');
    expect(payload.data.tree[0]).toEqual({
      spans: '\\-100ms checkout GET /checkout',
      span_id: 'root',
    });
    expect(payload.data.tree[1]).toEqual({
      spans: '  \\-40ms payments (!) POST /charge',
      span_id: 'child',
    });
  });

  it('trace get falls back to list view when parent links are missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: Array.from({ length: 8 }).map((_, index) => ({
              _source: 'traces',
              start: `2026-01-01T00:00:0${index}Z`,
              duration_ms: 100 - index,
              service: 'checkout',
              operation: `op-${index}`,
              kind: 'server',
              status: 'ok',
              span_id: `s-${index}`,
              parent_span_id: null,
            })),
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      [
        'traces',
        'get',
        'trace-2',
        '--dataset',
        'traces',
        '--since',
        'now-30m',
        '--until',
        'now',
        '--format',
        'table',
      ],
      {
        env,
        stdoutIsTTY: true,
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('tree_mode');
    expect(result.stdout).toContain('fallback');
    expect(result.stdout).toContain('spans');
    expect(result.stdout).toContain('span_id');
    expect(result.stdout).not.toContain('dataset  start');
    expect(result.stderr).toBe('');
  });

  it('trace get validates required dataset/since/until', async () => {
    const missingDataset = await runCli(['traces', 'get', 'trace-1'], { env });
    expect(missingDataset.exitCode).toBe(1);
    expect(missingDataset.stderr).toContain('Missing required --dataset');

    const missingSince = await runCli(
      ['traces', 'get', 'trace-1', '--dataset', 'traces', '--until', 'now'],
      { env },
    );
    expect(missingSince.exitCode).toBe(1);
    expect(missingSince.stderr).toContain('Missing required --since');

    const missingUntil = await runCli(
      ['traces', 'get', 'trace-1', '--dataset', 'traces', '--since', 'now-30m'],
      { env },
    );
    expect(missingUntil.exitCode).toBe(1);
    expect(missingUntil.stderr).toContain('Missing required --until');
  });

  it('trace get uses dataset and time range from caller', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ matches: [] }), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      [
        'traces',
        'get',
        'trace-1',
        '--dataset',
        'traces',
        '--since',
        'now-30m',
        '--until',
        'now',
        '--format',
        'json',
      ],
      { env },
    );
    expect(result.exitCode).toBe(0);

    const queryCall = fetchMock.mock.calls[1];
    const queryBody = JSON.parse(String(queryCall?.[1]?.body)) as {
      apl: string;
      startTime: string;
      endTime: string;
    };
    expect(queryBody.apl).toContain("union (['traces']");
    expect(queryBody.startTime).toBe('now-30m');
    expect(queryBody.endTime).toBe('now');
  });

});
