import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import z3 from 'zod/v3';
import {
  parsePath,
  dotNotationToNested,
  flattenObject,
  isValidPath,
  getValueAtPath,
  findSchemaAtPath,
  buildSchemaForPath,
} from '../../src/util/dot-path';
import {
  isZodV4Schema,
  assertZodV4,
  getKind,
  unwrapTransparent,
} from '../../src/util/zod-internals';

describe('isZodV4Schema', () => {
  it('returns true for Zod v4 object schema', () => {
    const schema = z.object({ foo: z.string() });
    expect(isZodV4Schema(schema)).toBe(true);
  });

  it('returns true for Zod v4 string schema', () => {
    const schema = z.string();
    expect(isZodV4Schema(schema)).toBe(true);
  });

  it('returns false for Zod v3 object schema', () => {
    const schema = z3.object({ foo: z3.string() });
    expect(isZodV4Schema(schema)).toBe(false);
  });

  it('returns false for Zod v3 string schema', () => {
    const schema = z3.string();
    expect(isZodV4Schema(schema)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isZodV4Schema(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isZodV4Schema(undefined)).toBe(false);
  });

  it('returns false for plain object', () => {
    expect(isZodV4Schema({ foo: 'bar' })).toBe(false);
  });
});

describe('assertZodV4', () => {
  it('does not throw for Zod v4 schema', () => {
    const schema = z.object({ foo: z.string() });
    expect(() => assertZodV4(schema, 'flagSchema')).not.toThrow();
  });

  it('throws for Zod v3 schema with helpful message', () => {
    const schema = z3.object({ foo: z3.string() });
    expect(() => assertZodV4(schema, 'flagSchema')).toThrow(
      '[AxiomAI] Zod v4 schemas are required (detected in flagSchema). Found unsupported Zod version.',
    );
  });
});

describe('getKind', () => {
  it('returns "readonly" for readonly wrapper', () => {
    const schema = z.string().readonly();
    expect(getKind(schema)).toBe('readonly');
  });

  it('returns "catch" for catch wrapper', () => {
    const schema = z.string().catch('fallback');
    expect(getKind(schema)).toBe('catch');
  });

  it('returns "prefault" for prefault wrapper', () => {
    const schema = z.string().prefault('prefault-value');
    expect(getKind(schema)).toBe('prefault');
  });

  it('returns "nonoptional" for nonoptional wrapper', () => {
    const schema = z.string().optional().nonoptional();
    expect(getKind(schema)).toBe('nonoptional');
  });
});

describe('unwrapTransparent', () => {
  it('unwraps readonly to get inner type', () => {
    const inner = z.object({ foo: z.string() });
    const schema = inner.readonly();
    expect(unwrapTransparent(schema)).toBe(inner);
  });

  it('unwraps catch to get inner type', () => {
    const inner = z.string();
    const schema = inner.catch('fallback');
    expect(unwrapTransparent(schema)).toBe(inner);
  });

  it('unwraps prefault to get inner type', () => {
    const inner = z.string();
    const schema = inner.prefault('prefault-value');
    expect(unwrapTransparent(schema)).toBe(inner);
  });

  it('unwraps nonoptional to get inner type', () => {
    const inner = z.string().optional();
    const schema = inner.nonoptional();
    const unwrapped = unwrapTransparent(schema);
    expect((unwrapped as any)._zod?.def?.type).toBe('string');
  });
});

describe('Zod internals characterization tests', () => {
  describe('Zod v4 schema structure', () => {
    it('object schema has _zod.def.type === "object"', () => {
      const schema = z.object({ foo: z.string() });
      expect((schema as any)._zod?.def?.type).toBe('object');
    });

    it('object schema has shape property', () => {
      const schema = z.object({ foo: z.string(), bar: z.number() });
      expect(schema.shape).toBeDefined();
      expect('foo' in schema.shape).toBe(true);
      expect('bar' in schema.shape).toBe(true);
    });

    it('string schema has _zod.def.type === "string"', () => {
      const schema = z.string();
      expect((schema as any)._zod?.def?.type).toBe('string');
    });

    it('number schema has _zod.def.type === "number"', () => {
      const schema = z.number();
      expect((schema as any)._zod?.def?.type).toBe('number');
    });

    it('boolean schema has _zod.def.type === "boolean"', () => {
      const schema = z.boolean();
      expect((schema as any)._zod?.def?.type).toBe('boolean');
    });

    it('optional schema has _zod.def.type === "optional" with innerType', () => {
      const schema = z.string().optional();
      expect((schema as any)._zod?.def?.type).toBe('optional');
      expect((schema as any)._zod?.def?.innerType).toBeDefined();
    });

    it('default schema has _zod.def.type === "default" with defaultValue', () => {
      const schema = z.string().default('default-value');
      expect((schema as any)._zod?.def?.type).toBe('default');
      expect((schema as any)._zod?.def?.defaultValue).toBe('default-value');
    });

    it('default schema with function stores evaluated value in Zod v4', () => {
      const schema = z.number().default(() => 42);
      const def = (schema as any)._zod?.def;
      expect(def?.type).toBe('default');
      expect(def?.defaultValue).toBe(42);
    });

    it('nullable schema has _zod.def.type === "nullable" with innerType', () => {
      const schema = z.string().nullable();
      expect((schema as any)._zod?.def?.type).toBe('nullable');
      expect((schema as any)._zod?.def?.innerType).toBeDefined();
    });

    it('union schema has _zod.def.type === "union"', () => {
      const schema = z.union([z.string(), z.number()]);
      expect((schema as any)._zod?.def?.type).toBe('union');
    });

    it('array schema has _zod.def.type === "array"', () => {
      const schema = z.array(z.string());
      expect((schema as any)._zod?.def?.type).toBe('array');
    });

    it('enum schema has _zod.def.type === "enum"', () => {
      const schema = z.enum(['a', 'b', 'c']);
      expect((schema as any)._zod?.def?.type).toBe('enum');
    });

    it('record schema has _zod.def.type === "record"', () => {
      const schema = z.record(z.string(), z.number());
      expect((schema as any)._zod?.def?.type).toBe('record');
    });
  });

  describe('findSchemaAtPath', () => {
    it('returns undefined for empty root schema', () => {
      expect(findSchemaAtPath(undefined, ['foo'])).toBe(undefined);
    });

    it('returns undefined for empty segments', () => {
      const schema = z.object({ foo: z.string() });
      expect(findSchemaAtPath(schema, [])).toBe(undefined);
    });

    it('finds top-level field schema', () => {
      const schema = z.object({ foo: z.string() });
      const result = findSchemaAtPath(schema, ['foo']);
      expect(result).toBeDefined();
      expect((result as any)._zod?.def?.type).toBe('string');
    });

    it('finds nested field schema', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string(),
        }),
      });
      const result = findSchemaAtPath(schema, ['ui', 'theme']);
      expect(result).toBeDefined();
      expect((result as any)._zod?.def?.type).toBe('string');
    });

    it('finds deeply nested field schema', () => {
      const schema = z.object({
        app: z.object({
          ui: z.object({
            layout: z.object({
              sidebar: z.boolean(),
            }),
          }),
        }),
      });
      const result = findSchemaAtPath(schema, ['app', 'ui', 'layout', 'sidebar']);
      expect(result).toBeDefined();
      expect((result as any)._zod?.def?.type).toBe('boolean');
    });

    it('returns object schema for namespace path', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string(),
          fontSize: z.number(),
        }),
      });
      const result = findSchemaAtPath(schema, ['ui']);
      expect(result).toBeDefined();
      expect((result as any)._zod?.def?.type).toBe('object');
    });

    it('returns undefined for non-existent path', () => {
      const schema = z.object({ foo: z.string() });
      expect(findSchemaAtPath(schema, ['nonexistent'])).toBe(undefined);
    });

    it('returns undefined for path through non-object', () => {
      const schema = z.object({ foo: z.string() });
      expect(findSchemaAtPath(schema, ['foo', 'bar'])).toBe(undefined);
    });
  });

  describe('isValidPath', () => {
    it('validates simple path', () => {
      const schema = z.object({ foo: z.string() });
      expect(isValidPath(schema, ['foo'])).toBe(true);
      expect(isValidPath(schema, ['bar'])).toBe(false);
    });

    it('validates nested path', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string(),
        }),
      });
      expect(isValidPath(schema, ['ui', 'theme'])).toBe(true);
      expect(isValidPath(schema, ['ui', 'nonexistent'])).toBe(false);
    });

    it('handles optional wrapper', () => {
      const schema = z.object({
        config: z.optional(
          z.object({
            name: z.string(),
          }),
        ),
      });
      expect(isValidPath(schema, ['config', 'name'])).toBe(true);
    });

    it('handles default wrapper', () => {
      const schema = z.object({
        config: z
          .object({
            name: z.string(),
          })
          .default({ name: 'default' }),
      });
      expect(isValidPath(schema, ['config', 'name'])).toBe(true);
    });

    it('rejects path through primitive', () => {
      const schema = z.object({ value: z.string() });
      expect(isValidPath(schema, ['value', 'nested'])).toBe(false);
    });
  });

  describe('buildSchemaForPath', () => {
    it('builds schema for simple path', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string(),
        }),
      });

      const pathSchema = buildSchemaForPath(schema, ['ui', 'theme']);
      expect(pathSchema.safeParse({ ui: { theme: 'dark' } }).success).toBe(true);
      expect(pathSchema.safeParse({}).success).toBe(true);
    });

    it('builds schema for deeply nested path', () => {
      const schema = z.object({
        app: z.object({
          config: z.object({
            features: z.object({
              enabled: z.boolean(),
            }),
          }),
        }),
      });

      const pathSchema = buildSchemaForPath(schema, ['app', 'config', 'features', 'enabled']);
      expect(
        pathSchema.safeParse({
          app: { config: { features: { enabled: true } } },
        }).success,
      ).toBe(true);
    });

    it('throws for non-existent path', () => {
      const schema = z.object({ foo: z.string() });
      expect(() => buildSchemaForPath(schema, ['nonexistent'])).toThrow();
    });
  });

  describe('dotNotationToNested', () => {
    it('converts single flat path', () => {
      expect(dotNotationToNested({ 'ui.theme': 'dark' })).toEqual({
        ui: { theme: 'dark' },
      });
    });

    it('converts multiple flat paths', () => {
      expect(
        dotNotationToNested({
          'ui.theme': 'dark',
          'ui.fontSize': 14,
          'config.name': 'test',
        }),
      ).toEqual({
        ui: { theme: 'dark', fontSize: 14 },
        config: { name: 'test' },
      });
    });

    it('handles deeply nested paths', () => {
      expect(
        dotNotationToNested({
          'a.b.c.d': 'value',
        }),
      ).toEqual({
        a: { b: { c: { d: 'value' } } },
      });
    });

    it('handles top-level keys without dots', () => {
      expect(
        dotNotationToNested({
          foo: 'bar',
          'nested.value': 123,
        }),
      ).toEqual({
        foo: 'bar',
        nested: { value: 123 },
      });
    });
  });

  describe('flattenObject', () => {
    it('flattens nested object', () => {
      expect(
        flattenObject({
          ui: { theme: 'dark', fontSize: 14 },
        }),
      ).toEqual({
        'ui.theme': 'dark',
        'ui.fontSize': 14,
      });
    });

    it('handles deeply nested objects', () => {
      expect(
        flattenObject({
          a: { b: { c: { d: 'value' } } },
        }),
      ).toEqual({
        'a.b.c.d': 'value',
      });
    });

    it('handles arrays as leaf values', () => {
      expect(
        flattenObject({
          items: ['a', 'b', 'c'],
        }),
      ).toEqual({
        items: ['a', 'b', 'c'],
      });
    });
  });

  describe('getValueAtPath', () => {
    it('gets top-level value', () => {
      expect(getValueAtPath({ foo: 'bar' }, ['foo'])).toBe('bar');
    });

    it('gets nested value', () => {
      expect(getValueAtPath({ ui: { theme: 'dark' } }, ['ui', 'theme'])).toBe('dark');
    });

    it('returns undefined for non-existent path', () => {
      expect(getValueAtPath({ foo: 'bar' }, ['nonexistent'])).toBe(undefined);
    });

    it('returns undefined for path through null', () => {
      expect(getValueAtPath({ foo: null }, ['foo', 'bar'])).toBe(undefined);
    });

    it('returns undefined for path through primitive', () => {
      expect(getValueAtPath({ foo: 'string' }, ['foo', 'bar'])).toBe(undefined);
    });
  });

  describe('parsePath', () => {
    it('parses simple path', () => {
      expect(parsePath('foo')).toEqual(['foo']);
    });

    it('parses dotted path', () => {
      expect(parsePath('ui.theme')).toEqual(['ui', 'theme']);
    });

    it('parses deeply nested path', () => {
      expect(parsePath('a.b.c.d.e')).toEqual(['a', 'b', 'c', 'd', 'e']);
    });
  });
});
