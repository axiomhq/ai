import { afterEach, describe, expect, it, vi } from 'vitest';
import { ObsApiClient } from '../../src/obs/api/client';
import { createExplainContext } from '../../src/obs/explain/context';

describe('obs api client', () => {
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
        new Response(JSON.stringify({ matches: [] }), {
          status: 200,
          headers: { 'x-request-id': 'req-2' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const explain = createExplainContext();
    const client = new ObsApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
      explain,
    });

    await client.listDatasets();
    await client.queryApl('dataset', 'limit 1', { maxBinAutoGroups: 40 });

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
      'https://api.axiom.co/v2/datasets/dataset/query',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'X-Axiom-Org-Id': 'org',
        },
        body: JSON.stringify({ apl: 'limit 1', maxBinAutoGroups: 40 }),
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
        method: 'POST',
        path: '/v2/datasets/dataset/query',
        status: 200,
        requestId: 'req-2',
      },
    ]);

    expect(explain.queries).toEqual([
      {
        dataset: 'dataset',
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

    const client = new ObsApiClient({
      url: 'https://api.axiom.co',
      token: 'token',
      orgId: 'org',
    });

    await client.getMonitorHistory('monitor', {
      start: '2026-01-01T00:00:00Z',
      end: '2026-01-02T00:00:00Z',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.axiom.co/v2/monitors/monitor/history?start=2026-01-01T00%3A00%3A00Z&end=2026-01-02T00%3A00%3A00Z',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
