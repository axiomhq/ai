import { afterEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

const bucketResponse = {
  matches: [],
  buckets: {
    series: [
      {
        groups: [
          {
            group: { _time: '2026-02-24T18:00:00Z' },
            aggregations: [{ op: 'Count', value: 2 }],
          },
          {
            group: { _time: '2026-02-24T19:00:00Z' },
            aggregations: [{ op: 'Count', value: 3 }],
          },
        ],
      },
    ],
    totals: [
      {
        group: {},
        aggregations: [{ op: 'Count', value: 5 }],
      },
    ],
  },
  request: {
    project: [{ field: 'Count', alias: 'Count' }],
  },
};

describe('query', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses positional APL input and default maxBinAutoGroups', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [
            { service: 'checkout', count: 12 },
            { service: 'api', count: 4 },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', "['traces'] | group by service | count()", '--format', 'csv'], {
      env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('service,count');
    expect(result.stderr).toBe('');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          apl: "['traces'] | group by service | count()",
          maxBinAutoGroups: 40,
        }),
      }),
    );
  });

  it('uses --file when apl is not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [{ ok: true }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const dir = await mkdtemp(join(tmpdir(), 'axiom-query-run-'));
    const file = join(dir, 'query.apl');
    await writeFile(file, 'limit 1\n', 'utf8');

    const result = await runCli(['query', '--file', file, '--format', 'json'], {
      env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"apl": "limit 1"');
  });

  it('prefers --apl over --file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [{ ok: true }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const dir = await mkdtemp(join(tmpdir(), 'axiom-query-run-priority-'));
    const file = join(dir, 'query.apl');
    await writeFile(file, 'limit 999\n', 'utf8');

    await runCli(
      ['query', '--apl', "['events'] | limit 1", '--file', file, '--format', 'json'],
      {
        env,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: "['events'] | limit 1", maxBinAutoGroups: 40 }),
      }),
    );
  });

  it('uses --stdin input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [{ value: 1 }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const originalStdin = process.stdin;
    const stdin = Readable.from(['limit 1\n']) as NodeJS.ReadStream;
    Object.defineProperty(stdin, 'isTTY', { value: false, configurable: true });
    Object.defineProperty(process, 'stdin', { value: stdin, configurable: true });

    const result = await runCli(['query', '--stdin', '--format', 'mcp'], {
      env,
    });

    Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('```apl');
    expect(result.stdout).toContain('```csv');
    expect(result.stdout).toContain('limit 1');
  });

  it('prints a concise error when no APL source is provided', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', '--format', 'json'], { env });

    expect(result.exitCode).toBe(1);
    expect(result.stderr.trim()).toBe('Missing APL input. Provide a query string, --file, or --stdin.');
    expect(result.stderr).not.toContain('at resolveApl');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('prints a concise error when --stdin is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const originalStdin = process.stdin;
    const stdin = Readable.from(['   \n']) as NodeJS.ReadStream;
    Object.defineProperty(stdin, 'isTTY', { value: false, configurable: true });
    Object.defineProperty(process, 'stdin', { value: stdin, configurable: true });

    const result = await runCli(['query', '--stdin', '--format', 'json'], { env });

    Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });

    expect(result.exitCode).toBe(1);
    expect(result.stderr.trim()).toBe('No APL provided on stdin');
    expect(result.stderr).not.toContain('at resolveApl');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects removed `query run` syntax with a migration hint', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['query', 'run', 'events', '--apl', 'limit 1', '--format', 'json'],
      { env },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr.trim()).toBe('`axiom query run` was removed. Use `axiom query \"<APL>\"`.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders rows from legacy bucket aggregates', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [],
          buckets: {
            totals: [
              {
                group: {},
                aggregations: [{ op: 'Count', value: 42 }],
              },
            ],
          },
          request: {
            project: [{ field: 'Count', alias: 'Count' }],
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', "['events'] | count", '--format', 'csv'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Count');
    expect(result.stdout).toContain('42');
  });

  it('normalizes --format jsonl to ndjson output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [{ ok: true }] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', 'limit 1', '--format', 'jsonl'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('{"ok":true}');
    expect(result.stderr).toBe('');
  });

  it('renders separate timeseries and totals sections for table output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bucketResponse), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['query', "vercel | summarize count() by bin_auto(_time)", '--format', 'table'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Timeseries');
    expect(result.stdout).toContain('Totals');
    expect(result.stdout).toContain('_time');
    expect(result.stdout).toContain('Count');
    expect(result.stderr).toBe('');
  });

  it('defaults query auto format to table on tty', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bucketResponse), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', "vercel | summarize count() by bin_auto(_time)"], {
      env,
      stdoutIsTTY: true,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Timeseries');
    expect(result.stdout).toContain('Totals');
  });

  it('renders both timeseries and totals in json output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bucketResponse), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['query', "vercel | summarize count() by bin_auto(_time)", '--format', 'json'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      data: {
        rows: Array<Record<string, unknown>>;
        timeseries: Array<Record<string, unknown>>;
        totals: Array<Record<string, unknown>>;
      };
    };
    expect(payload.data.timeseries).toHaveLength(2);
    expect(payload.data.totals).toEqual([{ Count: 5 }]);
    expect(payload.data.rows).toEqual(payload.data.timeseries);
  });

  it('renders both timeseries and totals in jsonl output without extra text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bucketResponse), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['query', "vercel | summarize count() by bin_auto(_time)", '--format', 'jsonl'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const lines = result.stdout.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(3);
    const parsed = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(parsed[0]).toHaveProperty('section', 'timeseries');
    expect(parsed[1]).toHaveProperty('section', 'timeseries');
    expect(parsed[2]).toHaveProperty('section', 'totals');
  });

  it('renders csv from timeseries rows when both timeseries and totals exist', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(bucketResponse), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['query', "vercel | summarize count() by bin_auto(_time)", '--format', 'csv'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('_time,Count');
    expect(result.stdout).toContain('2026-02-24T18:00:00Z,2');
    expect(result.stdout).toContain('2026-02-24T19:00:00Z,3');
    expect(result.stdout).not.toContain('\n5\n');
  });

  it('never prints truncation messages for csv output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [
            { service: 'checkout', count: 12 },
            { service: 'api', count: 4 },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', "['traces'] | group by service | count()", '--format', 'csv'], {
      env: { ...env, AXIOM_MAX_CELLS: '1' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('service,count');
    expect(result.stdout).toContain('checkout,12');
    expect(result.stderr).toBe('');
  });

  it('prints a width-truncation note for table output', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [{ message: 'x'.repeat(200) }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', "['traces'] | limit 1", '--format', 'table'], {
      env: { ...env, COLUMNS: '20' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('message');
    expect(result.stderr).toContain('--format [csv,json,jsonl] for complete values');
    expect(result.stderr).toContain('use APL project to select only the fields you need');
  });
});
