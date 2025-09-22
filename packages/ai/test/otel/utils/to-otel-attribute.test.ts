import { toOtelAttribute } from 'src/otel/utils/to-otel-attribute';
import { describe, it, expect } from 'vitest';

describe('toOtelAttribute', () => {
  it('handles string', () => {
    expect(toOtelAttribute('hello')).toBe('hello');
  });

  it('handles number', () => {
    expect(toOtelAttribute(42)).toBe(42);
    expect(toOtelAttribute(NaN)).toBeUndefined();
    expect(toOtelAttribute(Infinity)).toBeUndefined();
    expect(toOtelAttribute(-Infinity)).toBeUndefined();
  });

  it('handles boolean', () => {
    expect(toOtelAttribute(true)).toBe(true);
    expect(toOtelAttribute(false)).toBe(false);
  });

  it('handles bigint', () => {
    expect(toOtelAttribute(123n)).toBe(123);
    expect(toOtelAttribute(9007199254740993n)).toBe('9007199254740993'); // unsafe integer → string
  });

  it('handles undefined/null/function/symbol', () => {
    expect(toOtelAttribute(undefined)).toBeUndefined();
    expect(toOtelAttribute(null)).toBeUndefined();
    expect(toOtelAttribute(() => {})).toBeUndefined();
    expect(toOtelAttribute(Symbol('test'))).toBeUndefined();
  });

  it('handles date', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    expect(toOtelAttribute(date)).toBe('2023-01-01T00:00:00.000Z');
  });

  it('handles object', () => {
    expect(toOtelAttribute({ key: 'value' })).toBe('{"key":"value"}');
  });

  it('handles nested object', () => {
    const obj = { a: 1, b: { c: 'nested' } };
    expect(toOtelAttribute(obj)).toBe('{"a":1,"b":{"c":"nested"}}');
  });

  it('handles array of primitives', () => {
    expect(toOtelAttribute([1, 2, 3])).toEqual([1, 2, 3]); // homogeneous numbers
    expect(toOtelAttribute(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']); // homogeneous strings
    expect(toOtelAttribute([true, false])).toEqual([true, false]); // homogeneous booleans
    expect(toOtelAttribute([1, 'two', true])).toEqual(['1', 'two', 'true']); // mixed → coerce all to strings
    expect(toOtelAttribute([undefined, null, NaN])).toBeUndefined(); // all filtered out
    expect(toOtelAttribute([])).toBeUndefined(); // empty array
  });

  it('handles array of objects', () => {
    const arr = [{ a: 1 }, new Date('2023-01-01')];
    expect(toOtelAttribute(arr)).toEqual(['{"a":1}', '2023-01-01T00:00:00.000Z']); // both convert to strings
  });
});
