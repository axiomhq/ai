import { describe, test, expect } from 'vitest';
import { z } from 'zod';
import { createAppScope2 } from '../src/app-scope-2';

describe('createAppScope2 runtime behavior', () => {
  describe('scaffolding', () => {
    test('should create instance without errors', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });
      expect(scope).toBeDefined();
      expect(typeof scope.flag).toBe('function');
      expect(typeof scope.fact).toBe('function');
    });

    test('should call flag method without crashing', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // These should not throw (using dot notation for now)
      expect(() => scope.flag('ui.theme')).not.toThrow();
      expect(() => scope.flag('ui.theme', 'dark')).not.toThrow();
    });

    test('should call fact method without crashing', () => {
      const factSchema = z.object({
        userAction: z.string(),
      });

      const scope = createAppScope2({
        flagSchema: { ui: z.object({}) },
        factSchema,
      });

      // Should not throw
      expect(() => scope.fact('userAction', 'login')).not.toThrow();
    });
  });

  describe('basicAccess', () => {
    test('should access single flags using dot notation syntax', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number(),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // These should not throw and should return defaultValue for now
      expect(() => scope.flag('ui.theme')).not.toThrow();
      expect(() => scope.flag('ui.fontSize', 14)).not.toThrow();

      // Should return default value passed in (basic implementation)
      expect(scope.flag('ui.theme', 'light')).toBe('light');
      expect(scope.flag('ui.fontSize', 16)).toBe(16);
    });

    test('should access nested object properties', () => {
      const schemas = {
        ui: z.object({
          layout: z.object({
            sidebar: z.boolean().default(true),
            grid: z.object({
              columns: z.number(),
            }),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // These should not throw
      expect(() => scope.flag('ui.layout.sidebar')).not.toThrow();
      expect(() => scope.flag('ui.layout.grid.columns', 12)).not.toThrow();

      // Should return default value passed in
      expect(scope.flag('ui.layout.sidebar', false)).toBe(false);
      expect(scope.flag('ui.layout.grid.columns', 8)).toBe(8);
    });

    test('should handle invalid paths gracefully', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Invalid paths should not crash and return defaultValue
      expect(() => scope.flag('nonexistent.path', 'fallback')).not.toThrow();
      expect(scope.flag('nonexistent.path', 'fallback')).toBe('fallback');

      expect(() => scope.flag('ui.nonexistent', 'fallback')).not.toThrow();
      expect(scope.flag('ui.nonexistent', 'fallback')).toBe('fallback');
    });
  });

  describe('nestedObjects', () => {
    test.skip('should handle deeply nested flag structures', () => {
      // TODO: Implement test
    });

    test.skip('should validate nested object types at runtime', () => {
      // TODO: Implement test
    });
  });

  describe('wholeNamespace', () => {
    test('should return entire namespace when accessing namespace key', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
          layout: z.object({
            sidebar: z.boolean().default(true),
            width: z.number().default(300),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Should return complete namespace object with schema defaults
      const uiNamespace = scope.flag('ui');
      expect(uiNamespace).toEqual({
        theme: 'dark',
        fontSize: 14,
        layout: {
          sidebar: true,
          width: 300,
        },
      });
    });

    test('should return typed namespace object with partial schema defaults', () => {
      const schemas = {
        config: z.object({
          host: z.string().default('localhost'),
          port: z.number(), // no default
          ssl: z.boolean().default(false),
          database: z.object({
            name: z.string().default('app_db'),
            timeout: z.number(), // no default
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Should require explicit default for incomplete namespace
      const configWithDefaults = scope.flag('config', {
        host: 'prod-server',
        port: 5432,
        ssl: true,
        database: {
          name: 'prod_db',
          timeout: 30000,
        },
      });

      expect(configWithDefaults).toEqual({
        host: 'prod-server',
        port: 5432,
        ssl: true,
        database: {
          name: 'prod_db',
          timeout: 30000,
        },
      });
    });

    test('should handle nested namespace access', () => {
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
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Access nested namespace
      const layout = scope.flag('app.ui.layout');
      expect(layout).toEqual({
        sidebar: true,
        grid: {
          columns: 12,
          rows: 8,
        },
      });

      // Access deeply nested namespace
      const grid = scope.flag('app.ui.layout.grid');
      expect(grid).toEqual({
        columns: 12,
        rows: 8,
      });
    });

    test('should prefer explicit defaults over schema defaults for namespaces', () => {
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

    test('should handle namespaces with mixed default availability', () => {
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
    });

    test('should handle namespace with object-level defaults', () => {
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
    });

    test('should handle empty namespaces', () => {
      const schemas = {
        empty: z.object({}),
        withDefaults: z.object({}).default({}),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Empty namespace with explicit default
      const emptyWithDefault = scope.flag('empty', {});
      expect(emptyWithDefault).toEqual({});

      // Empty namespace with schema default
      const emptyWithSchemaDefault = scope.flag('withDefaults');
      expect(emptyWithSchemaDefault).toEqual({});
    });

    test('should handle complex nested structures with mixed defaults', () => {
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
  });

  describe('defaults', () => {
    test('should extract schema defaults for individual flags', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number(), // no default
          layout: z.object({
            sidebar: z.boolean().default(true),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // Should extract from schema defaults
      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('ui.layout.sidebar')).toBe(true);
    });

    test('partial defaults work when accessing children', () => {
      const schemas = {
        ui: z.object({
          foo: z.string().default('foo'),
          bar: z.string(),
          biz: z.object({
            qux: z.string().default('qux'),
            zap: z.string(),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('ui.foo')).toBe('foo');
      // @ts-expect-error - shouldn't be allowed to call like this without default in app!
      expect(scope.flag('ui.bar')).toBe(undefined);
    });

    test('type error when attempting to access parent with partial defaults', () => {
      const schemas = {
        ui: z.object({
          foo: z.object({
            bar: z.string().default('bar'),
            biz: z.string(),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // @ts-expect-error we haven't given a default to `foo` so it should require a value
      scope.flag('ui.foo');

      // But this should work (explicit default provided):
      scope.flag('ui.foo', { bar: 'bar', biz: 'value' });

      // And accessing individual fields should still work:
      scope.flag('ui.foo.bar'); // has default
      scope.flag('ui.foo.biz', 'explicit'); // needs explicit default
    });

    test('nested object with complete defaults should work without explicit value', () => {
      const schemas = {
        ui: z.object({
          completeObj: z.object({
            field1: z.string().default('default1'),
            field2: z.number().default(42),
          }),
          incompleteObj: z.object({
            field1: z.string().default('default1'),
            field2: z.string(), // NO default - makes object incomplete
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      // This should work - all fields have defaults
      scope.flag('ui.completeObj');

      // @ts-expect-error This should NOT work - object has incomplete defaults
      scope.flag('ui.incompleteObj');

      // But explicit default should work
      scope.flag('ui.incompleteObj', { field1: 'value1', field2: 'value2' });

      // Individual field access should still work
      scope.flag('ui.completeObj.field1');
      scope.flag('ui.incompleteObj.field1'); // has default

      // @ts-expect-error - this does not have a default!
      scope.flag('ui.incompleteObj.field2');
    });

    test('can access parent namespace', () => {
      const schemas = {
        ui: z.object({
          foo: z.string().default('foo'),
          bar: z.string(),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('ui', { foo: 'foo', bar: 'bar' })).toEqual({ foo: 'foo', bar: 'bar' });
    });

    test('should prefer explicit defaults over schema defaults', () => {
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

    test('should handle different Zod types with defaults', () => {
      const schemas = {
        config: z.object({
          name: z.string().default('App'),
          version: z.number().default(1),
          enabled: z.boolean().default(false),
          mode: z.enum(['dev', 'prod']).default('dev'),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('config.name')).toBe('App');
      expect(scope.flag('config.version')).toBe(1);
      expect(scope.flag('config.enabled')).toBe(false);
      expect(scope.flag('config.mode')).toBe('dev');
    });

    test('should return undefined for fields without schema defaults', () => {
      const schemas = {
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number(), // no default
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('ui.theme')).toBe('dark');
      // @ts-expect-error - this does not have a default!
      expect(scope.flag('ui.fontSize')).toBe(undefined);
    });

    test('should work for depth up to 8', () => {
      const schemas = {
        app: z.object({
          hasDefault: z.string().default(''),
          noDefault: z.string(),
          nested: z.object({
            hasDefault: z.string().default(''),
            noDefault: z.string(),
            nested: z.object({
              hasDefault: z.string().default(''),
              noDefault: z.string(),
              nested: z.object({
                hasDefault: z.string().default(''),
                noDefault: z.string(),
                nested: z.object({
                  hasDefault: z.string().default(''),
                  noDefault: z.string(),
                  nested: z.object({
                    hasDefault: z.string().default(''),
                    noDefault: z.string(),
                    nested: z.object({
                      hasDefault: z.string().default(''),
                      noDefault: z.string(),
                      nested: z.object({
                        hasDefault: z.string().default(''),
                        noDefault: z.string(),
                        nested: z.object({
                          hasDefault: z.string().default(''),
                          noDefault: z.string(),
                        }),
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

      // L2
      scope.flag('app.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.noDefault');

      // L3
      scope.flag('app.nested.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.nested.noDefault');

      // L4
      scope.flag('app.nested.nested.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.nested.nested.noDefault');

      // L5
      scope.flag('app.nested.nested.nested.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.nested.nested.nested.noDefault');

      // L6
      scope.flag('app.nested.nested.nested.nested.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.nested.nested.nested.nested.noDefault');

      // L7
      scope.flag('app.nested.nested.nested.nested.nested.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.nested.nested.nested.nested.nested.noDefault');

      // L8
      scope.flag('app.nested.nested.nested.nested.nested.nested.hasDefault');
      // @ts-expect-error - no default
      scope.flag('app.nested.nested.nested.nested.nested.nested.noDefault');

      // (the next level would be too deep for current implementation, but easy to fix by passing depth to ZodSchemaAtPathRecursive)
    });

    test('should handle deeply nested schema defaults', () => {
      const schemas = {
        app: z.object({
          ui: z.object({
            theme: z.object({
              primary: z.string().default('blue'),
              secondary: z.string().default('gray'),
            }),
            layout: z.object({
              sidebar: z.object({
                width: z.number().default(250),
                collapsed: z.boolean().default(false),
              }),
            }),
          }),
        }),
      };

      const scope = createAppScope2({ flagSchema: schemas });

      expect(scope.flag('app.ui.theme.primary')).toBe('blue');
      expect(scope.flag('app.ui.theme.secondary')).toBe('gray');
      expect(scope.flag('app.ui.theme')).toEqual({ primary: 'blue', secondary: 'gray' });
      expect(scope.flag('app.ui.layout.sidebar.width')).toBe(250);
      expect(scope.flag('app.ui.layout.sidebar.collapsed')).toBe(false);
    });

    test.skip('should use schema defaults for whole namespaces', () => {
      // TODO: Implement test for future unit
    });
  });

  describe('inheritedDefaults', () => {
    test.skip('should inherit defaults from parent namespaces', () => {
      // TODO: Implement test
    });

    test.skip('should override inherited defaults with specific values', () => {
      // TODO: Implement test
    });
  });

  describe('typeInference', () => {
    test.skip('should infer correct types for nested structures', () => {
      // TODO: Implement test
    });

    test.skip('should handle union types in namespaces', () => {
      // TODO: Implement test
    });
  });

  describe('errorsRuntime', () => {
    test.skip('should throw runtime errors for invalid namespace access', () => {
      // TODO: Implement test
    });

    test.skip('should throw runtime errors for invalid flag key access', () => {
      // TODO: Implement test
    });

    test.skip('should validate fact recording with schema', () => {
      // TODO: Implement test
    });
  });
});
