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
    const fetchMock = vi
      .fn()
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
          { status: 200 },
        ),
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
                [42],
                [''],
                ['2025-12-31T23:55:00Z'],
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
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'list', '--format', 'table'], { env, stdoutIsTTY: true });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('High errors');
    expect(result.stdout).toContain('id');
    expect(result.stdout).toContain('status');
    expect(result.stdout).toContain('recent_run');
    expect(result.stdout).toContain('type');
    expect(result.stdout).toContain('dataset');
    expect(result.stdout).toContain('frequency');
    expect(result.stdout).toContain('threshold');
    expect(result.stdout).toContain('traces');
    expect(result.stdout).toContain('*/5 * * * *');
    expect(result.stdout).toContain('mon_1');
    expect(result.stdout).toContain('closed');
    expect(result.stdout).toContain('2026-01-01T00:0');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://app.axiom.co/api/internal/monitors',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://app.axiom.co/api/internal/monitors/history?monitorIds=mon_1',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('uses datasets[] and frequencyMinutes from internal monitor objects', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'mon_internal_1',
              name: 'API endpoint performance monitor',
              type: 'AnomalyDetection',
              datasets: ['otel-demo-traces'],
              frequencyMinutes: 60,
              notifiers: ['bocraCgyrZT4YvavZh'],
            },
          ]),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              mon_internal_1: [
                ['2026-01-01T00:00:00Z'],
                ['run_1'],
                [false],
                [''],
                ['closed'],
                [1],
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
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'list', '--format', 'ndjson'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"id":"mon_internal_1"');
    expect(result.stdout).toContain('"name":"API endpoint performance monitor"');
    expect(result.stdout).toContain('"dataset":"otel-demo-traces"');
    expect(result.stdout).toContain('"frequency":"60m"');
    expect(result.stdout).toContain('"status":"closed"');
  });

  it('gets monitor by id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'mon_1',
            name: 'High errors',
            enabled: true,
          }),
          { status: 200 },
        ),
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
                ['triggered'],
                [42],
                [''],
                ['2025-12-31T23:55:00Z'],
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
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'get', 'mon_1', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"id": "mon_1"');
    expect(result.stdout).toContain('"last_state": "triggered"');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://app.axiom.co/api/internal/monitors/history?monitorIds=mon_1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('shows a friendly not found message for missing monitors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'monitor not found',
        }),
        { status: 404 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'get', 'mon_missing', '--format', 'json'], { env });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Monitor 'mon_missing' was not found.");
    expect(result.stderr).not.toContain('Request failed:');
  });

  it('shows monitor history from internal history endpoint', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            mon_1: [
              ['2026-01-02T23:58:00Z'],
              ['run_1'],
              [false],
              ['/oteldemo.CartService/AddItem'],
              ['open'],
              [1528712.0218579236],
              [''],
              ['2026-01-02T23:00:00Z'],
              ['2026-01-02T23:58:00Z'],
              ['2026-01-02T23:58:01Z'],
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
    );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['monitors', 'history', 'mon_1', '--format', 'json'], {
      env,
      stdoutIsTTY: true,
    });

    vi.useRealTimers();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"run_time": "2026-01-02T23:58:01Z"');
    expect(result.stdout).toContain('"alert_state": "open"');
    expect(result.stdout).toContain('"/oteldemo.CartService/AddItem"');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.axiom.co/api/internal/monitors/history?monitorIds=mon_1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('falls back to v2 monitor history payloads when internal history fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: 'internal endpoint unavailable',
          }),
          { status: 500 },
        ),
      )
      .mockResolvedValueOnce(
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
    expect(result.stderr).not.toContain('AxiomApiError');
  });
});
