import { isValidPath } from 'src/validate-flags';
import { describe, expect, it } from 'vitest';
import z from 'zod';

describe('isValidPath', () => {
  it('should work for a basic path', () => {
    expect(isValidPath(z.object({ foo: z.string() }), ['foo'])).toBe(true);
  });

  it('should work for a nested path', () => {
    expect(isValidPath(z.object({ foo: z.object({ bar: z.number() }) }), ['foo', 'bar'])).toBe(
      true,
    );
  });
});
