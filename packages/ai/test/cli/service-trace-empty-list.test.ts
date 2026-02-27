import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
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

const buildTraceQueryMock = (queryResponse: unknown) =>
  vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([{ name: 'traces' }]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(tracesSchema), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(queryResponse), { status: 200 }));

describe('service list empty summaries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('services list returns empty result sets for synthetic summary rows', async () => {
    const formats = ['table', 'csv', 'json', 'ndjson', 'mcp'] as const;

    for (const format of formats) {
      vi.stubGlobal(
        'fetch',
        buildTraceQueryMock({
          matches: [
            {
              service: null,
              total: 0,
              errored: 0,
              error_rate: 0,
              avg_duration_ns: null,
            },
          ],
        }),
      );

      const result = await runCli(['services', 'list', '--format', format], {
        env,
        stdoutIsTTY: format === 'table',
      });

      expect(result.exitCode).toBe(0);
      if (format === 'json') {
        const parsed = JSON.parse(result.stdout);
        expect(parsed.data).toEqual([]);
        expect(parsed.meta.rows_shown).toBe(0);
      } else if (format === 'ndjson') {
        expect(result.stdout).toBe('');
      } else if (format === 'csv') {
        expect(result.stdout).toBe('service,total,errored,error_rate,avg_duration_ns\n');
      } else if (format === 'table') {
        const lines = result.stdout.trimEnd().split('\n');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('service');
        expect(lines[0]).toContain('total');
      } else {
        expect(result.stdout).toContain('# Services (last 30m)');
        expect(result.stdout).toContain('```csv');
        expect(result.stdout).toContain('service,total,errored,error_rate,avg_duration_ns');
      }

      expect(result.stdout).not.toContain('"service": null');
      expect(result.stdout).not.toContain(',0,0,0');
    }
  });
});
