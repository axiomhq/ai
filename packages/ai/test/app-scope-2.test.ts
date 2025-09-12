import { describe, expect, vi, it } from 'vitest';
import { z } from 'zod';
import { expectTypeOf } from 'vitest';
import { createAppScope2, type DotPaths } from '../src/app-scope-2';

describe('createAppScope2', () => {
  describe('basic setup and scaffolding', () => {
    it('should create instance with correct structure and types', () => {
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

      // Runtime checks
      expect(scope).toBeDefined();
      expect(typeof scope.flag).toBe('function');
      expect(typeof scope.fact).toBe('function');

      // Type checks
      expectTypeOf(scope).toHaveProperty('flag');
      expectTypeOf(scope).toHaveProperty('fact');
      expectTypeOf(scope.flag).toBeFunction();
      expectTypeOf(scope.fact).toBeFunction();
    });

    it('should handle method calls without crashing', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(() => scope.flag('ui.theme')).not.toThrow();
      expect(() => scope.flag('ui.theme', 'dark')).not.toThrow();
    });

    it('should handle fact recording without crashing', () => {
      const factSchema = z.object({
        dbVersion: z.string(),
      });

      const scope = createAppScope2({
        flagSchema: { ui: z.object({}) },
        factSchema,
      });

      expect(() => scope.fact('dbVersion', '1.2.3')).not.toThrow();
    });
  });

  describe('dot notation flag access', () => {
    it('should correctly access individual flags with proper types', () => {
      const schemas = {
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Runtime behavior
      expect(() => scope.flag('ui')).not.toThrow();
      expect(() => scope.flag('ui.theme')).not.toThrow();
      expect(() => scope.flag('ui.fontSize', 16)).not.toThrow();
      expect(scope.flag('ui')).toEqual({
        theme: 'light',
        fontSize: 14,
      });
      expect(scope.flag('ui.theme', 'dark')).toBe('dark');
      expect(scope.flag('ui.fontSize', 16)).toBe(16);

      // Type inference
      expectTypeOf(scope.flag('ui')).toEqualTypeOf<{
        theme: 'light' | 'dark';
        fontSize: number;
      }>();
      expectTypeOf(scope.flag('ui.theme')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(scope.flag('ui.fontSize')).toEqualTypeOf<number>();
    });

    it('should handle nested object properties with correct path types', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z.object({
            sidebar: z.boolean().default(true),
            grid: z.object({
              columns: z.number().default(12),
              spacing: z.object({
                horizontal: z.number().default(8),
                vertical: z.number().default(4),
              }),
            }),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Runtime behavior
      expect(() => scope.flag('ui.layout.sidebar')).not.toThrow();
      expect(() => scope.flag('ui.layout.grid.columns', 8)).not.toThrow();
      expect(scope.flag('ui.layout.sidebar', false)).toBe(false);
      expect(scope.flag('ui.layout.grid.columns', 8)).toBe(8);

      // Type inference for nested paths
      expectTypeOf(scope.flag('ui.layout.sidebar')).toEqualTypeOf<boolean>();
      expectTypeOf(scope.flag('ui.layout.grid.columns')).toEqualTypeOf<number>();
      expectTypeOf(scope.flag('ui.layout.grid.spacing.horizontal')).toEqualTypeOf<number>();

      // Type inference for path with nested defaults
      expectTypeOf(scope.flag('ui.layout')).toEqualTypeOf<{
        sidebar: boolean;
        grid: {
          columns: number;
          spacing: {
            horizontal: number;
            vertical: number;
          };
        };
      }>();

      // @ts-expect-error - invalid paths should be caught
      scope.flag('ui.layout.invalid');
      // @ts-expect-error - invalid nested property
      scope.flag('ui.layout.grid.invalid');
    });

    it('should handle invalid paths gracefully at runtime', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(() => scope.flag('nonexistent.path', 'fallback')).not.toThrow();
      expect(scope.flag('nonexistent.path', 'fallback')).toBe('fallback');
      expect(() => scope.flag('ui.nonexistent', 'fallback')).not.toThrow();
      expect(scope.flag('ui.nonexistent', 'fallback')).toBe('fallback');

      // @ts-expect-error - type system should catch invalid paths
      scope.flag('ui.invalid');
      // @ts-expect-error - type system should catch invalid root namespace
      scope.flag('nonexistent.path');
    });

    it('should enforce correct default value types', () => {
      const schemas = {
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expectTypeOf(scope.flag('ui.theme', 'dark')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(scope.flag('ui.fontSize', 16)).toEqualTypeOf<number>();

      // TODO: BEFORE MERGE - these should log an error at runtime
      // @ts-expect-error - number instead of string enum
      scope.flag('ui.theme', 123);
      // @ts-expect-error - string instead of number
      scope.flag('ui.fontSize', 'large');
      // @ts-expect-error - invalid enum value
      scope.flag('ui.theme', 'invalid');
    });
  });

  describe('schema defaults extraction', () => {
    it('should extract and use schema defaults for individual flags', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(12),
          layout: z.object({
            sidebar: z.boolean().default(true),
          }),
        }),
        config: z.object({
          name: z.string().default('App'),
          version: z.number().default(1),
          enabled: z.boolean().default(false),
          mode: z.enum(['dev', 'prod']).default('dev'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Should extract from schema defaults
      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('ui.fontSize')).toBe(12);
      expect(scope.flag('ui.layout.sidebar')).toBe(true);
      expect(scope.flag('config.name')).toBe('App');
      expect(scope.flag('config.version')).toBe(1);
      expect(scope.flag('config.enabled')).toBe(false);
      expect(scope.flag('config.mode')).toBe('dev');
    });

    it('should prefer explicit defaults over schema defaults', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(12),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Explicit defaults should override schema defaults
      expect(scope.flag('ui.theme', 'light')).toBe('light');
      expect(scope.flag('ui.fontSize', 16)).toBe(16);

      // But schema defaults should still work when no explicit default
      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('ui.fontSize')).toBe(12);
    });

    it('should handle fields without schema defaults', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number(), // no default
          layout: z.object({
            sidebar: z.boolean().default(true),
            width: z.number(), // no default
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('ui.layout.sidebar')).toBe(true);

      // @ts-expect-error - should not be allowed without default
      expect(scope.flag('ui.fontSize')).toBe(undefined);
      // @ts-expect-error - should not be allowed without default
      expect(scope.flag('ui.layout.width')).toBe(undefined);

      // But explicit defaults should work
      expect(scope.flag('ui.fontSize', 14)).toBe(14);
      expect(scope.flag('ui.layout.width', 300)).toBe(300);
    });

    it('should handle deeply nested schema defaults up to depth 8', () => {
      const schemas = {
        app: z.object({
          hasDefault: z.string().default('L1'),
          nested: z.object({
            hasDefault: z.string().default('L2'),
            nested: z.object({
              hasDefault: z.string().default('L3'),
              nested: z.object({
                hasDefault: z.string().default('L4'),
                nested: z.object({
                  hasDefault: z.string().default('L5'),
                  nested: z.object({
                    hasDefault: z.string().default('L6'),
                    nested: z.object({
                      hasDefault: z.string().default('L7'),
                      nested: z.object({
                        hasDefault: z.string().default('L8'),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('app.hasDefault')).toBe('L1');
      expect(scope.flag('app.nested.hasDefault')).toBe('L2');
      expect(scope.flag('app.nested.nested.hasDefault')).toBe('L3');
      expect(scope.flag('app.nested.nested.nested.hasDefault')).toBe('L4');
      expect(scope.flag('app.nested.nested.nested.nested.hasDefault')).toBe('L5');
      expect(scope.flag('app.nested.nested.nested.nested.nested.hasDefault')).toBe('L6');
      expect(scope.flag('app.nested.nested.nested.nested.nested.nested.hasDefault')).toBe('L7');
      expect(scope.flag('app.nested.nested.nested.nested.nested.nested.nested.hasDefault')).toBe(
        'L8',
      );
    });
  });

  describe('whole namespace access', () => {
    it('should return complete namespace objects with schema defaults', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
          layout: z.object({
            sidebar: z.boolean().default(true),
            width: z.number().default(300),
          }),
        }),
        database: z.object({
          host: z.string().default('localhost'),
          port: z.number().default(5432),
          ssl: z.boolean().default(false),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Runtime behavior
      const uiNamespace = scope.flag('ui');
      expect(uiNamespace).toEqual({
        theme: 'dark',
        fontSize: 14,
        layout: {
          sidebar: true,
          width: 300,
        },
      });

      // Type inference
      expectTypeOf(scope.flag('database')).toEqualTypeOf<{
        host: string;
        port: number;
        ssl: boolean;
      }>();

      expectTypeOf(scope.flag('ui')).toEqualTypeOf<{
        theme: string;
        fontSize: number;
        layout: {
          sidebar: boolean;
          width: number;
        };
      }>();
    });

    it('should handle namespaces requiring explicit defaults due to incomplete schema defaults', () => {
      const schemas = {
        complete: z.object({
          field1: z.string().default('default1'),
          field2: z.number().default(42),
        }),
        incomplete: z.object({
          field1: z.string().default('default1'),
          field2: z.string(), // no default
        }),
        mixed: z.object({
          ui: z.object({
            theme: z.string().default('dark'),
            fontSize: z.number().default(14),
          }),
          api: z.object({
            baseUrl: z.string().default('https://api.example.com'),
            timeout: z.number(), // no default
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Complete namespace should work without explicit defaults
      expect(scope.flag('complete')).toEqual({
        field1: 'default1',
        field2: 42,
      });

      expectTypeOf(scope.flag('complete')).toEqualTypeOf<{
        field1: string;
        field2: number;
      }>();

      // Incomplete namespace should require explicit defaults
      const incompleteWithDefaults = scope.flag('incomplete', {
        field1: 'value1',
        field2: 'value2',
      });
      expect(incompleteWithDefaults).toEqual({
        field1: 'value1',
        field2: 'value2',
      });

      expectTypeOf(
        scope.flag('incomplete', {
          field1: 'value1',
          field2: 'value2',
        }),
      ).toEqualTypeOf<{
        field1: string;
        field2: string;
      }>();

      // @ts-expect-error - incomplete namespace without defaults should fail
      scope.flag('incomplete');
      // @ts-expect-error - mixed namespace without defaults should fail
      scope.flag('mixed');
    });

    it('should handle nested namespace access with proper type inference', () => {
      const schemas = {
        app: z.object({
          ui: z.object({
            theme: z.string().default('light'),
            layout: z.object({
              sidebar: z.boolean().default(true),
              grid: z.object({
                columns: z.number().default(12),
                rows: z.number().default(8),
              }),
            }),
          }),
          features: z.object({
            auth: z.object({
              enabled: z.boolean().default(true),
              provider: z.string(), // no default
            }),
            cache: z.object({
              ttl: z.number().default(3600),
              maxSize: z.number().default(1000),
            }),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Access nested complete namespaces
      const layout = scope.flag('app.ui.layout');
      expect(layout).toEqual({
        sidebar: true,
        grid: {
          columns: 12,
          rows: 8,
        },
      });

      const grid = scope.flag('app.ui.layout.grid');
      expect(grid).toEqual({
        columns: 12,
        rows: 8,
      });

      // Type inference for nested namespaces
      expectTypeOf(scope.flag('app.ui')).toEqualTypeOf<{
        theme: string;
        layout: {
          sidebar: boolean;
          grid: {
            columns: number;
            rows: number;
          };
        };
      }>();

      expectTypeOf(scope.flag('app.features.cache')).toEqualTypeOf<{
        ttl: number;
        maxSize: number;
      }>();

      // Incomplete nested namespace should require explicit defaults
      expectTypeOf(
        scope.flag('app.features.auth', {
          enabled: true,
          provider: 'oauth',
        }),
      ).toEqualTypeOf<{
        enabled: boolean;
        provider: string;
      }>();

      // @ts-expect-error - incomplete nested namespace without defaults
      scope.flag('app.features.auth');
    });

    it('should handle object-level defaults correctly', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z
            .object({
              sidebar: z.boolean(),
              width: z.number(),
              collapsed: z.boolean(),
            })
            .default({
              sidebar: true,
              width: 300,
              collapsed: false,
            }),
        }),
        config: z.object({
          database: z
            .object({
              host: z.string(),
              port: z.number(),
            })
            .default({
              host: 'localhost',
              port: 5432,
            }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Should use object-level defaults
      const uiConfig = scope.flag('ui');
      expect(uiConfig).toEqual({
        theme: 'dark',
        layout: {
          sidebar: true,
          width: 300,
          collapsed: false,
        },
      });

      // Nested object access should also work
      const layout = scope.flag('ui.layout');
      expect(layout).toEqual({
        sidebar: true,
        width: 300,
        collapsed: false,
      });

      // Type inference for object-level defaults
      expectTypeOf(scope.flag('config')).toEqualTypeOf<{
        database: {
          host: string;
          port: number;
        };
      }>();

      expectTypeOf(scope.flag('config.database')).toEqualTypeOf<{
        host: string;
        port: number;
      }>();
    });

    it('should prefer explicit defaults over schema defaults for namespaces', () => {
      const schemas = {
        settings: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(12),
          notifications: z.object({
            enabled: z.boolean().default(true),
            position: z.string().default('top-right'),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Override with explicit defaults
      const customSettings = scope.flag('settings', {
        theme: 'light',
        fontSize: 16,
        notifications: {
          enabled: false,
          position: 'bottom-left',
        },
      });

      expect(customSettings).toEqual({
        theme: 'light',
        fontSize: 16,
        notifications: {
          enabled: false,
          position: 'bottom-left',
        },
      });

      // Schema defaults should still work when no explicit defaults
      const defaultSettings = scope.flag('settings');
      expect(defaultSettings).toEqual({
        theme: 'dark',
        fontSize: 12,
        notifications: {
          enabled: true,
          position: 'top-right',
        },
      });
    });
  });

  describe('type constraint validation', () => {
    it('should enforce valid namespace and flag keys', () => {
      const schemas = {
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

      const scope = createAppScope2({ flagSchema: schemas });

      expectTypeOf(scope.flag('database.host')).toEqualTypeOf<string>();
      expectTypeOf(scope.flag('cache.ttl')).toEqualTypeOf<number>();

      // @ts-expect-error - invalid property
      scope.flag('database.invalid');
      // @ts-expect-error - invalid namespace
      scope.flag('missing.anything');
    });

    it('should enforce correct default value types for complex schemas', () => {
      const schemas = {
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          layout: z
            .object({
              sidebar: z.boolean().default(true),
              width: z.number().default(300),
            })
            .default({ sidebar: true, width: 300 }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expectTypeOf(scope.flag('ui.layout', { sidebar: false, width: 250 })).toEqualTypeOf<{
        sidebar: boolean;
        width: number;
      }>();

      // @ts-expect-error - wrong object shape
      scope.flag('ui.layout', { foo: 'bar' });
      // @ts-expect-error - wrong literal value
      scope.flag('ui.theme', 'invalid');
    });

    it('should handle edge case types correctly', () => {
      const schemas = {
        empty: z.object({}),
        optional: z.object({
          field: z.string().optional(),
        }),
        nullable: z.object({
          field: z.string().nullable().default(null),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Empty object
      expectTypeOf(scope.flag('empty', {})).toEqualTypeOf<{}>();

      // Object with optional field
      expectTypeOf(scope.flag('optional', { field: 'value' })).toEqualTypeOf<{
        field?: string | undefined;
      }>();

      expectTypeOf(scope.flag('optional', {})).toEqualTypeOf<{
        field?: string | undefined;
      }>();

      // Object with nullable field with default
      expectTypeOf(scope.flag('nullable')).toEqualTypeOf<{
        field: string | null;
      }>();
    });
  });

  describe('complex integration scenarios', () => {
    it('should handle complex nested structures with mixed defaults', () => {
      const schemas = {
        application: z.object({
          name: z.string().default('MyApp'),
          version: z.string(), // no default
          ui: z.object({
            theme: z.string().default('system'),
            components: z
              .object({
                header: z.object({
                  visible: z.boolean(),
                  title: z.string(),
                }),
                footer: z.object({
                  visible: z.boolean(),
                  text: z.string(),
                }),
              })
              .default({
                header: { visible: true, title: 'App Header' },
                footer: { visible: false, text: 'Footer Text' },
              }),
          }),
          database: z.object({
            host: z.string().default('localhost'),
            port: z.number().default(5432),
            credentials: z.object({
              username: z.string(),
              password: z.string(),
            }),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Access complete sub-namespaces
      const components = scope.flag('application.ui.components');
      expect(components).toEqual({
        header: { visible: true, title: 'App Header' },
        footer: { visible: false, text: 'Footer Text' },
      });

      // Access individual nested objects with defaults
      const header = scope.flag('application.ui.components.header');
      expect(header).toEqual({ visible: true, title: 'App Header' });

      // Test incomplete namespace requiring explicit defaults
      const dbWithCreds = scope.flag('application.database', {
        host: 'prod-db',
        port: 3306,
        credentials: {
          username: 'admin',
          password: 'secret',
        },
      });

      expect(dbWithCreds.credentials).toEqual({
        username: 'admin',
        password: 'secret',
      });
    });

    it('should validate both runtime behavior and type constraints together', () => {
      const schemas = {
        features: z.object({
          auth: z.object({
            enabled: z.boolean().default(true),
            provider: z.string(), // no default
          }),
          cache: z.object({
            ttl: z.number().default(3600),
            maxSize: z.number().default(1000),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Complete namespace (cache) should work without explicit defaults
      const cacheConfig = scope.flag('features.cache');
      expect(cacheConfig).toEqual({
        ttl: 3600,
        maxSize: 1000,
      });

      // Incomplete namespace (auth) should require explicit defaults
      const authConfig = scope.flag('features.auth', {
        enabled: true,
        provider: 'oauth',
      });
      expect(authConfig).toEqual({
        enabled: true,
        provider: 'oauth',
      });

      // if we ignore the type error, it returns undefined
      // @ts-expect-error - incomplete defaults
      expect(scope.flag('features.auth')).toBe(undefined);

      // Type validation should match runtime behavior
      expectTypeOf(scope.flag('features.cache')).toEqualTypeOf<{
        ttl: number;
        maxSize: number;
      }>();

      expectTypeOf(
        scope.flag('features.auth', {
          enabled: true,
          provider: 'oauth',
        }),
      ).toEqualTypeOf<{
        enabled: boolean;
        provider: string;
      }>();
    });
  });

  describe('type inference advanced features', () => {
    it('should reject union types in schemas at compile time and runtime', () => {
      // This should produce a TypeScript error but not execute
      // @ts-expect-error - union types should be rejected at compile time
      const _shouldNotCompile = () =>
        // @ts-expect-error
        createAppScope2({
          flagSchema: {
            payment: z.union([
              z.object({ type: z.literal('stripe'), apiKey: z.string() }),
              z.object({ type: z.literal('paypal'), clientId: z.string() }),
            ]),
          },
        });

      // Runtime validation should still work for cases that bypass TypeScript
      expect(() => {
        // @ts-expect-error
        createAppScope2({
          flagSchema: {
            payment: z.union([
              z.object({ type: z.literal('stripe'), apiKey: z.string() }),
              z.object({ type: z.literal('paypal'), clientId: z.string() }),
            ]),
          },
        });
      }).toThrow('[AxiomAI] Union types are not supported in flag schemas (found at "payment")');
    });

    it('should reject nested union types in schemas', () => {
      expect(() => {
        // @ts-expect-error - nested union types should be rejected at compile time
        createAppScope2({
          flagSchema: {
            ui: z.object({
              theme: z.string().default('dark'),
              layout: z.union([
                z.object({ type: z.literal('grid') }),
                z.object({ type: z.literal('list') }),
              ]),
            }),
          },
        });
      }).toThrow('[AxiomAI] Union types are not supported in flag schemas (found at "ui.layout")');
    });

    it('should reject .or() usage in schemas', () => {
      expect(() => {
        // @ts-expect-error - .or() usage should be rejected at compile time
        createAppScope2({
          flagSchema: {
            config: z.object({
              value: z.string().or(z.number()),
            }),
          },
        });
      }).toThrow(
        '[AxiomAI] Union types are not supported in flag schemas (found at "config.value")',
      );
    });
  });

  describe('validation and error handling', () => {
    it('should return undefined and log an error for invalid namespace access', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Try to access a namespace that doesn't exist
      const result = (scope.flag as any)('nonexistent.path');

      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toMatch(/Invalid flag/);

      errorSpy.mockRestore();
    });

    it('should return undefined and log an error for invalid flag key access', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Try to access a field that doesn't exist in the namespace
      const result = (scope.flag as any)('ui.unknown');

      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toMatch(/Invalid flag/);

      errorSpy.mockRestore();
    });

    it('should log an error when recording a fact that is not in the schema (but still record it)', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const factSchema = z.object({
        dbVersion: z.string(),
      });

      const scope = createAppScope2({
        flagSchema: { ui: z.object({}) },
        factSchema,
      });

      // Record a fact that's not in the schema
      expect(() => scope.fact('unknownFact' as any, 123)).not.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toMatch(/Invalid fact/);

      errorSpy.mockRestore();
    });
  });

  describe('autocomplete and developer experience', () => {
    it('should provide autocomplete for namespace keys', () => {
      const _schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
        }),
        features: z.object({
          auth: z.boolean().default(true),
          cache: z.object({
            ttl: z.number().default(3600),
          }),
        }),
      };

      type ActualDotPaths = DotPaths<typeof _schemas>;
      type ExpectedDotPaths =
        | 'ui'
        | 'ui.theme'
        | 'ui.fontSize'
        | 'features'
        | 'features.auth'
        | 'features.cache'
        | 'features.cache.ttl';

      expectTypeOf<ActualDotPaths>().toEqualTypeOf<ExpectedDotPaths>();
    });
  });
});
