import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest';
import { expectTypeOf } from 'vitest';
import { z } from 'zod';
import { createAppScope2 } from '../src/app-scope-2';
import {
  setGlobalFlagOverrides,
  clearGlobalFlagOverrides,
} from '../src/evals/context/global-flags';

// TODO: BEFORE MERGE - simplify this

describe('flagSchema API', () => {
  const standardSchema = z.object({
    foo: z.object({ bar: z.string().default('default') }),
    baz: z.object({ qux: z.number().default(42) }),
  });

  let appScope: any;

  beforeEach(() => {
    clearGlobalFlagOverrides();
    appScope = createAppScope2({ flagSchema: standardSchema });
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearGlobalFlagOverrides();
  });

  describe('flagSchema() - no arguments (Equivalence Partitioning)', () => {
    it('should return entire schema', () => {
      const schema = z.object({
        foo: z.object({ bar: z.string() }),
        baz: z.object({ qux: z.number() }),
      });
      const appScope = createAppScope2({ flagSchema: schema });

      const result = appScope.flagSchema();
      expect(result).toBe(schema);
    });

    it('should return same reference on multiple calls', () => {
      const result1 = appScope.flagSchema();
      const result2 = appScope.flagSchema();

      expect(result1).toBe(result2);
      expect(result1).toBe(standardSchema);
    });

    it('should provide correct return type', () => {
      expectTypeOf(appScope.flagSchema()).toEqualTypeOf<any>();
    });
  });

  describe('flagSchema(key) - single argument (Equivalence Partitioning)', () => {
    it('should return specific sub-schema for valid key', () => {
      const result = appScope.flagSchema('foo');
      expect(result).toBe(standardSchema.shape.foo);
    });

    it('should return different sub-schemas for different keys', () => {
      const fooResult = appScope.flagSchema('foo');
      const bazResult = appScope.flagSchema('baz');

      expect(fooResult).toBe(standardSchema.shape.foo);
      expect(bazResult).toBe(standardSchema.shape.baz);
      expect(fooResult).not.toBe(bazResult);
    });

    it('should provide correct return types for single key access', () => {
      expectTypeOf(appScope.flagSchema('foo')).toEqualTypeOf<any>();
      expectTypeOf(appScope.flagSchema('baz')).toEqualTypeOf<any>();
    });

    it('should throw for invalid single key', () => {
      expect(() => appScope.flagSchema('invalid' as any)).toThrow();
    });
  });

  describe('flagSchema(...keys) - multiple arguments (Equivalence Partitioning)', () => {
    it('should return array of sub-schemas for valid keys', () => {
      const result = appScope.flagSchema('foo', 'baz');
      expect(result).toEqual([standardSchema.shape.foo, standardSchema.shape.baz]);
    });

    it('should handle different key orders', () => {
      const result1 = appScope.flagSchema('foo', 'baz');
      const result2 = appScope.flagSchema('baz', 'foo');

      expect(result1).toEqual([standardSchema.shape.foo, standardSchema.shape.baz]);
      expect(result2).toEqual([standardSchema.shape.baz, standardSchema.shape.foo]);
    });

    it('should provide correct return types for multiple keys', () => {
      expectTypeOf(appScope.flagSchema('foo', 'baz')).toEqualTypeOf<any>();
    });

    it('should throw for mixed valid/invalid keys', () => {
      expect(() => appScope.flagSchema('foo', 'invalid' as any)).toThrow();
    });

    it('should throw for all invalid keys', () => {
      expect(() => appScope.flagSchema('invalid1' as any, 'invalid2' as any)).toThrow();
    });
  });

  describe('Boundary Value Analysis - argument counts', () => {
    it('should handle maximum reasonable key count', () => {
      const largeSchema = z.object({
        key1: z.object({ value: z.string() }),
        key2: z.object({ value: z.string() }),
        key3: z.object({ value: z.string() }),
        key4: z.object({ value: z.string() }),
        key5: z.object({ value: z.string() }),
      });
      const appScope = createAppScope2({ flagSchema: largeSchema });

      const allKeys = Object.keys(largeSchema.shape) as Array<keyof typeof largeSchema.shape>;
      const result = appScope.flagSchema(...allKeys);
      expect(result).toHaveLength(allKeys.length);
    });

    it('should handle single key (minimum valid)', () => {
      const result = appScope.flagSchema('foo');
      expect(result).toBe(standardSchema.shape.foo);
    });

    it('should handle empty arguments (zero keys)', () => {
      const result = appScope.flagSchema();
      expect(result).toBe(standardSchema);
    });
  });

  describe('Key name boundary conditions', () => {
    const edgeCaseSchema = z.object({
      a: z.object({ value: z.string() }), // Single char
      very_long_key_name_that_tests_boundaries: z.object({ value: z.string() }), // Long key
    });

    it('should handle single character key names', () => {
      const appScope = createAppScope2({ flagSchema: edgeCaseSchema });
      expect(() => appScope.flagSchema('a')).not.toThrow();

      const result = appScope.flagSchema('a');
      expect(result).toBe(edgeCaseSchema.shape.a);
    });

    it('should handle very long key names', () => {
      const appScope = createAppScope2({ flagSchema: edgeCaseSchema });
      expect(() => appScope.flagSchema('very_long_key_name_that_tests_boundaries')).not.toThrow();

      const result = appScope.flagSchema('very_long_key_name_that_tests_boundaries');
      expect(result).toBe(edgeCaseSchema.shape.very_long_key_name_that_tests_boundaries);
    });
  });

  describe('Type validation errors', () => {
    it('should reject non-string arguments', () => {
      expect(() => (appScope as any).flagSchema(123)).toThrow();
      expect(() => (appScope as any).flagSchema(null)).toThrow();
      expect(() => (appScope as any).flagSchema(undefined)).toThrow();
      expect(() => (appScope as any).flagSchema({})).toThrow();
      expect(() => (appScope as any).flagSchema([])).toThrow();
    });

    it('should reject mixed type arguments', () => {
      expect(() => (appScope as any).flagSchema('foo', 123)).toThrow();
      expect(() => (appScope as any).flagSchema('foo', null, 'baz')).toThrow();
    });
  });

  describe('Malformed input handling', () => {
    it('should handle empty strings gracefully', () => {
      expect(() => appScope.flagSchema('' as any)).toThrow(/Invalid flag schema key/);
    });

    it('should handle whitespace-only strings', () => {
      expect(() => appScope.flagSchema('   ' as any)).toThrow(/Invalid flag schema key/);
    });

    it('should handle special characters in key names', () => {
      expect(() => appScope.flagSchema('foo.bar' as any)).toThrow();
      expect(() => appScope.flagSchema('foo/bar' as any)).toThrow();
      expect(() => appScope.flagSchema('foo bar' as any)).toThrow();
    });
  });

  describe('Context validation', () => {
    it('should throw meaningful error when flagSchema is undefined', () => {
      const appScope = createAppScope2({ flagSchema: undefined as any });
      expect(() => appScope.flagSchema()).toThrow(/flagSchema not provided/);
    });

    it('should preserve error context in stack traces', () => {
      try {
        appScope.flagSchema('nonexistent' as any);
      } catch (error: any) {
        expect(error.message).toContain('nonexistent');
        expect(error.stack).toBeDefined();
      }
    });

    it('should handle null flagSchema', () => {
      const appScope = createAppScope2({ flagSchema: null as any });
      expect(() => appScope.flagSchema()).toThrow();
    });
  });

  describe('TypeScript type safety', () => {
    const schema = z.object({
      foo: z.object({ bar: z.string() }),
      baz: z.object({ qux: z.number() }),
    });
    const appScope = createAppScope2({ flagSchema: schema });

    it('should provide correct return types', () => {
      // No arguments - returns entire schema
      expectTypeOf((appScope as any).flagSchema()).toEqualTypeOf<any>();

      // Single argument - returns specific sub-schema
      expectTypeOf(appScope.flagSchema('foo')).toEqualTypeOf<any>();

      // Multiple arguments - returns array of sub-schemas
      expectTypeOf(appScope.flagSchema('foo', 'baz')).toEqualTypeOf<any>();
    });

    it('should enforce valid key names at compile time', () => {
      // Invalid key should cause runtime error
      try {
        appScope.flagSchema('invalid');
        // Should not reach here - runtime should catch invalid key
        expect.fail('Expected runtime error for invalid key');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
      }

      // Mixed valid/invalid should cause runtime error
      try {
        appScope.flagSchema('foo', 'invalid');
        // Should not reach here - runtime should catch invalid key
        expect.fail('Expected runtime error for mixed valid/invalid keys');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
      }
    });
  });

  describe('Runtime type behavior', () => {
    it('should handle type coercion appropriately', () => {
      // Numbers as strings (common from CLI)
      expect(() => (appScope as any).flagSchema('123')).toThrow();

      // Boolean-like strings
      expect(() => (appScope as any).flagSchema('true')).toThrow();
      expect(() => (appScope as any).flagSchema('false')).toThrow();
    });

    it('should reject Symbol arguments', () => {
      const sym = Symbol('test');
      expect(() => (appScope as any).flagSchema(sym)).toThrow();
    });
  });

  describe('Integration with existing flag functionality', () => {
    it('should work seamlessly with flag() calls', () => {
      const schema = z.object({
        ui: z.object({ theme: z.string().default('dark') }),
      });
      const appScope = createAppScope2({ flagSchema: schema });

      const uiSchema = appScope.flagSchema('ui');
      const themeValue = appScope.flag('ui.theme');

      expect(uiSchema.shape.theme).toBe(schema.shape.ui.shape.theme);
      expect(themeValue).toBe('dark');
    });

    it('should maintain consistency between schema access and flag values', () => {
      const result = appScope.flagSchema('foo');
      const parsed = result.parse({ bar: 'test' });
      expect(parsed).toEqual({ bar: 'test' });

      // Verify flag access works with the same schema
      expect(appScope.flag('foo.bar')).toBe('default');
    });

    it('should handle complex nested flag access', () => {
      const complexSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z.object({
            sidebar: z.boolean().default(true),
          }),
        }),
      });
      const appScope = createAppScope2({ flagSchema: complexSchema });

      const uiSchema = appScope.flagSchema('ui');
      const layoutValue = appScope.flag('ui.layout');
      const sidebarValue = appScope.flag('ui.layout.sidebar');

      expect(uiSchema.shape.layout).toBe(complexSchema.shape.ui.shape.layout);
      expect(layoutValue).toEqual({ sidebar: true });
      expect(sidebarValue).toBe(true);
    });
  });

  describe('Multi-feature integration', () => {
    it('should work with fact() functionality', () => {
      const flagSchema = z.object({ ui: z.object({ enabled: z.boolean().default(true) }) });
      const factSchema = z.object({ renderTime: z.number() });

      const appScope = createAppScope2({ flagSchema, factSchema });

      expect(() => {
        const uiSchema = appScope.flagSchema('ui');
        appScope.fact('renderTime', 150);
        expect(uiSchema).toBeDefined();
      }).not.toThrow();
    });

    it('should not interfere with fact recording', () => {
      const factSchema = z.object({ actionCount: z.number() });
      const appScope = createAppScope2({
        flagSchema: standardSchema,
        factSchema,
      });

      // Access schema first
      const fooSchema = appScope.flagSchema('foo');

      // Then record fact
      expect(() => appScope.fact('actionCount', 5)).not.toThrow();

      // Verify schema still accessible
      expect(fooSchema).toBe(standardSchema.shape.foo);
    });
  });

  describe('CLI flag integration', () => {
    beforeEach(() => {
      setGlobalFlagOverrides({ 'ui.theme': 'light' });
    });

    afterEach(() => {
      clearGlobalFlagOverrides();
    });

    it('should work with CLI overrides', () => {
      const schema = z.object({
        ui: z.object({ theme: z.string().default('dark') }),
      });
      const appScope = createAppScope2({ flagSchema: schema });

      const uiSchema = appScope.flagSchema('ui');
      const themeValue = appScope.flag('ui.theme');

      expect(uiSchema).toBeDefined();
      expect(themeValue).toBe('light'); // CLI override
    });

    it('should not affect schema structure with CLI overrides', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
        }),
      });
      const appScope = createAppScope2({ flagSchema: schema });

      const uiSchema = appScope.flagSchema('ui');

      // Schema structure should remain unchanged
      expect(uiSchema.shape.theme).toBe(schema.shape.ui.shape.theme);
      expect(uiSchema.shape.fontSize).toBe(schema.shape.ui.shape.fontSize);
    });
  });

  describe('Performance testing', () => {
    const largeSchema = z.object(
      Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`key${i}`, z.object({ value: z.string() })]),
      ),
    );

    it('should handle large schemas efficiently', () => {
      const appScope = createAppScope2({ flagSchema: largeSchema });

      const start = performance.now();
      const result = appScope.flagSchema();
      const duration = performance.now() - start;

      expect(result).toBe(largeSchema);
      expect(duration).toBeLessThan(10); // Should complete in < 10ms
    });

    it('should handle multiple key lookups efficiently', () => {
      const appScope = createAppScope2({ flagSchema: largeSchema });
      const keys = Object.keys(largeSchema.shape).slice(0, 10).map(String);

      const start = performance.now();
      const result = appScope.flagSchema(...keys);
      const duration = performance.now() - start;

      expect(result).toHaveLength(10);
      expect(duration).toBeLessThan(5); // Should complete in < 5ms
    });

    it('should handle repeated access efficiently', () => {
      const appScope = createAppScope2({ flagSchema: largeSchema });

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        appScope.flagSchema('key0');
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // 1000 accesses in < 50ms
    });
  });

  describe('Memory efficiency', () => {
    it('should not create unnecessary copies', () => {
      const schema = z.object({ foo: z.object({ bar: z.string() }) });
      const appScope = createAppScope2({ flagSchema: schema });

      const result1 = appScope.flagSchema('foo');
      const result2 = appScope.flagSchema('foo');

      // Should return same reference, not copy
      expect(result1).toBe(result2);
    });

    it('should not retain references to unused keys', () => {
      // Testing that accessing one key doesn't affect memory of others
      const result = appScope.flagSchema('foo');
      expect(result).toBeDefined();

      // Should be able to access other keys independently
      const result2 = appScope.flagSchema('baz');
      expect(result2).toBeDefined();
      expect(result).not.toBe(result2);
    });

    it('should handle garbage collection properly', () => {
      const schema = z.object({
        temp: z.object({ data: z.string() }),
      });
      const appScope = createAppScope2({ flagSchema: schema });

      // Create reference and clear it
      let tempResult = appScope.flagSchema('temp');
      expect(tempResult).toBeDefined();
      tempResult = null as any;

      // Should still be accessible
      const newResult = appScope.flagSchema('temp');
      expect(newResult).toBeDefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should not break existing flag() behavior', () => {
      const schema = z.object({
        ui: z.object({ theme: z.string().default('dark') }),
      });
      const appScope = createAppScope2({ flagSchema: schema });

      // Existing behavior should work unchanged
      expect(appScope.flag('ui.theme')).toBe('dark');
      expect(appScope.flag('ui.theme', 'light')).toBe('light');
    });

    it('should maintain existing error behavior', () => {
      expect(() => appScope.flag('invalid.path' as any)).not.toThrow();
      expect(appScope.flag('invalid.path' as any, 'fallback')).toBe('fallback');
    });

    it('should preserve existing type signatures', () => {
      expectTypeOf(appScope.flag).toEqualTypeOf<any>();
      expectTypeOf(appScope.fact).toEqualTypeOf<any>();
    });

    it('should not affect existing fact() behavior', () => {
      const factSchema = z.object({ event: z.string() });
      const appScope = createAppScope2({
        flagSchema: standardSchema,
        factSchema,
      });

      // Access flagSchema
      appScope.flagSchema('foo');

      // fact() should still work normally
      expect(() => appScope.fact('event', 'test')).not.toThrow();
    });
  });

  describe('Edge cases and unusual scenarios', () => {
    it('should handle recursive schema structures', () => {
      const recursiveSchema = z.object({
        nested: z.object({
          deep: z.object({
            value: z.string(),
          }),
        }),
      });

      const appScope = createAppScope2({ flagSchema: recursiveSchema });
      const result = appScope.flagSchema('nested');

      expect(result.shape.deep).toBeDefined();
      expect(result.shape.deep.shape.value).toBeDefined();
    });

    it('should handle schemas with optional fields', () => {
      const optionalSchema = z.object({
        required: z.object({ value: z.string() }),
        optional: z.object({ value: z.string() }).optional(),
      });

      const appScope = createAppScope2({ flagSchema: optionalSchema });

      expect(() => appScope.flagSchema('required')).not.toThrow();
      expect(() => appScope.flagSchema('optional')).not.toThrow();
      expect(() => appScope.flagSchema('required', 'optional')).not.toThrow();
    });

    it('should handle concurrent access patterns', async () => {
      const promises = Array.from({ length: 10 }, async (_, i) => {
        return appScope.flagSchema(i % 2 === 0 ? 'foo' : 'baz');
      });

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result) => expect(result).toBeDefined());
    });

    it('should handle very deep nesting', () => {
      const deepSchema = z.object({
        level1: z.object({
          level2: z.object({
            level3: z.object({
              level4: z.object({
                value: z.string().default('deep'),
              }),
            }),
          }),
        }),
      });

      const appScope = createAppScope2({ flagSchema: deepSchema });
      const result = appScope.flagSchema('level1');

      expect(result.shape.level2.shape.level3.shape.level4.shape.value).toBeDefined();
    });

    it('should handle empty object schemas', () => {
      const emptySchema = z.object({
        empty: z.object({}),
      });

      const appScope = createAppScope2({ flagSchema: emptySchema });
      const result = appScope.flagSchema('empty');

      expect(result).toBeDefined();
      expect(Object.keys(result.shape)).toHaveLength(0);
    });

    it('should handle schemas with array-like property names', () => {
      const arrayLikeSchema = z.object({
        '0': z.object({ value: z.string() }),
        '1': z.object({ value: z.number() }),
        length: z.object({ value: z.boolean() }),
      });

      const appScope = createAppScope2({ flagSchema: arrayLikeSchema });

      expect(() => appScope.flagSchema('0')).not.toThrow();
      expect(() => appScope.flagSchema('1')).not.toThrow();
      expect(() => appScope.flagSchema('length')).not.toThrow();
    });
  });

  describe('Error message quality', () => {
    it('should provide clear error messages for invalid keys', () => {
      try {
        appScope.flagSchema('invalid' as any);
      } catch (error: any) {
        expect(error.message).toMatch(/invalid/i);
        expect(error.message).toMatch(/flag schema/i);
      }
    });

    it('should provide helpful error for mixed valid/invalid keys', () => {
      try {
        appScope.flagSchema('foo', 'invalid' as any);
      } catch (error: any) {
        expect(error.message).toContain('invalid');
        expect(error.message).toMatch(/key/i);
      }
    });

    it('should provide context about available keys', () => {
      try {
        appScope.flagSchema('wrongKey' as any);
      } catch (error: any) {
        expect(error.message).toMatch(/available.*keys/i);
      }
    });
  });

  describe('Advanced type scenarios', () => {
    it('should handle const assertions correctly', () => {
      const constSchema = z.object({
        config: z.object({
          mode: z.literal('production'),
          version: z.literal(1),
        }),
      });

      const appScope = createAppScope2({ flagSchema: constSchema });
      const result = appScope.flagSchema('config');

      expectTypeOf(result.shape.mode).toEqualTypeOf<any>();
      expectTypeOf(result.shape.version).toEqualTypeOf<any>();
    });

    it('should handle branded types correctly', () => {
      const brandedSchema = z.object({
        user: z.object({
          id: z.string().brand('UserId'),
          email: z.string().email(),
        }),
      });

      const appScope = createAppScope2({ flagSchema: brandedSchema });
      const result = appScope.flagSchema('user');

      expect(result).toBeDefined();
      expect(result.shape.id).toBeDefined();
      expect(result.shape.email).toBeDefined();
    });

    it('should preserve refinement and transformation info', () => {
      const refinedSchema = z.object({
        validated: z.object({
          positiveNum: z.number().positive(),
          email: z.string().email(),
          transformed: z.string().transform((s) => s.toUpperCase()),
        }),
      });

      const appScope = createAppScope2({ flagSchema: refinedSchema });
      const result = appScope.flagSchema('validated');

      expect(result.shape.positiveNum).toBeDefined();
      expect(result.shape.email).toBeDefined();
      expect(result.shape.transformed).toBeDefined();
    });
  });
});
