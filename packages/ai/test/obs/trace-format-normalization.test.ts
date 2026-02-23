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

const buildTraceQueryMock = (matches: Record<string, unknown>[]) =>
  vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          matches,
        }),
        { status: 200 },
      ),
    );

describe('trace format normalization', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('trace spans unwraps legacy row envelopes for all output formats', async () => {
    const wrappedRows = [
      {
        _time: '2026-01-01T00:00:00Z',
        _sysTime: '1970-01-01T00:00:00Z',
        _rowId: 'row-1',
        data: {
          start: '2026-01-01T00:00:00Z',
          duration_ms: 100,
          service: 'checkout',
          operation: 'GET /checkout',
          kind: 'server',
          status: 'ok',
          span_id: 'root',
          parent_span_id: null,
        },
      },
    ];

    const runForFormat = async (format: 'json' | 'csv' | 'ndjson' | 'mcp') => {
      vi.stubGlobal('fetch', buildTraceQueryMock(wrappedRows));
      return runCli(['traces', 'spans', 'trace-legacy', '--format', format], { env });
    };

    const jsonResult = await runForFormat('json');
    expect(jsonResult.exitCode).toBe(0);
    const parsedJson = JSON.parse(jsonResult.stdout);
    expect(parsedJson.data[0]).toMatchObject({
      start: '2026-01-01T00:00:00Z',
      service: 'checkout',
      span_id: 'root',
    });
    expect(parsedJson.data[0]).not.toHaveProperty('data');

    const csvResult = await runForFormat('csv');
    expect(csvResult.exitCode).toBe(0);
    expect(csvResult.stdout).toContain(
      '2026-01-01T00:00:00Z,100,checkout,GET /checkout,server,ok,root,',
    );

    const ndjsonResult = await runForFormat('ndjson');
    expect(ndjsonResult.exitCode).toBe(0);
    const parsedNdjson = JSON.parse(ndjsonResult.stdout.trim());
    expect(parsedNdjson).toMatchObject({
      start: '2026-01-01T00:00:00Z',
      service: 'checkout',
      span_id: 'root',
    });

    const mcpResult = await runForFormat('mcp');
    expect(mcpResult.exitCode).toBe(0);
    expect(mcpResult.stdout).toContain('```csv');
    expect(mcpResult.stdout).toContain(
      '2026-01-01T00:00:00Z,100,checkout,GET /checkout,server,ok,root,',
    );
  });

  it('trace get unwraps legacy row envelopes for csv/json rendering', async () => {
    const wrappedRows = [
      {
        _time: '2026-01-01T00:00:00Z',
        _sysTime: '1970-01-01T00:00:00Z',
        _rowId: 'row-1',
        data: {
          start: '2026-01-01T00:00:00Z',
          duration_ms: 100,
          service: 'checkout',
          operation: 'GET /checkout',
          kind: 'server',
          status: 'ok',
          span_id: 'root',
          parent_span_id: null,
        },
      },
      {
        _time: '2026-01-01T00:00:01Z',
        _sysTime: '1970-01-01T00:00:00Z',
        _rowId: 'row-2',
        data: {
          start: '2026-01-01T00:00:01Z',
          duration_ms: 40,
          service: 'payments',
          operation: 'POST /charge',
          kind: 'client',
          status: 'error',
          span_id: 'child',
          parent_span_id: 'root',
        },
      },
    ];

    const runForFormat = async (format: 'json' | 'csv') => {
      vi.stubGlobal('fetch', buildTraceQueryMock(wrappedRows));
      return runCli(['traces', 'get', 'trace-legacy', '--format', format], { env });
    };

    const jsonResult = await runForFormat('json');
    expect(jsonResult.exitCode).toBe(0);
    const parsedJson = JSON.parse(jsonResult.stdout);
    expect(parsedJson.data.top_spans[0]).toMatchObject({
      start: '2026-01-01T00:00:00Z',
      service: 'checkout',
      span_id: 'root',
    });

    const csvResult = await runForFormat('csv');
    expect(csvResult.exitCode).toBe(0);
    expect(csvResult.stdout).toContain(
      '2026-01-01T00:00:00Z,100,checkout,GET /checkout,server,ok,root,',
    );
    expect(csvResult.stdout).toContain('|  100 checkout GET /checkout OK');
  });
});
