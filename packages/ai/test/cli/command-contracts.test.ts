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

describe('cli command integration contracts', () => {
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
        new Response(
          JSON.stringify([
            {
              id: 'mon_1',
              name: 'High errors',
              enabled: true,
              type: 'threshold',
              dataset: 'traces',
              schedule: '*/5 * * * *',
              notifiers: ['pagerduty'],
            },
          ]),
          {
            status: 200,
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              mon_1: [
                ['2026-01-01T00:05:00Z'],
                ['run_1'],
                [false],
                [''],
                ['closed'],
                [5],
                [''],
                ['2026-01-01T00:00:00Z'],
                ['2026-01-01T00:05:00Z'],
                ['2026-01-01T00:05:00Z'],
                [false],
                [''],
              ],
            },
            fields: [
              '_time',
              'run_id',
              'notified',
              'group_values',
              'alert_state',
              'matching_value',
              'error',
              'query.startTime',
              'query.endTime',
              'run_time',
              'notification_failed',
              'notification_error',
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
                service: 'checkout',
                total: 12,
                errored: 1,
                error_rate: 0.08,
                avg_duration_ns: 45000000,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const datasetList = await runCli(['datasets', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });
    const monitorList = await runCli(['monitors', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });
    const serviceList = await runCli(['services', 'list', '--format', 'auto'], {
      env,
      stdoutIsTTY: false,
    });

    expect(datasetList.exitCode).toBe(0);
    expect(monitorList.exitCode).toBe(0);
    expect(serviceList.exitCode).toBe(0);

    expect(datasetList.stdout).toMatchInlineSnapshot(
      `"{\"name\":\"alpha\",\"created_at\":\"2026-01-01T00:00:00Z\",\"description\":null}\n"`,
    );
    expect(monitorList.stdout).toMatchInlineSnapshot(
      `"{\"id\":\"mon_1\",\"name\":\"High errors\",\"status\":\"closed\",\"recent_run\":\"2026-01-01T00:05:00Z\",\"type\":\"threshold\",\"dataset\":\"traces\",\"frequency\":\"*/5 * * * *\"}\n"`,
    );
    expect(serviceList.stdout).toMatchInlineSnapshot(
      `"{\"service\":\"checkout\",\"total\":12,\"errored\":1,\"error_rate\":0.08,\"avg_duration_ns\":45000000}\n"`,
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
        new Response(JSON.stringify({ id: 'mon_1', name: 'High errors', enabled: true }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              mon_1: [
                ['2026-01-01T00:00:00Z'],
                ['run_1'],
                [false],
                [''],
                ['closed'],
                [5],
                [''],
                ['2025-12-31T23:00:00Z'],
                ['2026-01-01T00:00:00Z'],
                ['2026-01-01T00:00:00Z'],
                [false],
                [''],
              ],
            },
            fields: [
              '_time',
              'run_id',
              'notified',
              'group_values',
              'alert_state',
              'matching_value',
              'error',
              'query.startTime',
              'query.endTime',
              'run_time',
              'notification_failed',
              'notification_error',
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
                _source: 'traces',
                operation: 'GET /checkout',
                total: 12,
                errored: 1,
                error_rate: 0.08,
                avg_duration_ns: 45000000,
              },
            ],
          }),
          { status: 200 },
        ),
      )
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

    const datasetGet = await runCli(['datasets', 'get', 'alpha', '--format', 'json'], { env });
    const monitorGet = await runCli(['monitors', 'get', 'mon_1', '--format', 'json'], { env });
    const serviceGet = await runCli(['services', 'get', 'checkout', '--format', 'json'], { env });
    const traceGet = await runCli(
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

    vi.useRealTimers();

    expect(datasetGet.exitCode).toBe(0);
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
            "name": "alpha",
          },
        ],
        "meta": {
          "command": "axiom datasets get",
          "generated_at": "2026-02-01T00:00:00.000Z",
          "rows_shown": 1,
          "rows_total": 1,
          "truncated": false,
        },
      }
    `);
    expect(monitorGet.stdout).toContain('"id": "mon_1"');
    expect(monitorGet.stdout).toContain('"command": "axiom monitors get"');
    expect(serviceGet.stdout).toContain('"service": "checkout"');
    expect(serviceGet.stdout).toContain('"command": "axiom services get"');
    expect(parsedTrace.meta.command).toBe('axiom traces get');
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
        new Response(JSON.stringify({ matches: [{ _time: '2026-01-01T00:00:00Z', value: 2 }] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              mon_1: [
                ['2026-01-01T00:00:00Z'],
                ['run_1'],
                [false],
                ['checkout'],
                ['closed'],
                [20],
                [''],
                ['2025-12-31T23:00:00Z'],
                ['2026-01-01T00:00:00Z'],
                ['2026-01-01T00:00:00Z'],
                [false],
                [''],
              ],
            },
            fields: [
              '_time',
              'run_id',
              'notified',
              'group_values',
              'alert_state',
              'matching_value',
              'error',
              'query.startTime',
              'query.endTime',
              'run_time',
              'notification_failed',
              'notification_error',
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
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ matches: [{ start: '2026-01-01T00:00:00Z', duration_ms: 10, service: 'checkout', operation: 'op', kind: 'server', status: 'ok', span_id: 's1', parent_span_id: null }] }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const sample = await runCli(
      ['datasets', 'sample', 'alpha', '--format', 'mcp', '--explain'],
      { env },
    );
    const queryRun = await runCli(
      ['query', "['alpha'] | limit 1", '--format', 'mcp', '--explain'],
      { env },
    );
    const monitorHistory = await runCli(
      ['monitors', 'history', 'mon_1', '--format', 'mcp', '--explain'],
      { env },
    );
    const serviceOps = await runCli(
      ['services', 'operations', 'checkout', '--format', 'mcp', '--explain'],
      { env },
    );
    const serviceTraces = await runCli(
      ['services', 'traces', 'checkout', '--format', 'mcp', '--explain'],
      { env },
    );
    const serviceLogs = await runCli(
      [
        'services',
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
    const traceGet = await runCli(
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
        'mcp',
        '--explain',
      ],
      { env },
    );

    expect(sample.exitCode).toBe(0);
    expect(sample.stdout).toContain('# Dataset alpha sample');
    expect(sample.stdout).toContain('```csv');
    expect(sample.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(queryRun.exitCode).toBe(0);
    expect(queryRun.stdout).toContain('```apl');
    expect(queryRun.stderr).toContain('/v1/datasets/_apl?format=legacy');
    expect(queryRun.stderr).toContain('apl=');
    expect(queryRun.stderr).toContain('limit 1');

    expect(monitorHistory.exitCode).toBe(0);
    expect(monitorHistory.stdout).toContain('```csv');
    expect(monitorHistory.stderr).toContain('/api/internal/monitors/history?monitorIds=mon_1');

    expect(serviceOps.exitCode).toBe(0);
    expect(serviceOps.stdout).toContain('# Service Operations: checkout');
    expect(serviceOps.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(serviceTraces.exitCode).toBe(0);
    expect(serviceTraces.stdout).toContain('# Service Traces: checkout');
    expect(serviceTraces.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(serviceLogs.exitCode).toBe(0);
    expect(serviceLogs.stdout).toContain('# Service Logs: checkout');
    expect(serviceLogs.stderr).toContain('/v1/datasets/_apl?format=legacy');

    expect(traceGet.exitCode).toBe(0);
    expect(traceGet.stdout).toContain('# Trace trace-1');
    expect(traceGet.stderr).toContain('/v1/datasets/_apl?format=legacy');
  });
});
