import { isValidPath, findSchemaAtPath } from '../../src/util/dot-path';
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

  it('should return false for invalid/non-existent paths', () => {
    expect(isValidPath(z.object({ foo: z.string() }), ['nonexistent'])).toBe(false);
    expect(
      isValidPath(z.object({ foo: z.object({ bar: z.number() }) }), ['foo', 'nonexistent']),
    ).toBe(false);
  });

  it('should work with optional and default wrapped schemas', () => {
    expect(
      isValidPath(z.object({ foo: z.optional(z.object({ bar: z.number() })) }), ['foo', 'bar']),
    ).toBe(true);
    expect(
      isValidPath(z.object({ foo: z.object({ bar: z.number() }).default({ bar: 0 }) }), [
        'foo',
        'bar',
      ]),
    ).toBe(true);
  });

  it('should return false when trying to traverse through non-object types', () => {
    expect(isValidPath(z.object({ foo: z.string() }), ['foo', 'bar'])).toBe(false);
    expect(isValidPath(z.object({ foo: z.number() }), ['foo', 'nested'])).toBe(false);
  });

  it('should handle empty path array', () => {
    expect(isValidPath(z.object({ foo: z.string() }), [])).toBe(true);
  });
});

describe('findSchemaAtPath', () => {
  it('should find schema through optional-wrapped intermediate objects', () => {
    const schema = z.object({
      foo: z.optional(z.object({ bar: z.number() })),
    });
    const result = findSchemaAtPath(schema, ['foo', 'bar']);
    expect(result).toBeDefined();
  });

  it('should find schema through nullable-wrapped intermediate objects', () => {
    const schema = z.object({
      foo: z.nullable(z.object({ bar: z.string() })),
    });
    const result = findSchemaAtPath(schema, ['foo', 'bar']);
    expect(result).toBeDefined();
  });

  it('should find schema through default-wrapped intermediate objects', () => {
    const schema = z.object({
      foo: z.object({ bar: z.boolean() }).default({ bar: true }),
    });
    const result = findSchemaAtPath(schema, ['foo', 'bar']);
    expect(result).toBeDefined();
  });
});
