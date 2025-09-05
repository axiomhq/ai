import { expectTypeOf, describe, it } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../src/app-scope';

describe('type-level tests for app scope', () => {
  it('basic type', () => {
    const flagSchema = z.object({ foo: z.string() });
    const { flag } = createAppScope({ flagSchema });

    const f = flag('foo', 'foo-value');

    expectTypeOf(f).toEqualTypeOf<string>();
  });

  it('should require flag value if the schema does not have one', () => {
    const flagSchema = z.object({ foo: z.string() });
    const { flag } = createAppScope({ flagSchema });

    // @ts-expect-error this is wrong syntax
    const f = flag('foo');

    expectTypeOf(f).toBeNever();
  });

  it('flags with defaults in schema should work with or without a value', () => {
    const flagSchema = z.object({ foo: z.string().default('foo'), bar: z.string().default('bar') });
    const { flag } = createAppScope({ flagSchema });

    const foo = flag('foo');
    const bar = flag('bar', 'bar-value');

    expectTypeOf(foo).toEqualTypeOf<string>();
    expectTypeOf(bar).toEqualTypeOf<string>();
  });

  it('should work for object types', () => {
    const flagSchema = z.object({ obj: z.object({ foo: z.string() }) });
    const { flag } = createAppScope({ flagSchema });

    const obj = flag('obj', { foo: 'foo-value' });

    expectTypeOf(obj).toEqualTypeOf<{ foo: string }>();
  });
});
