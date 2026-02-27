import { describe, expect, it } from 'vitest';
import { resolveTimeRange } from '../../src/cli/time/range';

describe('resolveTimeRange', () => {
  it('defaults to since/until durations', () => {
    const range = resolveTimeRange({});
    expect(range).toEqual({
      start: 'now-30m',
      end: 'now',
    });
  });

  it('uses since/until values verbatim', () => {
    const range = resolveTimeRange({ since: 'now-1hr', until: 'now' });
    expect(range).toEqual({
      start: 'now-1hr',
      end: 'now',
    });
  });

  it('supports start/end aliases', () => {
    const range = resolveTimeRange({ start: '2026-01-01T00:10:00Z', end: '2026-01-01T00:20:00Z' });
    expect(range).toEqual({
      start: '2026-01-01T00:10:00Z',
      end: '2026-01-01T00:20:00Z',
    });
  });

  it('prefers since/until when aliases are also set', () => {
    const range = resolveTimeRange({
      since: '1h',
      until: '0m',
      start: '2026-01-01T00:10:00Z',
      end: '2026-01-01T00:20:00Z',
    });
    expect(range).toEqual({
      start: '1h',
      end: '0m',
    });
  });
});
