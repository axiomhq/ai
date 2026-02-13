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
                last_seen: '2026-01-01T00:00:00Z',
                spans: 100,
                error_spans: 2,
                error_rate: 0.02,
                p95_ms: 90,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['service', 'list', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('checkout');

    const callBody = JSON.parse(String(fetchMock.mock.calls[2][1].body));
    expect(callBody.apl).toContain('by service=service.name');
    expect(callBody.apl).toContain('percentile(duration_ms, 95)');
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

    const result = await runCli(['service', 'operations', 'checkout', '--format', 'mcp'], { env });
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
              { spans: 120, last_seen: '2026-01-01T00:00:00Z', error_spans: 3, error_rate: 0.025, p50_ms: 20, p95_ms: 110 },
            ],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [
              { operation: 'GET /cart', spans: 40, error_rate: 0.03, p95_ms: 98 },
              { operation: 'POST /checkout', spans: 30, error_rate: 0.05, p95_ms: 150 },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['service', 'get', 'checkout', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"summary"');
    expect(result.stdout).toContain('"operations"');
    expect(result.stdout).toContain('"service": "checkout"');
  });
});
