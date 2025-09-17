import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { expectTypeOf } from 'vitest';
import { createAppScope, isPickedFlag, type DotPaths } from '../../src/app-scope';
import {
  setGlobalFlagOverrides,
  clearGlobalFlagOverrides,
} from '../../src/evals/context/global-flags';
import { withEvalContext } from '../../src/evals/context/storage';

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
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      expect(() => scope.flag('ui.theme')).not.toThrow();
      expect(() => scope.flag('ui.theme', 'dark')).not.toThrow();
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

    it('should not be allowed to call without flagSchema', () => {
      // @ts-expect-error
      const _appScope = createAppScope();
      // @ts-expect-error
      const _appScope2 = createAppScope({ factSchema: z.object({}) });
    });
  });

  describe('Schema Defaults & Type System', () => {
    it('should use schema defaults and require all defaults to be in schema', () => {
      const flagSchema = z.object({
        num: z.number().default(1),
        str: z.string().default('schema'),
        required: z.string().default('required-default'), // All fields must have defaults in schema
      });

      const appScope = createAppScope({ flagSchema });

      // Should get schema default values - no second parameter allowed with schemas
      const temp = appScope.flag('num');
      expect(temp).toBe(1);

      const str = appScope.flag('str');
      expect(str).toBe('schema');

      const req = appScope.flag('required');
      expect(req).toBe('required-default');
    });

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
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(12),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Explicit defaults should override schema defaults
      expect(scope.flag('ui.theme', 'light')).toBe('light');
      expect(scope.flag('ui.fontSize', 16)).toBe(16);

      // But schema defaults should still work when no explicit default
      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('ui.fontSize')).toBe(12);
    });

    it('should handle fields without schema defaults', () => {
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number(), // no default
          layout: z.object({
            sidebar: z.boolean().default(true),
            width: z.number(), // no default
          }),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

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

      // With explicit defaults
      expect(scope.flag('appName', 'CustomApp')).toBe('CustomApp');
      expect(scope.flag('version', 2)).toBe(2);
      expect(scope.flag('isEnabled', true)).toBe(true);
      expect(scope.flag('mode', 'prod')).toBe('prod');

      // Type inference
      expectTypeOf(scope.flag('appName')).toEqualTypeOf<string>();
      expectTypeOf(scope.flag('version')).toEqualTypeOf<number>();
      expectTypeOf(scope.flag('isEnabled')).toEqualTypeOf<boolean>();
      expectTypeOf(scope.flag('mode')).toEqualTypeOf<'dev' | 'prod'>();
    });

    it('should handle primitive schemas without defaults', () => {
      const schemas = z.object({
        title: z.string(),
        count: z.number(),
        active: z.boolean(),
      });

      const scope = createAppScope({ flagSchema: schemas });

      // Without defaults, should require explicit fallback
      expect(scope.flag('title', 'Default Title')).toBe('Default Title');
      expect(scope.flag('count', 42)).toBe(42);
      expect(scope.flag('active', true)).toBe(true);

      // Without explicit fallback, should return undefined
      expect((scope.flag as any)('title')).toBeUndefined();
      expect((scope.flag as any)('count')).toBeUndefined();
      expect((scope.flag as any)('active')).toBeUndefined();
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
      const schemas = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

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
      const schemas = z.object({
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('light'),
          fontSize: z.number().default(14),
        }),
      });

      const scope = createAppScope({ flagSchema: schemas });

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

    it('should handle namespaces requiring explicit defaults due to incomplete schema defaults', () => {
      const schemas = z.object({
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
          foo: z.string(),
          bar: z.number().default(42),
        });

        createAppScope({ flagSchema });

        expect(validateSpy).toHaveBeenCalledTimes(1);
        expect(validateSpy).toHaveBeenCalledWith(flagSchema);
      });

      it('should call validateCliFlags only once even with factSchema', () => {
        const flagSchema = z.object({ test: z.string() });
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

      // @ts-expect-error – invalid key
      scope.fact('unknownKey', 'whatever');

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
          const schemas = z.object({
            ui: z.object({
              theme: z.string().default('light'),
            }),
          });

          const scope = createAppScope({ flagSchema: schemas });

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
    it('basic type', () => {
      const flagSchema = z.object({ foo: z.string() });
      const { flag } = createAppScope({ flagSchema });

      const f = flag('foo', 'foo-value');

      expectTypeOf(f).toEqualTypeOf<string>();
    });

    it('should require flag value if the schema does not have one', () => {
      const flagSchema = z.object({ foo: z.string() });
      const { flag } = createAppScope({ flagSchema });

      // This should be valid with v2 - it will return the value with a required default parameter
      const f = flag('foo', 'default-value');

      expectTypeOf(f).toEqualTypeOf<string>();
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
});
