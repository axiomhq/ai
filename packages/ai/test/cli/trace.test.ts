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

  it('trace list applies filters and returns mcp csv', async () => {
    const fetchMock = vi
      .fn()
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

    const result = await runCli(
      [
        'traces',
        'list',
        '--service',
        'checkout',
        '--operation',
        'GET /checkout',
        '--status',
        'error',
        '--format',
        'mcp',
      ],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('# Trace Search');
    expect(result.stdout).toContain('```csv');

    const callBody = JSON.parse(String(fetchMock.mock.calls[2][1].body));
    expect(callBody.apl).toContain("where ['service.name'] == \"checkout\"");
    expect(callBody.apl).toContain("where ['name'] == \"GET /checkout\"");
    expect(callBody.apl).toContain("where ['status.code'] == \"error\"");
  });

  it('trace get builds a tree when parent relationships exist', async () => {
    const fetchMock = vi
      .fn()
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
              {
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

    const result = await runCli(['traces', 'get', 'trace-1', '--format', 'json'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"tree_mode": "tree"');
    expect(result.stdout).toContain('|  100 checkout GET /checkout OK');
    expect(result.stdout).toContain('|    40 payments POST /charge ERR');
  });

  it('trace get falls back to list view when parent links are missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: Array.from({ length: 8 }).map((_, index) => ({
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

    const result = await runCli(['traces', 'get', 'trace-2', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('tree_mode');
    expect(result.stdout).toContain('fallback');
    expect(result.stderr).toBe('');
  });

  it('trace spans returns sorted rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              {
                start: '2026-01-01T00:00:00Z',
                duration_ms: 10,
                service: 'checkout',
                operation: 'a',
                kind: 'server',
                status: 'ok',
                span_id: 'a',
                parent_span_id: null,
              },
              {
                start: '2026-01-01T00:00:00Z',
                duration_ms: 20,
                service: 'checkout',
                operation: 'b',
                kind: 'server',
                status: 'ok',
                span_id: 'b',
                parent_span_id: null,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['traces', 'spans', 'trace-3', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    const firstDuration = result.stdout.indexOf('\"duration_ms\": 20');
    const secondDuration = result.stdout.indexOf('\"duration_ms\": 10');
    expect(firstDuration).toBeLessThan(secondDuration);
  });
});
