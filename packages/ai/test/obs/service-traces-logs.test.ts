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

const logsSchema = {
  fields: [
    { name: 'service.name' },
    { name: 'trace_id' },
    { name: 'severity_text' },
    { name: 'message' },
  ],
};

describe('service traces/logs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('service traces returns error-first rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                trace_id: 'trace-2',
                root_operation: 'GET /checkout',
                started_at: '2026-01-01T00:00:10Z',
                duration_ms: 120,
                span_count: 3,
                error: 0,
              },
              {
                trace_id: 'trace-1',
                root_operation: 'POST /charge',
                started_at: '2026-01-01T00:00:15Z',
                duration_ms: 220,
                span_count: 6,
                error: 1,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'traces', 'checkout', '--format', 'json'], {
      env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"trace_id": "trace-1"');
    expect(result.stdout).toContain('"trace_id": "trace-2"');

    const callBody = JSON.parse(String(fetchMock.mock.calls[2][1].body));
    expect(callBody.apl).toContain("by trace_id=['trace_id']");
    expect(callBody.apl).toContain("where ['service.name'] == \"checkout\"");
  });

  it('service logs supports dataset alias override and mcp output', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(logsSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                _time: '2026-01-01T00:00:00Z',
                severity: 'error',
                message: 'boom',
                trace_id: 't1',
              },
              {
                _time: '2026-01-01T00:00:01Z',
                severity: 'warn',
                message: 'slow',
                trace_id: 't2',
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      [
        'services',
        'logs',
        'checkout',
        '--dataset',
        'logs',
        '--format',
        'mcp',
      ],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('# Service Logs: checkout');
    expect(result.stdout).toContain('```csv');

    const callBody = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(callBody.apl).toContain('| sort by _time desc');
  });

  it('service logs errors when no logs dataset is detected', async () => {
    const nonLogsSchema = {
      fields: [{ name: 'trace_id' }, { name: 'span_id' }],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(nonLogsSchema), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'logs', 'checkout', '--format', 'json'], { env });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('axiom services detect --explain');
    expect(result.stderr).toContain('--logs-dataset');
  });
});
