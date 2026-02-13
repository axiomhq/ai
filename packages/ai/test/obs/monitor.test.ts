import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

describe('monitor commands', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists monitors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 'mon_1',
            name: 'High errors',
            dataset: 'traces',
            enabled: true,
            schedule: '*/5 * * * *',
            last_run_at: '2026-01-01T00:00:00Z',
            last_state: 'ok',
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitor', 'list', '--format', 'table'], { env, stdoutIsTTY: true });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('mon_1');
    expect(result.stdout).toContain('High errors');
  });

  it('gets monitor by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'mon_1',
          name: 'High errors',
          dataset: 'traces',
          enabled: true,
          schedule: '*/5 * * * *',
          last_run_at: '2026-01-01T00:00:00Z',
          last_state: 'ok',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitor', 'get', 'mon_1', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"id": "mon_1"');
    expect(result.stdout).toContain('"last_state": "ok"');
  });

  it('shows monitor history with truncated message', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          history: [
            {
              started_at: '2026-01-02T23:58:00Z',
              duration_ms: 125,
              state: 'alert',
              triggered: true,
              message:
                'this monitor fired with a very long message that should be truncated in table mode to keep output readable in a terminal view for operators',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitor', 'history', 'mon_1', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    vi.useRealTimers();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('alert');
    expect(result.stdout).toContain('...');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v2/monitors/mon_1/history?start='),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
