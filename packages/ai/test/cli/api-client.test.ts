import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiomApiClient } from '../../src/cli/api/client';
import { createExplainContext } from '../../src/cli/explain/context';

describe('cli api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
});
