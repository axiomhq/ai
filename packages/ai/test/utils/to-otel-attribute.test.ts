import { describe, it, expect } from 'vitest';
import { toOtelAttribute } from '../../src/util/to-otel-attribute.js';

describe('toOtelAttribute', () => {
  it('handles string', () => {
    expect(toOtelAttribute('hello')).toBe('hello');
  });

  it('handles number', () => {
    expect(toOtelAttribute(42)).toBe(42);
    expect(toOtelAttribute(NaN)).toBe('NaN');
    expect(toOtelAttribute(Infinity)).toBe('Infinity');
    expect(toOtelAttribute(-Infinity)).toBe('-Infinity');
  });

  it('handles boolean', () => {
    expect(toOtelAttribute(true)).toBe(true);
    expect(toOtelAttribute(false)).toBe(false);
  });

  it('handles bigint', () => {
    expect(toOtelAttribute(123n)).toBe(123);
  });

  it('handles undefined/null/function/symbol', () => {
    expect(toOtelAttribute(undefined)).toBeUndefined();
    expect(toOtelAttribute(null)).toBeUndefined();
    expect(toOtelAttribute(() => {})).toBeUndefined();
    expect(toOtelAttribute(Symbol('test'))).toBeUndefined();
  });

  // Date
  it('handles date', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    expect(toOtelAttribute(date)).toBe('2023-01-01T00:00:00.000Z');
  });

  // Object
  it('handles object', () => {
    expect(toOtelAttribute({ key: 'value' })).toBe('{"key":"value"}');
  });

  // Nested object
  it('handles nested object', () => {
    const obj = { a: 1, b: { c: 'nested' } };
    expect(toOtelAttribute(obj)).toBe('{"a":1,"b":{"c":"nested"}}');
  });

  // Array of primitives
  it('handles array of primitives', () => {
    expect(toOtelAttribute([1, 'two', true])).toEqual([1, 'two', true]);
    expect(toOtelAttribute([undefined, null, NaN])).toBeUndefined(); // all filtered out
  });

  // Array of objects
  it('handles array of objects', () => {
    const arr = [{ a: 1 }, new Date('2023-01-01')];
    expect(toOtelAttribute(arr)).toEqual(['{"a":1}', '2023-01-01T00:00:00.000Z']);
  });
});
