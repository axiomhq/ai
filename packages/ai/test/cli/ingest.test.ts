import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

describe('ingest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ingests a file through the API dataset endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ingested: 3,
          failed: 0,
          failures: [],
          processedBytes: 123,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const dir = await mkdtemp(join(tmpdir(), 'axiom-ingest-'));
    const file = join(dir, 'events.ndjson');
    await writeFile(file, '{"message":"ok"}\n', 'utf8');

    const result = await runCli(
      ['ingest', 'logs', '--file', file, '--content-type', 'ndjson', '--format', 'json'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      data: Array<Record<string, unknown>>;
    };
    expect(payload.data).toEqual([
      {
        source: file,
        content_type: 'ndjson',
        ingested: 3,
        failed: 0,
        failures: 0,
        processed_bytes: 123,
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/logs/ingest',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'ndjson',
          'X-Axiom-Org-Id': 'org',
        },
      }),
    );
  });

  it('supports edge overrides with api token without auth profile credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ingested: 1,
          failed: 0,
          failures: [],
          processedBytes: 24,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const dir = await mkdtemp(join(tmpdir(), 'axiom-ingest-edge-'));
    const file = join(dir, 'events.ndjson');
    await writeFile(file, '{"message":"ok"}\n', 'utf8');

    const result = await runCli(
      [
        'ingest',
        'logs',
        '--file',
        file,
        '--content-type',
        'ndjson',
        '--edge-url',
        'https://us-east-1.aws.edge.axiom.co',
        '--api-token',
        'edge-token',
        '--format',
        'json',
      ],
      { env: {} },
    );

    expect(result.exitCode).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://us-east-1.aws.edge.axiom.co/v1/ingest/logs',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer edge-token',
          'Content-Type': 'ndjson',
        },
      }),
    );
  });
});
