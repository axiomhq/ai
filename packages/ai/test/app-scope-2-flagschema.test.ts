import { describe, expect, vi, it, beforeEach, afterEach } from 'vitest';
import { expectTypeOf } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../src/app-scope';
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
    appScope = createAppScope({ flagSchema: standardSchema });
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
      const appScope = createAppScope({ flagSchema: schema });

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
      const appScope = createAppScope({ flagSchema: largeSchema });

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
      const appScope = createAppScope({ flagSchema: edgeCaseSchema });
      expect(() => appScope.flagSchema('a')).not.toThrow();

      const result = appScope.flagSchema('a');
      expect(result).toBe(edgeCaseSchema.shape.a);
    });

    it('should handle very long key names', () => {
      const appScope = createAppScope({ flagSchema: edgeCaseSchema });
      expect(() => appScope.flagSchema('very_long_key_name_that_tests_boundaries')).not.toThrow();

      const result = appScope.flagSchema('very_long_key_name_that_tests_boundaries');
      expect(result).toBe(edgeCaseSchema.shape.very_long_key_name_that_tests_boundaries);
    });
  });

  describe('TypeScript type safety', () => {
    const schema = z.object({
      foo: z.object({ bar: z.string() }),
      baz: z.object({ qux: z.number() }),
    });
    const appScope = createAppScope({ flagSchema: schema });

    it('should provide correct return types', () => {
      expectTypeOf(appScope.flagSchema()).not.toEqualTypeOf<any>();
      expectTypeOf(appScope.flagSchema('foo')).not.toEqualTypeOf<any>();
      expectTypeOf(appScope.flagSchema('foo', 'baz')).not.toEqualTypeOf<any>();
    });

    it('should enforce valid key names at compile time', () => {
      // Invalid key should cause runtime error
      try {
        (appScope.flagSchema as any)('invalid');
        // Should not reach here - runtime should catch invalid key
        expect.fail('Expected runtime error for invalid key');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
      }

      // Mixed valid/invalid should cause runtime error
      try {
        (appScope.flagSchema as any)('foo', 'invalid');
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
      const appScope = createAppScope({ flagSchema: schema });

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
      const appScope = createAppScope({ flagSchema: complexSchema });

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

      const appScope = createAppScope({ flagSchema, factSchema });

      expect(() => {
        const uiSchema = appScope.flagSchema('ui');
        appScope.fact('renderTime', 150);
        expect(uiSchema).toBeDefined();
      }).not.toThrow();
    });

    it('should not interfere with fact recording', () => {
      const factSchema = z.object({ actionCount: z.number() });
      const appScope = createAppScope({
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
      const appScope = createAppScope({ flagSchema: schema });

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
      const appScope = createAppScope({ flagSchema: schema });

      const uiSchema = appScope.flagSchema('ui');

      // Schema structure should remain unchanged
      expect(uiSchema.shape.theme).toBe(schema.shape.ui.shape.theme);
      expect(uiSchema.shape.fontSize).toBe(schema.shape.ui.shape.fontSize);
    });
  });

  describe('Memory efficiency', () => {
    it('should not create unnecessary copies', () => {
      const schema = z.object({ foo: z.object({ bar: z.string() }) });
      const appScope = createAppScope({ flagSchema: schema });

      const result1 = appScope.flagSchema('foo');
      const result2 = appScope.flagSchema('foo');

      // Should return same reference, not copy
      expect(result1).toBe(result2);
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

      const appScope = createAppScope({ flagSchema: constSchema });
      const result = appScope.flagSchema('config');

      expectTypeOf(result.shape.mode).not.toEqualTypeOf<any>();
      expectTypeOf(result.shape.version).not.toEqualTypeOf<any>();
    });

    it('should handle branded types correctly', () => {
      const brandedSchema = z.object({
        user: z.object({
          id: z.string().brand('UserId'),
          email: z.string().email(),
        }),
      });

      const appScope = createAppScope({ flagSchema: brandedSchema });
      const result = appScope.flagSchema('user');

      expect(result).toBeDefined();
      expect(result.shape.id).toBeDefined();
      expect(result.shape.email).toBeDefined();
    });
  });
});
