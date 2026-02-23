import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearObsSchemaCache,
  resolveLogsDataset,
  resolveTraceDataset,
} from '../../src/obs/commands/servicesCommon';

const baseParams = {
  url: 'https://api.axiom.co',
  orgId: 'org',
  token: 'token',
  explain: undefined,
};

const tracesSchema = {
  fields: [
    { name: 'trace_id' },
    { name: 'span_id' },
    { name: 'service.name' },
    { name: 'name' },
    { name: 'status.code' },
    { name: 'duration_ms' },
  ],
};

const logsSchema = {
  fields: [
    { name: 'service.name' },
    { name: 'trace_id' },
    { name: 'severity_text' },
    { name: 'message' },
  ],
};

describe('obs dataset schema cache', () => {
  const originalCacheTtl = process.env.AXIOM_OBS_SCHEMA_CACHE_TTL_MS;

  beforeEach(() => {
    process.env.AXIOM_OBS_SCHEMA_CACHE_TTL_MS = '60000';
    clearObsSchemaCache();
  });

  afterEach(() => {
    clearObsSchemaCache();
    vi.unstubAllGlobals();

    if (originalCacheTtl === undefined) {
      delete process.env.AXIOM_OBS_SCHEMA_CACHE_TTL_MS;
      return;
    }

    process.env.AXIOM_OBS_SCHEMA_CACHE_TTL_MS = originalCacheTtl;
  });

  it('reuses schema scan across repeated trace resolution', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const first = await resolveTraceDataset({
      ...baseParams,
      requiredFields: ['traceIdField', 'spanIdField', 'serviceField'],
    });
    const second = await resolveTraceDataset({
      ...baseParams,
      requiredFields: ['traceIdField', 'spanIdField', 'serviceField'],
    });

    expect(first.dataset).toBe('traces');
    expect(second.dataset).toBe('traces');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reuses trace schema scan for subsequent logs resolution', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'traces' }, { name: 'logs' }]), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(logsSchema), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const trace = await resolveTraceDataset({
      ...baseParams,
      requiredFields: ['traceIdField', 'spanIdField', 'serviceField'],
    });
    const logs = await resolveLogsDataset(baseParams);

    expect(trace.dataset).toBe('traces');
    expect(logs.dataset).toBe('logs');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
