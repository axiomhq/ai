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

describe('obs command integration contracts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders list-style commands as ndjson when piped', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'alpha', created_at: '2026-01-01T00:00:00Z' }]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'sq_1', name: 'Errors by service' }]), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'mon_1', name: 'High errors', enabled: true }]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                service: 'checkout',
                last_seen: '2026-01-01T00:00:00Z',
                spans: 12,
                error_spans: 1,
                error_rate: 0.08,
                p95_ms: 45,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                trace_id: 't-1',
                root_operation: 'GET /checkout',
                started_at: '2026-01-01T00:00:00Z',
                duration_ms: 120,
                span_count: 4,
                error: 1,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const datasetList = await runCli(['dataset', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });
    const savedList = await runCli(['query', 'saved', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });
    const monitorList = await runCli(['monitor', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });
    const serviceList = await runCli(['service', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });
    const traceList = await runCli(['trace', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });

    expect(datasetList.exitCode).toBe(0);
    expect(savedList.exitCode).toBe(0);
    expect(monitorList.exitCode).toBe(0);
    expect(serviceList.exitCode).toBe(0);
    expect(traceList.exitCode).toBe(0);

    expect(datasetList.stdout).toMatchInlineSnapshot(
      `"{\"name\":\"alpha\",\"description\":null,\"created_at\":\"2026-01-01T00:00:00Z\",\"modified_at\":null}\n"`,
    );
    expect(savedList.stdout).toMatchInlineSnapshot(
      `"{\"id\":\"sq_1\",\"name\":\"Errors by service\",\"description\":null,\"dataset\":null}\n"`,
    );
    expect(monitorList.stdout).toMatchInlineSnapshot(
      `"{\"id\":\"mon_1\",\"name\":\"High errors\",\"dataset\":\"\",\"enabled\":true,\"schedule\":\"\",\"last_run_at\":null,\"last_state\":\"unknown\"}\n"`,
    );
    expect(serviceList.stdout).toMatchInlineSnapshot(
      `"{\"service\":\"checkout\",\"last_seen\":\"2026-01-01T00:00:00Z\",\"spans\":12,\"error_spans\":1,\"error_rate\":0.08,\"p95_ms\":45}\n"`,
    );
    expect(traceList.stdout).toMatchInlineSnapshot(
      `"{\"trace_id\":\"t-1\",\"root_operation\":\"GET /checkout\",\"started_at\":\"2026-01-01T00:00:00Z\",\"duration_ms\":120,\"span_count\":4,\"error\":1}\n"`,
    );
  });

  it('renders get-style commands in json wrappers', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: 'alpha', description: 'main' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'sq_1', name: 'Errors by service', query: 'limit 1' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'mon_1', name: 'High errors', enabled: true }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                spans: 12,
                last_seen: '2026-01-01T00:00:00Z',
                error_spans: 1,
                error_rate: 0.08,
                p50_ms: 10,
                p95_ms: 45,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [{ operation: 'GET /checkout', spans: 12, error_rate: 0.08, p95_ms: 45 }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                start: '2026-01-01T00:00:00Z',
                duration_ms: 100,
                service: 'checkout',
                operation: 'GET /checkout',
                kind: 'server',
                status: 'ok',
                span_id: 'root',
                parent_span_id: null,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const datasetGet = await runCli(['dataset', 'get', 'alpha', '--format', 'json'], { env });
    const savedGet = await runCli(['query', 'saved', 'get', 'sq_1', '--format', 'json'], { env });
    const monitorGet = await runCli(['monitor', 'get', 'mon_1', '--format', 'json'], { env });
    const serviceGet = await runCli(['service', 'get', 'checkout', '--format', 'json'], { env });
    const traceGet = await runCli(['trace', 'get', 'trace-1', '--format', 'json'], { env });

    vi.useRealTimers();

    expect(datasetGet.exitCode).toBe(0);
    expect(savedGet.exitCode).toBe(0);
    expect(monitorGet.exitCode).toBe(0);
    expect(serviceGet.exitCode).toBe(0);
    expect(traceGet.exitCode).toBe(0);

    const parsedDataset = JSON.parse(datasetGet.stdout);
    const parsedTrace = JSON.parse(traceGet.stdout);

    expect(parsedDataset).toMatchInlineSnapshot(`
      {
        "data": [
          {
            "created_at": null,
            "description": "main",
            "modified_at": null,
            "name": "alpha",
          },
        ],
        "meta": {
          "command": "axiom dataset get",
          "generated_at": "2026-02-01T00:00:00.000Z",
          "rows_shown": 1,
          "rows_total": 1,
          "truncated": false,
        },
      }
    `);
    expect(savedGet.stdout).toContain('"id": "sq_1"');
    expect(savedGet.stdout).toContain('"command": "axiom query saved get"');
    expect(monitorGet.stdout).toContain('"id": "mon_1"');
    expect(monitorGet.stdout).toContain('"command": "axiom monitor get"');
    expect(serviceGet.stdout).toContain('"service": "checkout"');
    expect(serviceGet.stdout).toContain('"command": "axiom service get"');
    expect(parsedTrace.meta.command).toBe('axiom trace get');
    expect(parsedTrace.data.metadata.trace_id).toBe('trace-1');
  });

  it('renders mcp for querying commands and writes explain to stderr', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ matches: [{ _time: '2026-01-01T00:00:00Z', value: 1 }] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'sq_1', dataset: 'alpha', query: 'limit 1' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ matches: [{ _time: '2026-01-01T00:00:00Z', value: 2 }] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            history: [
              {
                started_at: '2026-01-01T00:00:00Z',
                duration_ms: 20,
                state: 'ok',
                triggered: false,
                message: 'ok',
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ matches: [{ operation: 'GET /checkout', spans: 3, error_spans: 0, error_rate: 0, p95_ms: 30, last_seen: '2026-01-01T00:00:00Z' }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ matches: [{ trace_id: 't-1', root_operation: 'GET /checkout', started_at: '2026-01-01T00:00:00Z', duration_ms: 120, span_count: 4, error: 1 }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ fields: [{ name: 'service.name' }, { name: 'trace_id' }, { name: 'severity_text' }, { name: 'message' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ matches: [{ _time: '2026-01-01T00:00:00Z', severity: 'error', message: 'boom', trace_id: 't-1' }] }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ matches: [{ start: '2026-01-01T00:00:00Z', duration_ms: 10, service: 'checkout', operation: 'op', kind: 'server', status: 'ok', span_id: 's1', parent_span_id: null }] }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const sample = await runCli(
      ['dataset', 'sample', 'alpha', '--format', 'mcp', '--explain', '--limit', '1'],
      { env },
    );
    const queryRun = await runCli(
      ['query', 'run', 'alpha', '--apl', 'limit 1', '--format', 'mcp', '--explain'],
      { env },
    );
    const savedRun = await runCli(
      ['query', 'saved', 'run', 'sq_1', '--format', 'mcp', '--explain'],
      { env },
    );
    const monitorHistory = await runCli(
      ['monitor', 'history', 'mon_1', '--format', 'mcp', '--explain'],
      { env },
    );
    const serviceOps = await runCli(
      ['service', 'operations', 'checkout', '--format', 'mcp', '--explain'],
      { env },
    );
    const serviceTraces = await runCli(
      ['service', 'traces', 'checkout', '--format', 'mcp', '--explain'],
      { env },
    );
    const serviceLogs = await runCli(
      [
        'service',
        'logs',
        'checkout',
        '--logs-dataset',
        'logs',
        '--format',
        'mcp',
        '--explain',
      ],
      { env },
    );
    const traceSpans = await runCli(
      ['trace', 'spans', 'trace-1', '--format', 'mcp', '--explain'],
      { env },
    );

    expect(sample.stdout).toBe('');
    expect(sample.stderr).toBe('');

    expect(queryRun.stdout).toContain('```apl');
    expect(queryRun.stderr).toContain('/v1/datasets/_apl?format=legacy');
    expect(queryRun.stderr).toContain('apl="limit 1"');

    expect(savedRun.exitCode).toBe(0);
    expect(savedRun.stderr).toContain('/v2/saved-queries/sq_1');
    expect(savedRun.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(monitorHistory.stdout).toContain('```csv');
    expect(monitorHistory.stderr).toContain('/v2/monitors/mon_1/history');

    expect(serviceOps.stdout).toContain('# Service Operations: checkout');
    expect(serviceOps.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(serviceTraces.stdout).toContain('# Service Traces: checkout');
    expect(serviceTraces.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(serviceLogs.stdout).toContain('# Service Logs: checkout');
    expect(serviceLogs.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(traceSpans.stdout).toContain('# Trace Spans: trace-1');
    expect(traceSpans.stderr).toContain('/v1/datasets/_apl?format=legacy');
  });
});
