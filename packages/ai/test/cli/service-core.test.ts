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
    { name: 'service.name' },
    { name: 'name' },
    { name: 'status.code' },
    { name: 'duration_ms' },
  ],
};

describe('service list/get/operations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('service list expands apl template with detected fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                service: 'checkout',
                total: 100,
                errored: 2,
                error_rate: 0.02,
                avg_duration_ns: 90000000,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'list', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('checkout');

    const callBody = JSON.parse(String(fetchMock.mock.calls[2][1].body));
    expect(callBody.apl).toContain(
      "union (['traces'] | project service=['service.name'], __status=['status.code'], __duration_ns=toreal(['duration_ms']) * 1000000)",
    );
    expect(callBody.apl).toContain(
      'summarize total=count(), errored=countif(tolower(tostring(__status)) == "error"), avg_duration_ns=avg(__duration_ns) by service',
    );
  });

  it('service list runs one union query per edge region', async () => {
    const datasets = [
      { name: 'traces-us-1', region: 'region-us-east-1' },
      { name: 'traces-us-2', region: 'region-us-east-1' },
      { name: 'traces-eu-1', region: 'region-eu-central-1' },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(datasets), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                service: 'payments',
                total: 7,
                errored: 0,
                error_rate: 0,
                avg_duration_ns: 2000000,
              },
            ],
            datasetNames: ['traces-eu-1'],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                service: 'checkout',
                total: 10,
                errored: 1,
                error_rate: 0.1,
                avg_duration_ns: 1000000,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'list', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);

    const queryBodies = fetchMock.mock.calls
      .filter((call) => String(call[0]).includes('/v1/datasets/_apl?format=legacy'))
      .map((call) => JSON.parse(String(call[1].body)));

    expect(queryBodies).toHaveLength(2);
    const aplQueries = queryBodies.map((body) => String(body.apl));
    const euApl = aplQueries.find((apl) => apl.includes("['traces-eu-1']"));
    const usApl = aplQueries.find((apl) => apl.includes("['traces-us-1']") || apl.includes("['traces-us-2']"));
    expect(euApl).toBeDefined();
    expect(euApl).not.toContain("['traces-us-1']");
    expect(euApl).not.toContain("['traces-us-2']");
    expect(usApl).toBeDefined();
    expect(usApl).toContain("['traces-us-1']");
    expect(usApl).toContain("['traces-us-2']");

    const payload = JSON.parse(result.stdout);
    const data = payload.data as Array<{ service: string }>;
    expect(data.some((row) => row.service === 'payments')).toBe(true);
    expect(data.some((row) => row.service === 'checkout')).toBe(true);
  });

  it('service operations renders mcp csv', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              { operation: 'GET /cart', spans: 20, error_spans: 1, error_rate: 0.05, p95_ms: 80, last_seen: '2026-01-01T00:00:00Z' },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'operations', 'checkout', '--format', 'mcp'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('# Service Operations: checkout');
    expect(result.stdout).toContain('```csv');
  });

  it('service get returns summary plus operations in json', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                operation: 'GET /cart',
                total: 40,
                errored: 1,
                error_rate: 0.025,
                avg_duration_ns: 98000000,
              },
              {
                _source: 'traces',
                operation: 'POST /checkout',
                total: 30,
                errored: 2,
                error_rate: 0.066666,
                avg_duration_ns: 150000000,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'get', 'checkout', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"summary"');
    expect(result.stdout).toContain('"operations"');
    expect(result.stdout).toContain('"service": "checkout"');
    expect(result.stdout).toContain('"dataset": "traces"');
    expect(result.stdout).toContain('"operation": "GET /cart"');
  });

  it('service get supports optional operation argument', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                operation: 'router frontend egress',
                total: 42,
                errored: 7,
                error_rate: 0.1666666,
                avg_duration_ns: 11717961.157024793,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                trace_id: 'trace-1',
                started_at: '2026-01-01T00:01:00Z',
                duration_ns: 11000000,
                span_count: 20,
                errored_spans: 0,
                error: false,
              },
              {
                _source: 'traces',
                trace_id: 'trace-2',
                started_at: '2026-01-01T00:00:00Z',
                duration_ns: 12000000,
                span_count: 22,
                errored_spans: 2,
                error: true,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                trace_id: 'trace-2',
                started_at: '2026-01-01T00:00:00Z',
                duration_ns: 12000000,
                span_count: 2,
                errored_spans: 2,
                error: true,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['services', 'get', 'frontend-proxy', 'router frontend egress', '--format', 'json'],
      { env },
    );
    expect(result.exitCode).toBe(0);

    const payload = JSON.parse(result.stdout) as {
      data: {
        summary: { operation: string | null; error_rate: number | null };
        recent_traces: Array<{ trace_id: string }>;
        errored_traces: Array<{ trace_id: string }>;
      };
    };

    expect(payload.data.summary.operation).toBe('router frontend egress');
    expect(payload.data.summary.error_rate).toBe(0.17);
    expect(payload.data.recent_traces).toHaveLength(2);
    expect(payload.data.recent_traces[0]?.trace_id).toBe('trace-1');
    expect(payload.data.errored_traces).toHaveLength(1);
    expect(payload.data.errored_traces[0]?.trace_id).toBe('trace-2');

    const operationsCallBody = JSON.parse(String(fetchMock.mock.calls[2][1].body));
    const recentTracesCallBody = JSON.parse(String(fetchMock.mock.calls[3][1].body));
    const erroredTracesCallBody = JSON.parse(String(fetchMock.mock.calls[4][1].body));
    expect(operationsCallBody.apl).toContain('| where operation == "router frontend egress"');
    expect(recentTracesCallBody.apl).toContain('| where operation == "router frontend egress"');
    expect(erroredTracesCallBody.apl).toContain('| where toupper(tostring(__status)) == "ERROR"');
  });

  it('service get operation returns last 5 traces and last 5 errored traces', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                operation: 'GET /cart',
                total: 40,
                errored: 4,
                error_rate: 0.1,
                avg_duration_ns: 98000000,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                trace_id: 'trace-1',
                started_at: 1772129551000000000,
                duration_ns: 11000000,
                span_count: 20,
                errored_spans: 0,
                error: false,
              },
              {
                _source: 'traces',
                trace_id: 'trace-2',
                started_at: 1772129552000000000,
                duration_ns: 12000000,
                span_count: 22,
                errored_spans: 2,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'trace-3',
                started_at: 1772129553000000000,
                duration_ns: 13000000,
                span_count: 23,
                errored_spans: 0,
                error: false,
              },
              {
                _source: 'traces',
                trace_id: 'trace-4',
                started_at: 1772129554000000000,
                duration_ns: 14000000,
                span_count: 24,
                errored_spans: 1,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'trace-5',
                started_at: 1772129555000000000,
                duration_ns: 15000000,
                span_count: 25,
                errored_spans: 0,
                error: false,
              },
              {
                _source: 'traces',
                trace_id: 'trace-6',
                started_at: 1772129556000000000,
                duration_ns: 16000000,
                span_count: 26,
                errored_spans: 1,
                error: true,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                trace_id: 'err-1',
                started_at: 1772129551000000000,
                duration_ns: 11000000,
                span_count: 20,
                errored_spans: 20,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'err-2',
                started_at: 1772129552000000000,
                duration_ns: 12000000,
                span_count: 22,
                errored_spans: 22,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'err-3',
                started_at: 1772129553000000000,
                duration_ns: 13000000,
                span_count: 23,
                errored_spans: 23,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'err-4',
                started_at: 1772129554000000000,
                duration_ns: 14000000,
                span_count: 24,
                errored_spans: 24,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'err-5',
                started_at: 1772129555000000000,
                duration_ns: 15000000,
                span_count: 25,
                errored_spans: 25,
                error: true,
              },
              {
                _source: 'traces',
                trace_id: 'err-6',
                started_at: 1772129556000000000,
                duration_ns: 16000000,
                span_count: 26,
                errored_spans: 26,
                error: true,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'get', 'checkout', 'GET /cart', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);

    const payload = JSON.parse(result.stdout) as {
      data: {
        recent_traces: Array<{ trace_id: string; started_at: string | null }>;
        errored_traces: Array<{ trace_id: string; started_at: string | null }>;
      };
    };

    expect(payload.data.recent_traces).toHaveLength(5);
    expect(payload.data.errored_traces).toHaveLength(5);
    expect(payload.data.recent_traces[0]?.trace_id).toBe('trace-6');
    expect(payload.data.errored_traces[0]?.trace_id).toBe('err-6');
    payload.data.recent_traces.forEach((row) => {
      expect(typeof row.started_at).toBe('string');
    });
    payload.data.errored_traces.forEach((row) => {
      expect(typeof row.started_at).toBe('string');
    });
  });

  it('service get table output keeps full trace ids in recent trace sections', async () => {
    const fullTraceId = '352078bd1f95065893f9b7e2d4f04e32';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                operation: 'ingress',
                total: 40,
                errored: 0,
                error_rate: 0,
                avg_duration_ns: 98000000,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _source: 'traces',
                trace_id: fullTraceId,
                started_at: '2026-01-01T00:00:00Z',
                duration_ns: 12000000,
                span_count: 2,
                errored_spans: 0,
                error: false,
              },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ matches: [] }), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'get', 'checkout', 'ingress', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`[1] trace_id: ${fullTraceId}`);
    expect(result.stdout).toContain('Recent errored traces');
  });
});
