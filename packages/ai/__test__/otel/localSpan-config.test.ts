import { describe, it, expect } from 'vitest';
import { LocalSpanBuffer, getSpanBuffer } from '../../src/otel/localSpan';

describe('LocalSpanBuffer Configuration', () => {
  it('should use default values when no config is provided', () => {
    const buffer = new LocalSpanBuffer();
    const stats = buffer.getStats();

    expect(stats.maxSpans).toBe(1000);
    expect(stats.flushInterval).toBe(1000);
  });

  it('should use constructor configuration values', () => {
    const buffer = new LocalSpanBuffer({ maxSpans: 500, flushInterval: 2000 });
    const stats = buffer.getStats();

    expect(stats.maxSpans).toBe(500);
    expect(stats.flushInterval).toBe(2000);
  });

  it('should allow partial configuration', () => {
    const buffer1 = new LocalSpanBuffer({ maxSpans: 500 });
    const stats1 = buffer1.getStats();

    expect(stats1.maxSpans).toBe(500);
    expect(stats1.flushInterval).toBe(1000); // default

    const buffer2 = new LocalSpanBuffer({ flushInterval: 2000 });
    const stats2 = buffer2.getStats();

    expect(stats2.maxSpans).toBe(1000); // default
    expect(stats2.flushInterval).toBe(2000);
  });

  it('should work with the global singleton', () => {
    const buffer = getSpanBuffer();
    const stats = buffer.getStats();

    expect(typeof stats.maxSpans).toBe('number');
    expect(typeof stats.flushInterval).toBe('number');
    expect(stats.maxSpans).toBeGreaterThan(0);
    expect(stats.flushInterval).toBeGreaterThan(0);
  });
});
