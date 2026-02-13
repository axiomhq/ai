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

describe('query run', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses --apl input and default maxBinAutoGroups', async () => {
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

    const result = await runCli(
      ['query', 'run', 'traces', '--apl', 'group by service | count()', '--format', 'csv'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('service,count');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v2/datasets/traces/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: 'group by service | count()', maxBinAutoGroups: 40 }),
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

    const result = await runCli(['query', 'run', 'events', '--file', file, '--format', 'json'], {
      env,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"dataset": "events"');
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
      ['query', 'run', 'events', '--apl', 'limit 1', '--file', file, '--format', 'json'],
      {
        env,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v2/datasets/events/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: 'limit 1', maxBinAutoGroups: 40 }),
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

    const result = await runCli(['query', 'run', 'events', '--stdin', '--format', 'mcp'], {
      env,
    });

    Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('```apl');
    expect(result.stdout).toContain('```csv');
    expect(result.stdout).toContain('limit 1');
  });
});
