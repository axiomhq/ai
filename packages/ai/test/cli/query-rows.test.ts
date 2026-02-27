import { describe, expect, it } from 'vitest';
import { toQueryRows } from '../../src/cli/commands/queryRows';

describe('query rows normalization', () => {
  it('unwraps legacy data envelope rows', () => {
    const result = toQueryRows({
      matches: [
        {
          _time: '2026-01-01T00:00:00Z',
          _sysTime: '1970-01-01T00:00:00Z',
          _rowId: 'row-1',
          data: {
            trace_id: 't-1',
            duration_ms: 120,
          },
        },
      ],
    });

    expect(result).toEqual({
      rows: [
        {
          trace_id: 't-1',
          duration_ms: 120,
        },
      ],
      timeseries: [],
      totals: [],
    });
  });

  it('keeps non-metadata outer columns while flattening nested rows', () => {
    const result = toQueryRows({
      matches: [
        {
          source: 'ingest-a',
          data: {
            value: 42,
          },
        },
      ],
    });

    expect(result).toEqual({
      rows: [
        {
          source: 'ingest-a',
          value: 42,
        },
      ],
      timeseries: [],
      totals: [],
    });
  });

  it('preserves both timeseries and totals bucket rows', () => {
    const result = toQueryRows({
      buckets: {
        series: [
          {
            groups: [
              {
                group: { _time: '2026-01-01T00:00:00Z' },
                aggregations: [{ op: 'Count', value: 2 }],
              },
              {
                group: { _time: '2026-01-01T01:00:00Z' },
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
        project: [{ field: 'Count', alias: 'count' }],
      },
    });

    expect(result).toEqual({
      rows: [
        { _time: '2026-01-01T00:00:00Z', count: 2 },
        { _time: '2026-01-01T01:00:00Z', count: 3 },
      ],
      timeseries: [
        { _time: '2026-01-01T00:00:00Z', count: 2 },
        { _time: '2026-01-01T01:00:00Z', count: 3 },
      ],
      totals: [{ count: 5 }],
    });
  });

  it('keeps repeated aggregation ops as distinct columns using projection order', () => {
    const result = toQueryRows({
      buckets: {
        totals: [
          {
            group: {},
            aggregations: [
              { op: 'percentile', value: 120 },
              { op: 'percentile', value: 240 },
            ],
          },
        ],
      },
      request: {
        project: [
          { field: 'p95', alias: 'p95_ms' },
          { field: 'p99', alias: 'p99_ms' },
        ],
      },
    });

    expect(result).toEqual({
      rows: [{ p95_ms: 120, p99_ms: 240 }],
      timeseries: [],
      totals: [{ p95_ms: 120, p99_ms: 240 }],
    });
  });

  it('includes series window timestamps for no-group series fallback rows', () => {
    const result = toQueryRows({
      buckets: {
        series: [
          {
            startTime: '2026-01-01T00:00:00Z',
            endTime: '2026-01-01T01:00:00Z',
            aggregations: [{ op: 'Count', value: 7 }],
          },
        ],
      },
      request: {
        project: [
          { field: '_time', alias: '_time' },
          { field: 'Count', alias: 'count' },
        ],
      },
    });

    expect(result).toEqual({
      rows: [
        {
          _time: '2026-01-01T00:00:00Z',
          _time_end: '2026-01-01T01:00:00Z',
          count: 7,
        },
      ],
      timeseries: [
        {
          _time: '2026-01-01T00:00:00Z',
          _time_end: '2026-01-01T01:00:00Z',
          count: 7,
        },
      ],
      totals: [],
    });
  });

  it('maps bucket aggregations by alias instead of relying on aggregation order', () => {
    const result = toQueryRows({
      buckets: {
        totals: [
          {
            group: { _source: 'traces' },
            aggregations: [
              { op: 'total', value: 10 },
              { op: 'errored', value: 2 },
              { op: 'avg_duration_ns', value: 1000 },
              { op: 'error_rate', value: 0.2 },
            ],
          },
        ],
      },
      request: {
        aggregations: [
          { op: 'count', alias: 'total' },
          { op: 'count', alias: 'errored' },
          { op: 'computed', alias: 'error_rate' },
          { op: 'avg', alias: 'avg_duration_ns' },
        ],
        project: [
          { field: '_source', alias: '_source' },
          { field: 'total', alias: 'total' },
          { field: 'errored', alias: 'errored' },
          { field: 'error_rate', alias: 'error_rate' },
          { field: 'avg_duration_ns', alias: 'avg_duration_ns' },
        ],
      },
    });

    expect(result).toEqual({
      rows: [
        {
          _source: 'traces',
          total: 10,
          errored: 2,
          error_rate: 0.2,
          avg_duration_ns: 1000,
        },
      ],
      timeseries: [],
      totals: [
        {
          _source: 'traces',
          total: 10,
          errored: 2,
          error_rate: 0.2,
          avg_duration_ns: 1000,
        },
      ],
    });
  });
});
