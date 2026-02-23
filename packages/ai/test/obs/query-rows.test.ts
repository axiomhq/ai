import { describe, expect, it } from 'vitest';
import { toQueryRows } from '../../src/obs/commands/queryRows';

describe('query rows normalization', () => {
  it('unwraps legacy data envelope rows', () => {
    const rows = toQueryRows({
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

    expect(rows).toEqual([
      {
        trace_id: 't-1',
        duration_ms: 120,
      },
    ]);
  });

  it('keeps non-metadata outer columns while flattening nested rows', () => {
    const rows = toQueryRows({
      matches: [
        {
          source: 'ingest-a',
          data: {
            value: 42,
          },
        },
      ],
    });

    expect(rows).toEqual([
      {
        source: 'ingest-a',
        value: 42,
      },
    ]);
  });
});
