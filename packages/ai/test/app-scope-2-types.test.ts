import { describe, test } from 'vitest';
import { z } from 'zod';
import { expectTypeOf } from 'vitest';
import { createAppScope2 } from '../src/app-scope-2';

describe('createAppScope2 type-level tests', () => {
  describe('scaffolding-types', () => {
    test('should have correct basic function types', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const factSchema = z.object({
        userAction: z.string(),
      });

      const scope = createAppScope2({
        flagSchema: schemas,
        factSchema,
      });

      // Basic type checks that should work with current scaffolding
      expectTypeOf(scope).toHaveProperty('flag');
      expectTypeOf(scope).toHaveProperty('fact');
      expectTypeOf(scope.flag).toBeFunction();
      expectTypeOf(scope.fact).toBeFunction();
    });
  });

  describe('basic-access-ok', () => {
    test('should provide correct types for dot notation flag access', () => {
      const flagSchema = {
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
        }),
        api: z.object({
          baseUrl: z.string().default('https://api.example.com'),
          timeout: z.number().default(5000),
        }),
      };

      const appScope = createAppScope2({ flagSchema });

      // Test type inference for dot notation paths
      expectTypeOf(appScope.flag('ui.theme')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(appScope.flag('ui.fontSize')).toEqualTypeOf<number>();
      expectTypeOf(appScope.flag('api.baseUrl')).toEqualTypeOf<string>();
      expectTypeOf(appScope.flag('api.timeout')).toEqualTypeOf<number>();
    });

    test('should enforce valid dot notation paths', () => {
      const flagSchema = {
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z.object({
            sidebar: z.boolean().default(true),
          }),
        }),
      };

      const appScope = createAppScope2({ flagSchema });

      expectTypeOf(appScope.flag('ui.theme')).toEqualTypeOf<string>();

      // @ts-expect-error - invalid shape
      appScope.flag('ui.layout', { foo: 214 });
      // @ts-expect-error - invalid property
      appScope.flag('ui.invalid');
      // @ts-expect-error - invalid path
      appScope.flag('nonexistent.path');
    });

    test('should enforce correct default value types', () => {
      const flagSchema = {
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
          layout: z
            .object({
              sidebar: z.boolean().default(true),
              width: z.number().default(300),
            })
            .default({ sidebar: true, width: 300 }),
        }),
      };

      const appScope = createAppScope2({ flagSchema });

      expectTypeOf(appScope.flag('ui.theme', 'dark')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(appScope.flag('ui.fontSize', 16)).toEqualTypeOf<number>();
      expectTypeOf(appScope.flag('ui.layout', { sidebar: false, width: 250 })).toEqualTypeOf<{
        sidebar: boolean;
        width: number;
      }>();

      // @ts-expect-error - number instead of string
      appScope.flag('ui.theme', 123);
      // @ts-expect-error - wrong object shape
      appScope.flag('ui.layout', { foo: 'bar' });
      // @ts-expect-error - string instead of number
      appScope.flag('ui.fontSize', 'large');
      // @ts-expect-error - wrong literal
      appScope.flag('ui.theme', 'foo');
    });

    test('should support nested dot notation paths', () => {
      // Complex nested schema to test deep path support
      const complexSchema = {
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          layout: z.object({
            sidebar: z.boolean().default(true),
            grid: z.object({
              columns: z.number().default(12),
              rows: z.number().default(10),
              spacing: z.object({
                horizontal: z.number().default(8),
                vertical: z.number().default(4),
              }),
            }),
          }),
          notifications: z.object({
            enabled: z.boolean().default(true),
            position: z.enum(['top-right', 'bottom-left']).default('top-right'),
          }),
        }),
      };

      const appScope = createAppScope2({ flagSchema: complexSchema });

      expectTypeOf(appScope.flag('ui.layout.sidebar')).toEqualTypeOf<boolean>();
      expectTypeOf(appScope.flag('ui.layout.grid.spacing')).toEqualTypeOf<{
        vertical: number;
        horizontal: number;
      }>();
      expectTypeOf(appScope.flag('ui.layout.grid.columns')).toEqualTypeOf<number>();
      expectTypeOf(appScope.flag('ui.layout.grid.spacing.horizontal')).toEqualTypeOf<number>();
      expectTypeOf(appScope.flag('ui.notifications.position')).toEqualTypeOf<
        'top-right' | 'bottom-left'
      >();

      // @ts-expect-error
      appScope.flag('ui.layout.invalid'); // Should error - invalid property
      // @ts-expect-error
      appScope.flag('ui.layout.grid.invalid'); // Should error - invalid nested property
      // @ts-expect-error
      appScope.flag('ui.invalid.path'); // Should error - invalid intermediate path
    });

    test('should enforce valid flag keys within namespaces', () => {
      const flagSchema = {
        database: z.object({
          host: z.string().default('localhost'),
          port: z.number().default(5432),
          ssl: z.boolean().default(false),
        }),
        cache: z.object({
          ttl: z.number().default(3600),
          maxSize: z.number().default(1000),
        }),
      };

      const appScope = createAppScope2({ flagSchema });

      expectTypeOf(appScope.flag('database.host')).toEqualTypeOf<string>();
      expectTypeOf(appScope.flag('cache.ttl')).toEqualTypeOf<number>();

      // @ts-expect-error
      appScope.flag('database.invalid');
      // @ts-expect-error
      appScope.flag('cache.nonexistent');
      // @ts-expect-error
      appScope.flag('missing.anything');
    });
  });

  describe('nested-inference-ok', () => {
    test.skip('should correctly infer types for complex nested structures', () => {
      // TODO: Test complex nested object type inference
    });

    test.skip('should handle optional properties in nested objects', () => {
      // TODO: Test optional property type handling
    });
  });

  describe('namespace-ok', () => {
    test.skip('should provide correct types when accessing whole namespaces', () => {
      // const flagSchema = {
      //   database: z.object({
      //     host: z.string().default('localhost'),
      //     port: z.number().default(5432),
      //     ssl: z.boolean().default(false),
      //   }),
      // };
      // const appScope = createAppScope2({ flagSchema });
      // TODO: Add type assertions for whole namespace access
      // expectTypeOf(appScope.flag('database')).toEqualTypeOf<{
      //   host: string;
      //   port: number;
      //   ssl: boolean;
      // }>();
    });
  });

  describe('default-handling-ok', () => {
    test.skip('should handle schema defaults correctly in type system', () => {
      // TODO: Test default value type handling
    });

    test.skip('should distinguish between required and optional fields', () => {
      // TODO: Test required vs optional field types
    });
  });

  describe('inherited-defaults-ok', () => {
    test.skip('should handle inherited default types correctly', () => {
      // TODO: Test inherited defaults type behavior
    });
  });

  describe('autocomplete-ok', () => {
    test.skip('should provide autocomplete for namespace keys', () => {
      // TODO: Test that IDE autocomplete works for namespace keys
    });

    test.skip('should provide autocomplete for flag keys within namespaces', () => {
      // TODO: Test that IDE autocomplete works for flag keys
    });

    test.skip('should provide autocomplete for nested object properties', () => {
      // TODO: Test autocomplete for nested properties
    });
  });
});
