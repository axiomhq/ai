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

    const result = await runCli(['monitors', 'list', '--format', 'table'], { env, stdoutIsTTY: true });
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

    const result = await runCli(['monitors', 'get', 'mon_1', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"id": "mon_1"');
    expect(result.stdout).toContain('"last_state": "ok"');
  });

  it('shows monitor history with API-shaped fields', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          history: [
            {
              checkId: 'mon_1',
              name: 'Triggered: Very long API monitor history event message from API',
              state: 'open',
              timestamp: '2026-01-02T23:58:00Z',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'history', 'mon_1', '--format', 'table'], {
      env,
      stdoutIsTTY: true,
    });

    vi.useRealTimers();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('checkId');
    expect(result.stdout).toContain('timestamp');
    expect(result.stdout).toContain('Triggered: Very long API');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v2/monitors/mon_1/history?startTime='),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('normalizes event-style monitor history payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            checkId: 'mon_1',
            name: 'Triggered: API endpoint performance monitor',
            state: 'open',
            timestamp: '2026-01-23T07:04:06.143Z',
          },
          {
            checkId: 'mon_1',
            name: 'Resolved: API endpoint performance monitor',
            state: 'closed',
            timestamp: '2026-01-23T08:04:05.619Z',
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'history', 'mon_1', '--format', 'json'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"timestamp": "2026-01-23T07:04:06.143Z"');
    expect(result.stdout).toContain('"checkId": "mon_1"');
    expect(result.stdout).toContain('"state": "closed"');
  });

  it('shows a clean validation error when monitor history returns 422', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'endTime must be after startTime',
        }),
        { status: 422 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'history', 'mon_1', '--format', 'json'], { env });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Monitor history request validation failed');
    expect(result.stderr).toContain('endTime must be after startTime');
    expect(result.stderr).not.toContain('ObsApiError');
  });
});
