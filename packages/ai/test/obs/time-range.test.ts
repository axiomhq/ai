import { describe, expect, it } from 'vitest';
import { resolveTimeRange } from '../../src/obs/time/range';

describe('resolveTimeRange', () => {
  const now = new Date('2026-01-01T00:30:00.000Z');

  it('defaults to since/until durations', () => {
    const range = resolveTimeRange({}, now);
    expect(range).toEqual({
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-01T00:30:00.000Z',
    });
  });

  it('resolves start without end to now', () => {
    const range = resolveTimeRange({ start: '2026-01-01T00:10:00Z' }, now);
    expect(range).toEqual({
      start: '2026-01-01T00:10:00.000Z',
      end: '2026-01-01T00:30:00.000Z',
    });
  });

  it('resolves end without start to default since window', () => {
    const range = resolveTimeRange({ end: '2026-01-01T00:20:00Z' }, now);
    expect(range).toEqual({
      start: '2025-12-31T23:50:00.000Z',
      end: '2026-01-01T00:20:00.000Z',
    });
  });

  it('throws for incompatible flags', () => {
    expect(() => resolveTimeRange({ start: '2026-01-01T00:00:00Z', since: '15m' }, now)).toThrow(
      'Cannot use --start with --since',
    );
    expect(() => resolveTimeRange({ end: '2026-01-01T00:00:00Z', until: '5m' }, now)).toThrow(
      'Cannot use --end with --until',
    );
  });
});
