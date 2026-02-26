import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiomApiClient, clearAxiomApiClientCache } from '../../src/cli/api/client';
import { createExplainContext } from '../../src/cli/explain/context';

describe('cli api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    clearAxiomApiClientCache();
  });

  it('builds requests and captures explain context', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'demo' }]), {
          status: 200,
          headers: { 'x-request-id': 'req-1' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'field', type: 'string' }]), {
          status: 200,
          headers: { 'x-request-id': 'req-1b' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ matches: [] }), {
          status: 200,
          headers: { 'x-request-id': 'req-2' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const explain = createExplainContext();
    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
      explain,
    });

    await client.listDatasets();
    await client.getDatasetFields('team/logs');
    await client.queryApl('dataset/group', 'limit 1', { maxBinAutoGroups: 40 });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.axiom.co/v2/datasets',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'X-Axiom-Org-Id': 'org',
        },
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.axiom.co/v2/datasets/team%2Flogs/fields',
      expect.objectContaining({
        method: 'GET',
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'X-Axiom-Org-Id': 'org',
        },
        body: JSON.stringify({ apl: "['dataset/group'] | limit 1", maxBinAutoGroups: 40 }),
      }),
    );

    expect(explain.requests).toEqual([
      {
        method: 'GET',
        path: '/v2/datasets',
        status: 200,
        requestId: 'req-1',
      },
      {
        method: 'GET',
        path: '/v2/datasets/team%2Flogs/fields',
        status: 200,
        requestId: 'req-1b',
      },
      {
        method: 'POST',
        path: '/v1/datasets/_apl?format=legacy',
        status: 200,
        requestId: 'req-2',
      },
    ]);

    expect(explain.queries).toEqual([
      {
        dataset: 'dataset/group',
        apl: 'limit 1',
        options: { maxBinAutoGroups: 40 },
      },
    ]);
  });

  it('adds query params for monitor history', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ history: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.getMonitorHistory('monitor', {
      start: '2026-01-01T00:00:00Z',
      end: '2026-01-02T00:00:00Z',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v2/monitors/monitor/history?startTime=2026-01-01T00%3A00%3A00Z&endTime=2026-01-02T00%3A00%3A00Z',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uses app internal endpoint for monitor list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.listInternalMonitors();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.axiom.co/api/internal/monitors',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('uses app internal endpoint for batch monitor history', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ history: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.getMonitorsHistoryBatch(['mon_1', 'mon_2']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.axiom.co/api/internal/monitors/history?monitorIds=mon_1%2Cmon_2',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes raw time range to batch monitor history endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ history: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.getMonitorsHistoryBatch(['mon_1'], { start: 'now-1hr', end: 'now' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.axiom.co/api/internal/monitors/history?monitorIds=mon_1&startTime=now-1hr&endTime=now',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('normalizes leading dataset pipe syntax in apl', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.queryApl('vercel', 'vercel | count()', { maxBinAutoGroups: 40 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: "['vercel'] | count()", maxBinAutoGroups: 40 }),
      }),
    );
  });

  it('keeps raw apl unchanged when dataset is not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.queryApl(undefined, "['vercel'] | count()", { maxBinAutoGroups: 40 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: "['vercel'] | count()", maxBinAutoGroups: 40 }),
      }),
    );
  });

  it('normalizes dataset shorthand when dataset is not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.queryApl(undefined, 'vercel | count()', { maxBinAutoGroups: 40 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: "['vercel'] | count()", maxBinAutoGroups: 40 }),
      }),
    );
  });

  it('injects dataset after let statements', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ matches: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.queryApl(
      'traces',
      `let start = datetime(2026-01-01T00:00:00Z);
let end = datetime(2026-01-01T01:00:00Z);
range start to end | count()`,
      { maxBinAutoGroups: 40 },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          apl:
            "let start = datetime(2026-01-01T00:00:00Z);\nlet end = datetime(2026-01-01T01:00:00Z);\n['traces'] | range start to end | count()",
          maxBinAutoGroups: 40,
        }),
      }),
    );
  });

  it('routes dataset queries to edge endpoints when edge routing is enabled', async () => {
    vi.stubEnv('AXIOM_CLI_EDGE_ROUTING', '1');
    vi.stubEnv('AXIOM_CLI_DATASET_REGION_CACHE_TTL_MS', '300000');
    vi.stubEnv('AXIOM_CLI_REGION_ENDPOINT_CACHE_TTL_MS', '300000');

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://app.axiom.co/api/internal/datasets') {
        return new Response(
          JSON.stringify([{ name: 'region-eu-central-1', region: 'cloud.eu-central-1.aws' }]),
          { status: 200 },
        );
      }
      if (url === 'https://app.axiom.co/api/internal/regions') {
        return new Response(
          JSON.stringify({
            axiom: [
              {
                id: 'cloud.eu-central-1.aws',
                instanceName: 'eu-central-1',
                domain: 'https://eu-central-1.aws.edge.axiom.co',
              },
            ],
            byoc: [],
          }),
          { status: 200 },
        );
      }
      if (url === 'https://eu-central-1.aws.edge.axiom.co/api/v1/query') {
        return new Response(JSON.stringify({ matches: [{ ok: true }] }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    const response = await client.queryApl('region-eu-central-1', 'count()', {
      maxBinAutoGroups: 40,
    });

    expect(response.data).toEqual({ matches: [{ ok: true }] });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://eu-central-1.aws.edge.axiom.co/api/v1/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          apl: "['region-eu-central-1'] | count()",
          maxBinAutoGroups: 40,
        }),
      }),
    );
  });

  it('falls back to legacy query endpoint when edge query fails with 404', async () => {
    vi.stubEnv('AXIOM_CLI_EDGE_ROUTING', '1');
    vi.stubEnv('AXIOM_CLI_DATASET_REGION_CACHE_TTL_MS', '300000');
    vi.stubEnv('AXIOM_CLI_REGION_ENDPOINT_CACHE_TTL_MS', '300000');

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://app.axiom.co/api/internal/datasets') {
        return new Response(JSON.stringify([{ name: 'eu', region: 'cloud.eu-central-1.aws' }]), {
          status: 200,
        });
      }
      if (url === 'https://app.axiom.co/api/internal/regions') {
        return new Response(
          JSON.stringify({
            axiom: [{ id: 'cloud.eu-central-1.aws', domain: 'https://eu-central-1.aws.edge.axiom.co' }],
            byoc: [],
          }),
          { status: 200 },
        );
      }
      if (url === 'https://eu-central-1.aws.edge.axiom.co/api/v1/query') {
        return new Response(JSON.stringify({ message: 'not found' }), { status: 404 });
      }
      if (url === 'https://api.axiom.co/v1/datasets/_apl?format=legacy') {
        return new Response(JSON.stringify({ matches: [{ fallback: true }] }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    const response = await client.queryApl('eu', 'count()', { maxBinAutoGroups: 40 });
    expect(response.data).toEqual({ matches: [{ fallback: true }] });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v1/datasets/_apl?format=legacy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apl: "['eu'] | count()", maxBinAutoGroups: 40 }),
      }),
    );
  });

  it('reuses cached dataset regions and region endpoints across queries', async () => {
    vi.stubEnv('AXIOM_CLI_EDGE_ROUTING', '1');
    vi.stubEnv('AXIOM_CLI_DATASET_REGION_CACHE_TTL_MS', '300000');
    vi.stubEnv('AXIOM_CLI_REGION_ENDPOINT_CACHE_TTL_MS', '300000');

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://app.axiom.co/api/internal/datasets') {
        return new Response(JSON.stringify([{ name: 'eu', region: 'cloud.eu-central-1.aws' }]), {
          status: 200,
        });
      }
      if (url === 'https://app.axiom.co/api/internal/regions') {
        return new Response(
          JSON.stringify({
            axiom: [{ id: 'cloud.eu-central-1.aws', domain: 'https://eu-central-1.aws.edge.axiom.co' }],
            byoc: [],
          }),
          { status: 200 },
        );
      }
      if (url === 'https://eu-central-1.aws.edge.axiom.co/api/v1/query') {
        return new Response(JSON.stringify({ matches: [{ ok: true }] }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new AxiomApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.queryApl('eu', 'count()', { maxBinAutoGroups: 40 });
    await client.queryApl('eu', 'count()', { maxBinAutoGroups: 40 });

    const calls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(calls.filter((url) => url === 'https://app.axiom.co/api/internal/datasets')).toHaveLength(1);
    expect(calls.filter((url) => url === 'https://app.axiom.co/api/internal/regions')).toHaveLength(1);
    expect(calls.filter((url) => url === 'https://eu-central-1.aws.edge.axiom.co/api/v1/query')).toHaveLength(2);
  });

  it('persists dataset and region caches on disk across client instances', async () => {
    vi.stubEnv('AXIOM_CLI_EDGE_ROUTING', '1');
    vi.stubEnv('AXIOM_CLI_DATASET_REGION_CACHE_TTL_MS', '300000');
    vi.stubEnv('AXIOM_CLI_REGION_ENDPOINT_CACHE_TTL_MS', '300000');

    const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'axiom-cli-cache-'));
    vi.stubEnv('AXIOM_CLI_CACHE_DIR', cacheDir);

    try {
      const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === 'https://app.axiom.co/api/internal/datasets') {
          return new Response(JSON.stringify([{ name: 'eu', region: 'cloud.eu-central-1.aws' }]), {
            status: 200,
          });
        }
        if (url === 'https://app.axiom.co/api/internal/regions') {
          return new Response(
            JSON.stringify({
              axiom: [{ id: 'cloud.eu-central-1.aws', domain: 'https://eu-central-1.aws.edge.axiom.co' }],
              byoc: [],
            }),
            { status: 200 },
          );
        }
        if (url === 'https://eu-central-1.aws.edge.axiom.co/api/v1/query') {
          return new Response(JSON.stringify({ matches: [{ ok: true }] }), { status: 200 });
        }
        return new Response('not found', { status: 404 });
      });
      vi.stubGlobal('fetch', fetchMock);

      const clientOne = new AxiomApiClient({
        url: 'https://api.axiom.co',
        token: 'token',
        orgId: 'org',
      });
      await clientOne.queryApl('eu', 'count()', { maxBinAutoGroups: 40 });

      clearAxiomApiClientCache();

      const clientTwo = new AxiomApiClient({
        url: 'https://api.axiom.co',
        token: 'token',
        orgId: 'org',
      });
      await clientTwo.queryApl('eu', 'count()', { maxBinAutoGroups: 40 });

      const calls = fetchMock.mock.calls.map(([url]) => String(url));
      expect(calls.filter((url) => url === 'https://app.axiom.co/api/internal/datasets')).toHaveLength(1);
      expect(calls.filter((url) => url === 'https://app.axiom.co/api/internal/regions')).toHaveLength(1);
      expect(calls.filter((url) => url === 'https://eu-central-1.aws.edge.axiom.co/api/v1/query')).toHaveLength(2);
    } finally {
      await fs.rm(cacheDir, { recursive: true, force: true });
    }
  });
});
