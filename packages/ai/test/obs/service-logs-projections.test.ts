import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

const minimalLogsSchema = {
  fields: [{ name: 'service.name' }, { name: 'trace_id' }],
};

describe('service logs projections', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('omits null pseudo-fields when optional logs fields are missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(minimalLogsSchema), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            matches: [{ _time: '2026-01-01T00:00:00Z', trace_id: 't1' }],
          }),
          { status: 200 },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['services', 'logs', 'checkout', '--logs-dataset', 'logs', '--format', 'json'],
      { env },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"trace_id": "t1"');
    expect(result.stdout).not.toContain('"severity"');
    expect(result.stdout).not.toContain('"message"');

    const callBody = JSON.parse(String(fetchMock.mock.calls[1][1].body)) as { apl: string };
    expect(callBody.apl).toContain("| project _time, trace_id=['trace_id']");
    expect(callBody.apl).not.toContain('severity=null');
    expect(callBody.apl).not.toContain('message=null');
    expect(callBody.apl).not.toContain('trace_id=null');
  });
});
