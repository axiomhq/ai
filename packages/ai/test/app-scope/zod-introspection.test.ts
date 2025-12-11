import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../../src/app-scope';
import { clearGlobalFlagOverrides } from '../../src/evals/context/global-flags';

describe('app-scope Zod introspection behaviors', () => {
  beforeEach(() => {
    clearGlobalFlagOverrides();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearGlobalFlagOverrides();
  });

  describe('assertNoUnions', () => {
    it('rejects top-level union types', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            mode: z.union([z.string(), z.number()]).default('default'),
          }),
        }),
      ).toThrow(/Union types are not supported/);
    });

    it('rejects nested union types', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            ui: z.object({
              theme: z.union([z.literal('dark'), z.literal('light')]).default('dark'),
            }),
          }),
        }),
      ).toThrow(/Union types are not supported/);
    });

    it('rejects discriminated unions', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            config: z
              .discriminatedUnion('type', [
                z.object({ type: z.literal('a'), value: z.string() }),
                z.object({ type: z.literal('b'), value: z.number() }),
              ])
              .default({ type: 'a', value: 'test' }),
          }),
        }),
      ).toThrow(/Union types are not supported/);
    });

    it('accepts schemas without unions', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            simple: z.string().default('value'),
            nested: z.object({
              enabled: z.boolean().default(true),
            }),
          }),
        }),
      ).not.toThrow();
    });

    it('allows optional wrappers', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            value: z.string().optional().default('default'),
          }),
        }),
      ).not.toThrow();
    });

    it('allows nullable wrappers', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            value: z.string().nullable().default(null),
          }),
        }),
      ).not.toThrow();
    });
  });

  describe('ensureAllDefaults', () => {
    it('rejects schemas with missing leaf defaults', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation
        createAppScope({
          flagSchema: z.object({
            ui: z.object({
              theme: z.string(), // No default
            }),
          }),
        }),
      ).toThrow(/All flag fields must have defaults/);
    });

    it('rejects schemas with partial defaults', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation
        createAppScope({
          flagSchema: z.object({
            hasDefault: z.string().default('yes'),
            noDefault: z.number(), // Missing default
          }),
        }),
      ).toThrow(/All flag fields must have defaults/);
    });

    it('accepts object-level defaults covering all fields', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            ui: z
              .object({
                theme: z.string(),
                fontSize: z.number(),
              })
              .default({ theme: 'dark', fontSize: 14 }),
          }),
        }),
      ).not.toThrow();
    });

    it('accepts schemas with all leaf defaults', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            string: z.string().default('default'),
            number: z.number().default(0),
            boolean: z.boolean().default(false),
          }),
        }),
      ).not.toThrow();
    });

    it('accepts nested objects with all leaf defaults', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            level1: z.object({
              level2: z.object({
                level3: z.object({
                  value: z.string().default('deep'),
                }),
              }),
            }),
          }),
        }),
      ).not.toThrow();
    });

    it('accepts ZodRecord with default (default wrapper short-circuits)', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            wrapper: z.object({
              config: z.record(z.string(), z.number()).default({}),
            }),
          }),
        }),
      ).not.toThrow();
    });

    it('rejects bare ZodRecord without default', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation
        createAppScope({
          flagSchema: z.object({
            wrapper: z.object({
              config: z.record(z.string(), z.number()),
            }),
          }),
        }),
      ).toThrow(/ZodRecord is not supported/);
    });

    it('accepts arrays with defaults', () => {
      expect(() =>
        createAppScope({
          flagSchema: z.object({
            items: z.array(z.string()).default([]),
          }),
        }),
      ).not.toThrow();
    });

    it('rejects arrays without defaults', () => {
      expect(() =>
        // @ts-expect-error - testing runtime validation
        createAppScope({
          flagSchema: z.object({
            items: z.array(z.string()),
          }),
        }),
      ).toThrow(/All flag fields must have defaults/);
    });
  });

  describe('buildObjectWithDefaults (via getAllDefaultFlags)', () => {
    it('extracts simple defaults', () => {
      const { getAllDefaultFlags } = createAppScope({
        flagSchema: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
        }),
      });

      expect(getAllDefaultFlags()).toEqual({
        theme: 'dark',
        fontSize: 14,
      });
    });

    it('extracts nested defaults', () => {
      const { getAllDefaultFlags } = createAppScope({
        flagSchema: z.object({
          ui: z.object({
            theme: z.string().default('dark'),
            layout: z.object({
              sidebar: z.boolean().default(true),
            }),
          }),
        }),
      });

      expect(getAllDefaultFlags()).toEqual({
        'ui.theme': 'dark',
        'ui.layout.sidebar': true,
      });
    });

    it('handles object-level defaults', () => {
      const { getAllDefaultFlags } = createAppScope({
        flagSchema: z.object({
          config: z
            .object({
              name: z.string(),
              version: z.number(),
            })
            .default({ name: 'app', version: 1 }),
        }),
      });

      expect(getAllDefaultFlags()).toEqual({
        'config.name': 'app',
        'config.version': 1,
      });
    });

    it('handles function defaults', () => {
      const { getAllDefaultFlags } = createAppScope({
        flagSchema: z.object({
          timestamp: z.number().default(() => 12345),
        }),
      });

      expect(getAllDefaultFlags()).toEqual({
        timestamp: 12345,
      });
    });

    it('handles array defaults', () => {
      const { getAllDefaultFlags } = createAppScope({
        flagSchema: z.object({
          items: z.array(z.string()).default(['a', 'b']),
        }),
      });

      expect(getAllDefaultFlags()).toEqual({
        items: ['a', 'b'],
      });
    });
  });

  describe('isNamespaceAccess (via flag behavior)', () => {
    it('returns object for namespace access', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          ui: z.object({
            theme: z.string().default('dark'),
            fontSize: z.number().default(14),
          }),
        }),
      });

      expect(flag('ui')).toEqual({
        theme: 'dark',
        fontSize: 14,
      });
    });

    it('returns nested object for intermediate namespace', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          app: z.object({
            ui: z.object({
              layout: z.object({
                width: z.number().default(100),
              }),
            }),
          }),
        }),
      });

      expect(flag('app.ui')).toEqual({
        layout: { width: 100 },
      });
    });

    it('returns leaf value for leaf access', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          ui: z.object({
            theme: z.string().default('dark'),
          }),
        }),
      });

      expect(flag('ui.theme')).toBe('dark');
    });
  });

  describe('default extraction through wrappers', () => {
    it('extracts default from ZodDefault', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          value: z.string().default('default-value'),
        }),
      });

      expect(flag('value')).toBe('default-value');
    });

    it('extracts default from nested ZodDefault', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          config: z.object({
            value: z.string().default('nested-default'),
          }),
        }),
      });

      expect(flag('config.value')).toBe('nested-default');
    });

    it('extracts default through optional wrapper', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          value: z.string().optional().default('optional-default'),
        }),
      });

      expect(flag('value')).toBe('optional-default');
    });

    it('extracts default through nullable wrapper', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          value: z.string().nullable().default('nullable-default'),
        }),
      });

      expect(flag('value')).toBe('nullable-default');
    });

    it('extracts object-level default for nested access', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          config: z
            .object({
              theme: z.string(),
              fontSize: z.number(),
            })
            .default({ theme: 'dark', fontSize: 14 }),
        }),
      });

      expect(flag('config.theme')).toBe('dark');
      expect(flag('config.fontSize')).toBe(14);
    });
  });

  describe('schema type detection', () => {
    it('correctly identifies object types with shape', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          nested: z.object({
            value: z.string().default('test'),
          }),
        }),
      });

      const result = flag('nested');
      expect(typeof result).toBe('object');
      expect(result).toEqual({ value: 'test' });
    });

    it('correctly identifies primitive types', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          str: z.string().default('string'),
          num: z.number().default(42),
          bool: z.boolean().default(true),
        }),
      });

      expect(typeof flag('str')).toBe('string');
      expect(typeof flag('num')).toBe('number');
      expect(typeof flag('bool')).toBe('boolean');
    });

    it('correctly identifies enum types', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          mode: z.enum(['dev', 'prod']).default('dev'),
        }),
      });

      expect(flag('mode')).toBe('dev');
    });

    it('correctly identifies array types', () => {
      const { flag } = createAppScope({
        flagSchema: z.object({
          items: z.array(z.string()).default(['a', 'b', 'c']),
        }),
      });

      expect(Array.isArray(flag('items'))).toBe(true);
      expect(flag('items')).toEqual(['a', 'b', 'c']);
    });
  });
});
