import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

describe('service detect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('picks deterministic trace winner with tie warning', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            { name: 'zeta_traces' },
            { name: 'alpha_traces' },
            { name: 'logs' },
          ]),
          { status: 200 },
        ),
      )
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
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: [
              { name: 'service.name' },
              { name: 'trace_id' },
              { name: 'severity_text' },
              { name: 'message' },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'detect', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('traces');
    expect(result.stdout).toContain('alpha_traces');
    expect(result.stderr).toContain('warning: multiple trace datasets detected: alpha_traces, zeta_traces. using alpha_traces. set --dataset to override.');
  });

  it('renders json schema shape', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'app' }]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ fields: [{ name: '_time' }, { name: 'message' }] }), {
          status: 200,
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'detect', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"traces"');
    expect(result.stdout).toContain('"dataset": null');
    expect(result.stdout).toContain('"logs"');
  });

  it('renders mcp output with csv block', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: [
              { name: 'trace_id' },
              { name: 'span_id' },
              { name: 'service.name' },
              { name: 'name' },
            ],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['services', 'detect', '--format', 'mcp'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('# Service Dataset Detection');
    expect(result.stdout).toContain('```csv');
  });
});
