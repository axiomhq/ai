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

describe('service/trace list empty summaries', () => {
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
              last_seen: null,
              spans: 0,
              error_spans: 0,
              error_rate: 0,
              p95_ms: null,
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
        expect(result.stdout).toBe('service,last_seen,spans\n');
      } else if (format === 'table') {
        const lines = result.stdout.trimEnd().split('\n');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('service');
        expect(lines[0]).toContain('last_seen');
        expect(lines[0]).toContain('spans');
      } else {
        expect(result.stdout).toContain('# Services (last 30m)');
        expect(result.stdout).toContain('```csv');
        expect(result.stdout).toContain('service,last_seen,spans');
      }

      expect(result.stdout).not.toContain('"service": null');
      expect(result.stdout).not.toContain(',0,0,0');
    }
  });

  it('traces list returns empty result sets for synthetic summary rows', async () => {
    const formats = ['table', 'csv', 'json', 'ndjson', 'mcp'] as const;

    for (const format of formats) {
      vi.stubGlobal(
        'fetch',
        buildTraceQueryMock({
          matches: [
            {
              trace_id: null,
              root_operation: null,
              started_at: null,
              duration_ms: 0,
              span_count: 0,
              error: 0,
            },
          ],
        }),
      );

      const result = await runCli(
        [
          'traces',
          'list',
          '--service',
          'unknown_service',
          '--status',
          'error',
          '--format',
          format,
        ],
        { env, stdoutIsTTY: format === 'table' },
      );

      expect(result.exitCode).toBe(0);
      if (format === 'json') {
        const parsed = JSON.parse(result.stdout);
        expect(parsed.data).toEqual([]);
        expect(parsed.meta.rows_shown).toBe(0);
      } else if (format === 'ndjson') {
        expect(result.stdout).toBe('');
      } else if (format === 'csv') {
        expect(result.stdout).toBe('trace_id,root_operation,started_at,duration_ms,span_count,error\n');
      } else if (format === 'table') {
        const lines = result.stdout.trimEnd().split('\n');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('trace_id');
        expect(lines[0]).toContain('root_operation');
        expect(lines[0]).toContain('span_count');
      } else {
        expect(result.stdout).toContain('# Trace Search');
        expect(result.stdout).toContain('```csv');
        expect(result.stdout).toContain('trace_id,root_operation,started_at,duration_ms,span_count,error');
      }

      expect(result.stdout).not.toContain('"trace_id": null');
      expect(result.stdout).not.toContain(',0,0,0');
    }
  });
});
