import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { expectTypeOf } from 'vitest';
import { createAppScope, isPickedFlag, type DotPaths } from '../../src/app-scope';
import {
  setGlobalFlagOverrides,
  clearGlobalFlagOverrides,
} from '../../src/evals/context/global-flags';
import { withEvalContext } from '../../src/evals/context/storage';

function withSuppressedErrors<T>(
  fn: (errorSpy: ReturnType<typeof vi.spyOn>) => T,
  expectedMessages?: string[],
): T {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const result = fn(errorSpy);

    if (expectedMessages) {
      expectedMessages.forEach((message) => {
        expect(errorSpy).toHaveBeenCalledWith(message);
      });
    }

    return result;
  } finally {
    errorSpy.mockRestore();
  }
}

describe('createAppScope', () => {
  // Shared setup/teardown
  beforeEach(() => {
    clearGlobalFlagOverrides();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearGlobalFlagOverrides();
  });

  describe('Core Functionality', () => {
    it('should create instance with correct structure and types', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const factSchema = z.object({
        userAction: z.string(),
      });

      const scope = createAppScope({
        flagSchema,
        factSchema,
      });

      expect(scope).toBeDefined();
      expect(typeof scope.flag).toBe('function');
      expect(typeof scope.fact).toBe('function');

      expectTypeOf(scope).toHaveProperty('flag');
      expectTypeOf(scope).toHaveProperty('fact');
      expectTypeOf(scope.flag).toBeFunction();
      expectTypeOf(scope.fact).toBeFunction();
    });

    it('should handle method calls without crashing', () => {
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      expect(() => scope.flag('ui.theme')).not.toThrow();
    });

    it('should expect an object with full defaults', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number(),
        }),
      });

      // it should error at compile-time because flagSchema doesn't have deep defaults
      // @ts-expect-error - Missing .default() on fontSize
      expect(() => createAppScope({ flagSchema })).toThrow(
        '[AxiomAI] All flag fields must have defaults',
      );
    });

    it('should handle fact recording without crashing', () => {
      const factSchema = z.object({
        dbVersion: z.string(),
      });

      const scope = createAppScope({
        flagSchema: z.object({ ui: z.object({}) }),
        factSchema,
      });

      expect(() => scope.fact('dbVersion', '1.2.3')).not.toThrow();
    });

    it('should work with schema-based flag validation', () => {
      const flagSchema = z.object({
        num: z.number().default(42),
        str: z.string().default('default'),
      });

      const factSchema = z.object({
        duration: z.number(),
        tokenCount: z.number().optional(),
      });

      const appScope = createAppScope({ flagSchema, factSchema });

      // Test flag access with schema defaults
      const temp = appScope.flag('num');
      expect(temp).toBe(42);

      const model = appScope.flag('str');
      expect(model).toBe('default');

      // Test fact recording (should not throw)
      expect(() => {
        appScope.fact('duration', 123.45);
      }).not.toThrow();
    });

    // TODO: BEFORE MERGE - true?
    it('should not be allowed to call without flagSchema', () => {
      // @ts-expect-error
      const _appScope = createAppScope();
      // @ts-expect-error
      const _appScope2 = createAppScope({ factSchema: z.object({}) });
    });
  });

  describe('Schema Defaults & Type System', () => {
    it('should extract and use schema defaults for individual flags', () => {
      const schemas = z.object({
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
      });

      const scope = createAppScope({ flagSchema: schemas });

      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('ui.fontSize')).toBe(12);
      expect(scope.flag('ui.layout.sidebar')).toBe(true);
      expect(scope.flag('config.name')).toBe('App');
      expect(scope.flag('config.version')).toBe(1);
      expect(scope.flag('config.enabled')).toBe(false);
      expect(scope.flag('config.mode')).toBe('dev');
    });

    it('should handle deeply nested schema defaults up to depth 8', () => {
      const schemas = z.object({
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
      });

      const scope = createAppScope({ flagSchema: schemas });

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

    it('should support primitive Zod types as flag schema values', () => {
      const schemas = z.object({
        appName: z.string().default('MyApp'),
        version: z.number().default(1),
        isEnabled: z.boolean().default(false),
        mode: z.enum(['dev', 'prod']).default('dev'),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Runtime behavior
      expect(scope.flag('appName')).toBe('MyApp');
      expect(scope.flag('version')).toBe(1);
      expect(scope.flag('isEnabled')).toBe(false);
      expect(scope.flag('mode')).toBe('dev');

      // Type inference
      expectTypeOf(scope.flag('appName')).toEqualTypeOf<string>();
      expectTypeOf(scope.flag('version')).toEqualTypeOf<number>();
      expectTypeOf(scope.flag('isEnabled')).toEqualTypeOf<boolean>();
      expectTypeOf(scope.flag('mode')).toEqualTypeOf<'dev' | 'prod'>();
    });

    it('should provide correct dot paths for primitive schemas', () => {
      const _schemas = z.object({
        appName: z.string().default('MyApp'),
        version: z.number().default(1),
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      type ActualDotPaths = DotPaths<typeof _schemas>;
      type ExpectedDotPaths = 'appName' | 'version' | 'ui' | 'ui.theme';

      expectTypeOf<ActualDotPaths>().toEqualTypeOf<ExpectedDotPaths>();
    });
  });

  describe('Dot Notation & Navigation', () => {
    it('should correctly access individual flags with proper types', () => {
      const schemas = z.object({
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Runtime behavior
      expect(() => scope.flag('ui')).not.toThrow();
      expect(() => scope.flag('ui.theme')).not.toThrow();
      expect(() => scope.flag('ui.fontSize')).not.toThrow();
      expect(scope.flag('ui')).toEqual({
        theme: 'light',
        fontSize: 14,
      });
      expect(scope.flag('ui.theme')).toBe('light');
      expect(scope.flag('ui.fontSize')).toBe(14);

      // Type inference
      expectTypeOf(scope.flag('ui')).toEqualTypeOf<{
        theme: 'light' | 'dark';
        fontSize: number;
      }>();
      expectTypeOf(scope.flag('ui.theme')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(scope.flag('ui.fontSize')).toEqualTypeOf<number>();
    });

    it('should handle nested object properties with correct path types', () => {
      const schemas = z.object({
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
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Runtime behavior
      expect(() => scope.flag('ui.layout.sidebar')).not.toThrow();
      expect(() => scope.flag('ui.layout.grid.columns')).not.toThrow();
      expect(scope.flag('ui.layout.sidebar')).toBe(true);
      expect(scope.flag('ui.layout.grid.columns')).toBe(12);

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

      withSuppressedErrors(() => {
        // @ts-expect-error - invalid paths should be caught
        scope.flag('ui.layout.invalid');
      }, ['[AxiomAI] Invalid flag: "ui.layout.invalid"']);
      withSuppressedErrors(() => {
        // @ts-expect-error - invalid nested property
        scope.flag('ui.layout.grid.invalid');
      }, ['[AxiomAI] Invalid flag: "ui.layout.grid.invalid"']);
    });

    it('should handle invalid paths gracefully at runtime', () => {
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      withSuppressedErrors(() => {
        // @ts-expect-error - type system should catch invalid paths
        scope.flag('ui.invalid');
      }, ['[AxiomAI] Invalid flag: "ui.invalid"']);
      withSuppressedErrors(() => {
        // @ts-expect-error - type system should catch invalid root namespace
        scope.flag('nonexistent.path');
      }, ['[AxiomAI] Invalid flag: "nonexistent.path"']);
    });

    it('should enforce correct type inference', () => {
      const schemas = z.object({
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      expectTypeOf(scope.flag('ui.theme')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(scope.flag('ui.fontSize')).toEqualTypeOf<number>();
    });

    it('should return complete namespace objects with schema defaults', () => {
      const schemas = z.object({
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
      });

      const scope = createAppScope({ flagSchema: schemas });

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

    it('should handle complete namespace objects', () => {
      const schemas = z.object({
        complete: z.object({
          field1: z.string().default('default1'),
          field2: z.number().default(42),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Complete namespace should work without explicit defaults
      expect(scope.flag('complete')).toEqual({
        field1: 'default1',
        field2: 42,
      });

      expectTypeOf(scope.flag('complete')).toEqualTypeOf<{
        field1: string;
        field2: number;
      }>();
    });

    it('should handle nested namespace access with proper type inference', () => {
      const schemas = z.object({
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
            cache: z.object({
              ttl: z.number().default(3600),
              maxSize: z.number().default(1000),
            }),
          }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

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
    });

    it('should handle object-level defaults correctly', () => {
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z
            .object({
              sidebar: z.boolean(),
              width: z.number(),
            })
            .default({
              sidebar: true,
              width: 300,
            }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Individual field access should use object-level defaults when no field defaults
      expect(scope.flag('ui.layout.sidebar')).toBe(true);
      expect(scope.flag('ui.layout.width')).toBe(300);

      // Full object access should use object-level defaults
      expect(scope.flag('ui.layout')).toEqual({
        sidebar: true,
        width: 300,
      });
    });

    it('should handle default at outermost level (default outside)', () => {
      const schemas = z.object({
        deep: z
          .object({
            key1: z.object({
              key2: z.object({
                key3: z.object({
                  key4: z.string(),
                }),
              }),
            }),
          })
          .default({
            key1: {
              key2: {
                key3: {
                  key4: 'foo',
                },
              },
            },
          }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Should extract deeply nested value from outermost default
      expect(scope.flag('deep')).toEqual({ key1: { key2: { key3: { key4: 'foo' } } } });
      expect(scope.flag('deep.key1')).toEqual({ key2: { key3: { key4: 'foo' } } });
      expect(scope.flag('deep.key1.key2')).toEqual({ key3: { key4: 'foo' } });
      expect(scope.flag('deep.key1.key2.key3')).toEqual({ key4: 'foo' });
      expect(scope.flag('deep.key1.key2.key3.key4')).toBe('foo');
    });

    it('should handle default at innermost level (default inside)', () => {
      const schemas = z.object({
        deep: z.object({
          key1: z.object({
            key2: z.object({
              key3: z.object({
                key4: z.string().default('foo'),
              }),
            }),
          }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Should extract leaf default from deeply nested structure
      expect(scope.flag('deep')).toEqual({ key1: { key2: { key3: { key4: 'foo' } } } });
      expect(scope.flag('deep.key1')).toEqual({ key2: { key3: { key4: 'foo' } } });
      expect(scope.flag('deep.key1.key2')).toEqual({ key3: { key4: 'foo' } });
      expect(scope.flag('deep.key1.key2.key3')).toEqual({ key4: 'foo' });
      expect(scope.flag('deep.key1.key2.key3.key4')).toBe('foo');
    });

    it('should handle default at middle level (default in the middle)', () => {
      const schemas = z.object({
        deep: z.object({
          key1: z.object({
            key2: z
              .object({
                key3: z.object({
                  key4: z.string(),
                }),
              })
              .default({ key3: { key4: 'foo' } }),
          }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Should extract from middle-level object default
      expect(scope.flag('deep')).toEqual({ key1: { key2: { key3: { key4: 'foo' } } } });
      expect(scope.flag('deep.key1')).toEqual({ key2: { key3: { key4: 'foo' } } });
      expect(scope.flag('deep.key1.key2')).toEqual({ key3: { key4: 'foo' } });
      expect(scope.flag('deep.key1.key2.key3')).toEqual({ key4: 'foo' });
      expect(scope.flag('deep.key1.key2.key3.key4')).toBe('foo');
    });

    it('should handle empty objects with no fields', () => {
      const schemas = z.object({
        config: z.object({
          empty: z.object({}),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Empty object should return empty object (not undefined)
      expect(scope.flag('config.empty')).toEqual({});
      expect(scope.flag('config')).toEqual({ empty: {} });
    });

    it('should handle nested empty objects', () => {
      const schemas = z.object({
        app: z.object({
          level1: z.object({
            level2: z.object({
              empty: z.object({}),
            }),
          }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      expect(scope.flag('app.level1.level2.empty')).toEqual({});
      expect(scope.flag('app.level1.level2')).toEqual({ empty: {} });
      expect(scope.flag('app.level1')).toEqual({ level2: { empty: {} } });
    });

    it('should handle mixed empty and non-empty objects', () => {
      const schemas = z.object({
        mixed: z.object({
          empty: z.object({}),
          nonEmpty: z.object({
            value: z.string().default('test'),
          }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      expect(scope.flag('mixed.empty')).toEqual({});
      expect(scope.flag('mixed.nonEmpty')).toEqual({ value: 'test' });
      expect(scope.flag('mixed')).toEqual({
        empty: {},
        nonEmpty: { value: 'test' },
      });
    });

    it('should handle empty object with default', () => {
      const schemas = z.object({
        config: z.object({
          emptyWithDefault: z.object({}).default({}),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      expect(scope.flag('config.emptyWithDefault')).toEqual({});
    });
  });

  describe('Validation & Error Handling', () => {
    it('should validate flag types strictly', () => {
      const flagSchema = z
        .object({
          num: z.number().default(42),
        })
        .strict();

      const appScope = createAppScope({ flagSchema });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const num = appScope.flag('num');
      expect(num).toBe(42);
      expect(consoleSpy).not.toHaveBeenCalled();

      const result = (appScope as any).flag('invalidKey');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag'));
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should validate fact types strictly', () => {
      const factSchema = z
        .object({
          duration: z.number(),
        })
        .strict();

      const appScope = createAppScope({ flagSchema: z.object({}), factSchema });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      appScope.fact('duration', 123.45);
      expect(consoleSpy).not.toHaveBeenCalled();

      appScope.fact('duration', 'not a number' as any);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid fact'));
      consoleSpy.mockRestore();
    });

    it('should log an error when recording a fact that is not in the schema (but still record it)', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const factSchema = z.object({
        dbVersion: z.string(),
      });

      const scope = createAppScope({
        flagSchema: z.object({ ui: z.object({}) }),
        factSchema,
      });

      // Record a fact that's not in the schema
      expect(() => scope.fact('unknownFact' as any, 123)).not.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toMatch(/Invalid fact/);

      errorSpy.mockRestore();
    });

    describe('Final Value Validation', () => {
      let errorSpy: any;

      beforeEach(() => {
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        errorSpy.mockRestore();
      });

      it('should validate and coerce valid values', () => {
        const flagSchema = z.object({
          ui: z.object({
            count: z.number().default(10),
            enabled: z.boolean().default(false),
          }),
        });

        // Set valid overrides before creating the scope (CLI validation happens at creation)
        setGlobalFlagOverrides({ 'ui.count': 42, 'ui.enabled': true });
        const scope = createAppScope({ flagSchema });

        expect(scope.flag('ui.count')).toBe(42);
        expect(scope.flag('ui.enabled')).toBe(true);

        expect(errorSpy).not.toHaveBeenCalled();
      });

      it('should reject invalid CLI override values and return undefined', () => {
        const flagSchema = z.object({
          ui: z.object({
            theme: z.enum(['light', 'dark']).default('dark'),
            count: z.number().default(10),
          }),
        });

        const scope = createAppScope({ flagSchema });

        // Invalid enum value from CLI
        setGlobalFlagOverrides({ 'ui.theme': 'invalid-theme' });
        expect(scope.flag('ui.theme')).toBe('invalid-theme');
        expect(errorSpy).toHaveBeenCalledWith(
          '[AxiomAI] Invalid flag: "ui.theme" - value does not match schema',
        );

        errorSpy.mockClear();
        clearGlobalFlagOverrides();

        // Invalid number value from CLI
        setGlobalFlagOverrides({ 'ui.count': 'not-a-number' });
        expect(scope.flag('ui.count')).toBe('not-a-number');
        expect(errorSpy).toHaveBeenCalledWith(
          '[AxiomAI] Invalid flag: "ui.count" - value does not match schema',
        );
      });

      it('should handle context override validation', () => {
        const flagSchema = z.object({
          config: z.object({
            mode: z.enum(['dev', 'prod']).default('dev'),
          }),
        });

        const scope = createAppScope({ flagSchema });

        withEvalContext({}, () => {
          // Valid context override - using withFlags instead since overrideFlags is for internal context updates
          const result1 = scope.withFlags({ 'config.mode': 'prod' }, () => {
            return scope.flag('config.mode');
          });
          expect(result1).toBe('prod');
          expect(errorSpy).not.toHaveBeenCalled();

          // Invalid context override
          const result2 = scope.withFlags({ 'config.mode': 'invalid' as any }, () => {
            return scope.flag('config.mode');
          });
          expect(result2).toBe('invalid');
          expect(errorSpy).toHaveBeenCalledWith(
            '[AxiomAI] Invalid flag: "config.mode" - value does not match schema',
          );
        });
      });

      it('should validate namespace objects correctly', () => {
        const flagSchema = z.object({
          ui: z
            .object({
              theme: z.string().default('dark'),
              fontSize: z.number().default(14),
            })
            .default({ theme: 'dark', fontSize: 14 }),
        });

        const scope = createAppScope({ flagSchema });

        withEvalContext({}, () => {
          // Valid namespace object should work
          const validUi = { theme: 'light', fontSize: 16 };
          const result1 = scope.withFlags({ ui: validUi }, () => {
            return scope.flag('ui');
          });
          expect(result1).toEqual(validUi);

          // Invalid namespace object should fail
          const invalidUi = { theme: 'invalid', fontSize: 'not-a-number' } as any;
          const result2 = scope.withFlags({ ui: invalidUi }, () => {
            return scope.flag('ui');
          });
          expect(result2).toEqual({
            fontSize: 'not-a-number',
            theme: 'invalid',
          });
          expect(errorSpy).toHaveBeenCalledWith(
            '[AxiomAI] Invalid flag: "ui" - value does not match schema',
          );
        });
      });

      it('should handle complex nested validation scenarios', () => {
        const flagSchema = z.object({
          app: z.object({
            features: z.object({
              auth: z.object({
                provider: z.enum(['oauth', 'saml']).default('oauth'),
                timeout: z.number().default(30),
              }),
            }),
          }),
        });

        // Valid nested values - set before creating scope
        setGlobalFlagOverrides({
          'app.features.auth.provider': 'saml',
          'app.features.auth.timeout': 60,
        });

        const scope = createAppScope({ flagSchema });

        expect(scope.flag('app.features.auth.provider')).toBe('saml');
        expect(scope.flag('app.features.auth.timeout')).toBe(60);

        // Clear for next part of test
        clearGlobalFlagOverrides();

        // Test that schema defaults work without validation errors
        expect(scope.flag('app.features.auth.provider')).toBe('oauth');
        expect(scope.flag('app.features.auth.timeout')).toBe(30);

        expect(errorSpy).not.toHaveBeenCalled();
      });
    });

    describe('unit tests (mocked validation)', () => {
      let validateSpy: any;

      beforeEach(async () => {
        // Create a spy on the actual function
        const validateModule = await import('../../src/validate-flags');
        validateSpy = vi.spyOn(validateModule, 'validateCliFlags').mockImplementation(() => {});
      });

      afterEach(() => {
        validateSpy?.mockRestore();
      });

      it('should call validateCliFlags when flagSchema provided', () => {
        const flagSchema = z.object({
          foo: z.string().default('test'),
          bar: z.number().default(42),
        });

        createAppScope({ flagSchema });

        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(flagSchema);
      });

      it('should call validateCliFlags only once even with factSchema', () => {
        const flagSchema = z.object({ test: z.string().default('test') });
        const factSchema = z.object({ metric: z.number() });

        createAppScope({ flagSchema, factSchema });

        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(flagSchema);
      });
    });

    describe('integration tests (real validation)', () => {
      let exitSpy: any;
      let errorSpy: any;

      beforeEach(() => {
        // Spy on process.exit but throw instead of actually exiting
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
          throw new Error(`process.exit:${code}`);
        }) as never);

        // Spy on console.error to capture validation messages
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        exitSpy.mockRestore();
        errorSpy.mockRestore();
      });

      it('should pass validation with valid CLI flags', () => {
        const flagSchema = z.object({
          strategy: z.enum(['fast', 'slow']).default('fast'),
          count: z.number().default(1),
        });

        setGlobalFlagOverrides({ strategy: 'slow', count: 5 });

        const { flag } = createAppScope({ flagSchema });

        expect(flag('strategy')).toBe('slow');
        expect(flag('count')).toBe(5);
        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('should pass validation with no CLI flags (uses schema defaults)', () => {
        const flagSchema = z.object({
          strategy: z.enum(['fast', 'slow']).default('fast'),
          timeout: z.number().default(30),
        });

        // No CLI flags set
        const { flag } = createAppScope({ flagSchema });

        expect(flag('strategy')).toBe('fast');
        expect(flag('timeout')).toBe(30);
        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('should fail validation with invalid flag value and exit process', () => {
        const flagSchema = z.object({
          strategy: z.enum(['fast', 'slow']).default('fast'),
        });

        setGlobalFlagOverrides({ strategy: 'invalid' });

        expect(() => {
          createAppScope({ flagSchema });
        }).toThrow('process.exit:1');

        expect(errorSpy).toHaveBeenCalledWith('❌ Invalid CLI flags:');
      });

      it('should fail validation with unknown flag and exit process', () => {
        const flagSchema = z.object({
          strategy: z.string().default('fast'),
        });

        setGlobalFlagOverrides({ unknownFlag: 'value' });

        expect(() => {
          createAppScope({ flagSchema });
        }).toThrow('process.exit:1');

        expect(errorSpy).toHaveBeenCalledWith('❌ Invalid CLI flags:');
      });

      it('should fail validation with type mismatch and exit process', () => {
        const flagSchema = z.object({
          count: z.number().default(1),
        });

        setGlobalFlagOverrides({ count: 'not-a-number' });

        expect(() => {
          createAppScope({ flagSchema });
        }).toThrow('process.exit:1');

        expect(errorSpy).toHaveBeenCalledWith('❌ Invalid CLI flags:');
      });

      it('should handle partial CLI flag overrides correctly', () => {
        const flagSchema = z.object({
          strategy: z.enum(['fast', 'slow']).default('fast'),
          count: z.number().default(10),
          name: z.string().default('test'),
        });

        // Only override some flags
        setGlobalFlagOverrides({ strategy: 'slow' });

        const { flag } = createAppScope({ flagSchema });

        expect(flag('strategy')).toBe('slow'); // overridden
        expect(flag('count')).toBe(10); // schema default
        expect(flag('name')).toBe('test'); // schema default
        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('should work correctly with multiple createAppScope calls', () => {
        // Use compatible schemas that only reference flags they define
        const flagSchema1 = z.object({ flag1: z.string().default('default1') });
        const flagSchema2 = z.object({ flag1: z.string().default('default1') }); // Same schema

        setGlobalFlagOverrides({ flag1: 'override1' });

        const scope1 = createAppScope({ flagSchema: flagSchema1 });
        const scope2 = createAppScope({ flagSchema: flagSchema2 });

        expect(scope1.flag('flag1')).toBe('override1');
        expect(scope2.flag('flag1')).toBe('override1');
        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('should pass validation with valid CLI flags using dot notation', () => {
        const flagSchema = z.object({
          ui: z.object({
            theme: z.enum(['light', 'dark']).default('dark'),
            fontSize: z.number().default(14),
          }),
        });

        setGlobalFlagOverrides({ 'ui.theme': 'light', 'ui.fontSize': 16 });

        const { flag } = createAppScope({ flagSchema });

        expect(flag('ui.theme')).toBe('light');
        expect(flag('ui.fontSize')).toBe(16);
        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('should fail validation with invalid flag value and exit process (dot notation)', () => {
        const flagSchema = z.object({
          ui: z.object({
            theme: z.enum(['light', 'dark']).default('dark'),
          }),
        });

        setGlobalFlagOverrides({ 'ui.theme': 'invalid' });

        expect(() => {
          createAppScope({ flagSchema });
        }).toThrow('process.exit:1');

        expect(errorSpy).toHaveBeenCalledWith('❌ Invalid CLI flags:');
      });

      it('should fail validation with unknown flag path and exit process', () => {
        const flagSchema = z.object({
          ui: z.object({
            theme: z.string().default('dark'),
          }),
        });

        setGlobalFlagOverrides({ 'ui.unknownFlag': 'value' });

        expect(() => {
          createAppScope({ flagSchema });
        }).toThrow('process.exit:1');

        expect(errorSpy).toHaveBeenCalledWith('❌ Invalid CLI flags:');
      });

      it('should fail validation with type mismatch and exit process (dot notation)', () => {
        const flagSchema = z.object({
          config: z.object({
            count: z.number().default(1),
          }),
        });

        setGlobalFlagOverrides({ 'config.count': 'not-a-number' });

        expect(() => {
          createAppScope({ flagSchema });
        }).toThrow('process.exit:1');

        expect(errorSpy).toHaveBeenCalledWith('❌ Invalid CLI flags:');
      });

      it('should handle partial CLI flag overrides correctly with dot notation', () => {
        const flagSchema = z.object({
          ui: z.object({
            theme: z.enum(['light', 'dark']).default('dark'),
            fontSize: z.number().default(14),
          }),
          config: z.object({
            name: z.string().default('test'),
          }),
        });

        // Only override some flags
        setGlobalFlagOverrides({ 'ui.theme': 'light' });

        const { flag } = createAppScope({ flagSchema });

        expect(flag('ui.theme')).toBe('light'); // overridden
        expect(flag('ui.fontSize')).toBe(14); // schema default
        expect(flag('config.name')).toBe('test'); // schema default
        expect(exitSpy).not.toHaveBeenCalled();
      });

      it('should work correctly with multiple createAppScope calls (dot notation)', () => {
        // Use compatible schemas that only reference flags they define
        const flagSchema1 = z.object({
          config: z.object({
            flag1: z.string().default('default1'),
          }),
        });
        const flagSchema2 = z.object({
          config: z.object({
            flag1: z.string().default('default1'),
          }),
        }); // Same schema

        setGlobalFlagOverrides({ 'config.flag1': 'override1' });

        const scope1 = createAppScope({ flagSchema: flagSchema1 });
        const scope2 = createAppScope({ flagSchema: flagSchema2 });

        expect(scope1.flag('config.flag1')).toBe('override1');
        expect(scope2.flag('config.flag1')).toBe('override1');
        expect(exitSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Developer Experience', () => {
    it('should provide autocomplete for namespace keys', () => {
      const _schemas = z.object({
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
      });

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

    it('should provide autocomplete and type-safety for fact keys', () => {
      const factSchema = z.object({
        dbVersion: z.string(),
        retries: z.number(),
        isBeta: z.boolean(),
        userCount: z.number(),
        deploymentRegion: z.string(),
      });

      const scope = createAppScope({
        flagSchema: z.object({}),
        factSchema,
      });

      // ----- 1. Exact key union ----------------------------------------------
      type ActualFactKeys = Parameters<typeof scope.fact>[0];
      type ExpectedFactKeys = 'dbVersion' | 'retries' | 'isBeta' | 'userCount' | 'deploymentRegion';

      expectTypeOf<ActualFactKeys>().toEqualTypeOf<ExpectedFactKeys>();

      // ----- 2. Value coupling check ------------------------------------------
      scope.fact('dbVersion', '1.2.3'); // ok
      scope.fact('retries', 5); // ok
      scope.fact('isBeta', true); // ok
      scope.fact('userCount', 1000); // ok
      scope.fact('deploymentRegion', 'us-east-1'); // ok

      withSuppressedErrors(
        (_errorSpy) => {
          // @ts-expect-error – invalid key
          scope.fact('unknownKey', 'whatever');
        },
        ['[AxiomAI] Invalid fact: "unknownKey"'],
      );

      // @ts-expect-error – wrong value type for key
      scope.fact('dbVersion', 42);
      // @ts-expect-error – wrong value type for key
      scope.fact('retries', 'five');
      // @ts-expect-error – wrong value type for key
      scope.fact('isBeta', 'yes');
    });

    it('should record facts', () => {
      const scope = createAppScope({
        flagSchema: z.object({}),
        factSchema: z.object({
          dbVersion: z.string(),
        }),
      });

      void scope.fact('dbVersion', '1.2.3');
    });

    describe('pickFlags', () => {
      it('should handle typical cases', () => {
        const flagSchema = z.object({
          ui: z.object({
            theme: z.string().default('dark'),
          }),
          something: z.object({
            else: z.number().default(123),
          }),
        });

        const { pickFlags } = createAppScope({ flagSchema });

        expect(pickFlags('ui')).toEqual(['ui']);
        expect(pickFlags(['ui'])).toEqual(['ui']);
        expect(pickFlags('ui', 'something')).toEqual(['ui', 'something']);
        expect(pickFlags(['ui', 'something'])).toEqual(['ui', 'something']);
        expect(pickFlags('ui', 'ui.theme', 'something', 'something.else')).toEqual([
          'ui',
          'ui.theme',
          'something',
          'something.else',
        ]);
      });
    });

    describe('overrideFlags', () => {
      it('should allow typed flag overrides', () => {
        withEvalContext({}, () => {
          const schemas = z.object({
            ui: z.object({
              theme: z.enum(['light', 'dark']).default('light'),
              fontSize: z.number().default(14),
            }),
          });

          const scope = createAppScope({ flagSchema: schemas });

          // Before override
          expect(scope.flag('ui.theme')).toBe('light');
          expect(scope.flag('ui.fontSize')).toBe(14);

          // Apply typed overrides
          scope.overrideFlags({
            'ui.theme': 'dark',
            'ui.fontSize': 16,
          });

          // After override
          expect(scope.flag('ui.theme')).toBe('dark');
          expect(scope.flag('ui.fontSize')).toBe(16);

          // Type checking
          expectTypeOf(scope.overrideFlags).parameter(0).toEqualTypeOf<{
            ui?: { theme: 'light' | 'dark'; fontSize: number };
            'ui.theme'?: 'light' | 'dark';
            'ui.fontSize'?: number;
          }>();

          // @ts-expect-error - invalid path should be caught
          scope.overrideFlags({ 'nonexistent.path': 'value' });
          // @ts-expect-error - wrong type should be caught
          scope.overrideFlags({ 'ui.theme': 123 });
        });
      });

      it('should handle partial overrides', () => {
        withEvalContext({}, () => {
          const schemas = z.object({
            ui: z.object({
              theme: z.enum(['light', 'dark']).default('light'),
              fontSize: z.number().default(14),
            }),
            config: z.object({
              name: z.string().default('App'),
            }),
          });

          const scope = createAppScope({ flagSchema: schemas });

          // Override only some flags
          scope.overrideFlags({
            'ui.theme': 'dark',
            'config.name': 'TestApp',
          });

          expect(scope.flag('ui.theme')).toBe('dark');
          expect(scope.flag('ui.fontSize')).toBe(14); // unchanged
          expect(scope.flag('config.name')).toBe('TestApp');
        });
      });

      it('should work with valid paths only', () => {
        withEvalContext({}, () => {
          const scope = createAppScope({
            flagSchema: z.object({
              ui: z.object({
                theme: z.string().default('light'),
              }),
            }),
          });

          expect(() => {
            scope.overrideFlags({ 'ui.theme': 'dark' });
          }).not.toThrow();

          expect(scope.flag('ui.theme')).toBe('dark');
        });
      });
    });

    describe('withFlags', () => {
      it('should temporarily override flags with automatic restore', () => {
        withEvalContext({}, () => {
          const schemas = z.object({
            ui: z.object({
              theme: z.enum(['light', 'dark']).default('light'),
              fontSize: z.number().default(14),
            }),
          });

          const scope = createAppScope({ flagSchema: schemas });

          // Before override
          expect(scope.flag('ui.theme')).toBe('light');
          expect(scope.flag('ui.fontSize')).toBe(14);

          const result = scope.withFlags(
            {
              'ui.theme': 'dark',
              'ui.fontSize': 16,
            },
            () => {
              // Inside override scope
              expect(scope.flag('ui.theme')).toBe('dark');
              expect(scope.flag('ui.fontSize')).toBe(16);
              return 'test-result';
            },
          );

          // After override - should be restored
          expect(scope.flag('ui.theme')).toBe('light');
          expect(scope.flag('ui.fontSize')).toBe(14);
          expect(result).toBe('test-result');

          // Type checking
          expectTypeOf(scope.withFlags).parameter(0).toEqualTypeOf<{
            ui?: { theme: 'light' | 'dark'; fontSize: number };
            'ui.theme'?: 'light' | 'dark';
            'ui.fontSize'?: number;
          }>();

          // @ts-expect-error - invalid path should be caught
          scope.withFlags({ 'nonexistent.path': 'value' }, () => {});
          // @ts-expect-error - wrong type should be caught
          scope.withFlags({ 'ui.theme': 123 }, () => {});
        });
      });

      it('should restore flags even if function throws', () => {
        withEvalContext({}, () => {
          const schemas = z.object({
            ui: z.object({
              theme: z.enum(['light', 'dark']).default('light'),
            }),
          });

          const scope = createAppScope({ flagSchema: schemas });

          // Before override
          expect(scope.flag('ui.theme')).toBe('light');

          expect(() => {
            scope.withFlags({ 'ui.theme': 'dark' }, () => {
              expect(scope.flag('ui.theme')).toBe('dark');
              throw new Error('Test error');
            });
          }).toThrow('Test error');

          // Should still be restored after error
          expect(scope.flag('ui.theme')).toBe('light');
        });
      });

      it('should return function result with correct type inference', () => {
        withEvalContext({}, () => {
          const flagSchema = z.object({
            ui: z.object({
              theme: z.string().default('light'),
            }),
          });

          const scope = createAppScope({ flagSchema });

          const stringResult = scope.withFlags({ 'ui.theme': 'dark' }, () => 'string');
          const numberResult = scope.withFlags({ 'ui.theme': 'dark' }, () => 42);
          const objectResult = scope.withFlags({ 'ui.theme': 'dark' }, () => ({ test: true }));

          expectTypeOf(stringResult).toEqualTypeOf<string>();
          expectTypeOf(numberResult).toEqualTypeOf<number>();
          expectTypeOf(objectResult).toEqualTypeOf<{ test: boolean }>();

          expect(stringResult).toBe('string');
          expect(numberResult).toBe(42);
          expect(objectResult).toEqual({ test: true });
        });
      });
    });
  });

  describe('isPickedFlag', () => {
    it('should allow all flags when pickedFlags are undefined', () => {
      expect(isPickedFlag('ui.theme', undefined)).toBe(true);
      expect(isPickedFlag('ui.theme')).toBe(true);
    });

    it('should allow all flags when none are picked', () => {
      expect(isPickedFlag('ui.theme', [])).toBe(true);
    });

    it('should allow exact matches', () => {
      expect(isPickedFlag('ui', ['ui'])).toBe(true);
    });

    it('should allow exact matches with dots', () => {
      expect(isPickedFlag('ui.theme', ['ui.theme'])).toBe(true);
    });

    it('should allow children of exact matches', () => {
      expect(isPickedFlag('ui.theme.color', ['ui.theme'])).toBe(true);
      expect(isPickedFlag('ui.theme.color.shade', ['ui.theme'])).toBe(true);
    });

    it('should not allow non-matching flags', () => {
      expect(isPickedFlag('feature', ['ui'])).toBe(false);
    });

    it('should not allow partial namespace matches', () => {
      expect(isPickedFlag('ui', ['ui.theme'])).toBe(false);
    });

    it('should not allow partial string matches', () => {
      expect(isPickedFlag('foobar', ['foo'])).toBe(false);
    });
  });

  describe('Type-Level Tests', () => {
    it('flags with defaults in schema should work', () => {
      const flagSchema = z.object({
        foo: z.string().default('foo'),
        bar: z.string().default('bar'),
      });
      const { flag } = createAppScope({ flagSchema });

      const foo = flag('foo');
      const bar = flag('bar');

      expectTypeOf(foo).toEqualTypeOf<string>();
      expectTypeOf(bar).toEqualTypeOf<string>();
    });

    it('should work for object types with defaults', () => {
      const flagSchema = z.object({
        obj: z.object({
          foo: z.string().default('default-foo'),
        }),
      });
      const { flag } = createAppScope({ flagSchema });

      const obj = flag('obj');

      expectTypeOf(obj).toEqualTypeOf<{ foo: string }>();
    });
  });

  describe('Fact Dot Notation Support', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should support nested fact schema with dot notation', () => {
      const factSchema = z.object({
        user: z.object({
          action: z.string(),
          duration: z.number(),
        }),
        system: z.object({
          memory: z.object({
            used: z.number(),
            total: z.number(),
          }),
        }),
      });

      const { fact } = createAppScope({
        flagSchema: z.object({ ui: z.object({}) }),
        factSchema,
      });

      // Should support dot notation paths
      expect(() => fact('system', { memory: { used: 8192, total: 16384 } })).not.toThrow();
      expect(() => fact('system.memory', { used: 8192, total: 16384 })).not.toThrow();
      expect(() => fact('system.memory.used', 8192)).not.toThrow();
      expect(() => fact('system.memory.total', 16384)).not.toThrow();
    });

    it('should validate nested paths and show errors for invalid paths', () => {
      const factSchema = z.object({
        user: z.object({
          action: z.string(),
        }),
      });

      const { fact } = createAppScope({
        flagSchema: z.object({ ui: z.object({}) }),
        factSchema,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Valid path - no error
      fact('user.action', 'click');
      expect(consoleSpy).not.toHaveBeenCalled();

      // Invalid path - should log error (using 'as any' to bypass TypeScript checking for testing purposes)
      fact('user.nonexistent' as any, 'value');
      expect(consoleSpy).toHaveBeenCalledWith('[AxiomAI] Invalid fact: "user.nonexistent"');

      // Invalid namespace - should log error
      fact('invalid.action' as any, 'value');
      expect(consoleSpy).toHaveBeenCalledWith('[AxiomAI] Invalid fact: "invalid.action"');

      consoleSpy.mockRestore();
    });

    it('should validate types with nested schemas', () => {
      const factSchema = z.object({
        user: z.object({
          action: z.string(),
          count: z.number(),
        }),
      });

      const { fact } = createAppScope({
        flagSchema: z.object({ ui: z.object({}) }),
        factSchema,
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fact('user.action', 123 as any);
      expect(consoleSpy).toHaveBeenCalledWith('[AxiomAI] Invalid fact: "user.action"');

      fact('user.count', 'not-a-number' as any);
      expect(consoleSpy).toHaveBeenCalledWith('[AxiomAI] Invalid fact: "user.count"');

      consoleSpy.mockRestore();
    });

    it('should work with deeply nested schemas', () => {
      const factSchema = z.object({
        app: z.object({
          ui: z.object({
            theme: z.object({
              colors: z.object({
                primary: z.string(),
                secondary: z.string(),
              }),
            }),
          }),
        }),
      });

      const { fact } = createAppScope({
        flagSchema: z.object({ ui: z.object({}) }),
        factSchema,
      });

      expect(() => fact('app.ui.theme.colors.primary', '#ff0000')).not.toThrow();
      expect(() => fact('app.ui.theme.colors.secondary', '#00ff00')).not.toThrow();
    });
  });
});
