import { describe, expect, it, expectTypeOf, vi } from 'vitest';
import { z } from 'zod';
import { pickCapabilities } from '../src/evals/pick-capabilities';
import { createAppScope } from '../src/app-scope';

describe('pickNamespaces', () => {
  describe('basic functionality', () => {
    it('should pick single namespace from schema', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
        }),
        api: z.object({
          baseUrl: z.string().default('https://api.example.com'),
          timeout: z.number().default(5000),
        }),
      });

      const result = pickCapabilities(schema, ['ui']);
      const parsed = result.parse({ ui: { theme: 'light', fontSize: 16 } });

      expect(parsed).toEqual({
        ui: { theme: 'light', fontSize: 16 },
      });

      // Should not contain api namespace
      expect('api' in parsed).toBe(false);
    });

    it('should pick multiple namespaces from schema', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        api: z.object({
          baseUrl: z.string().default('https://api.example.com'),
        }),
        features: z.object({
          auth: z.boolean().default(true),
        }),
      });

      const result = pickCapabilities(schema, ['ui', 'api']);
      const parsed = result.parse({
        ui: { theme: 'light' },
        api: { baseUrl: 'https://custom.api.com' },
      });

      expect(parsed).toEqual({
        ui: { theme: 'light' },
        api: { baseUrl: 'https://custom.api.com' },
      });

      // Should not contain features namespace
      expect('features' in parsed).toBe(false);
    });

    it('should warn on unknown keys at runtime', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      pickCapabilities(schema, ['ui', 'unknown'] as any);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown namespace keys: unknown'),
      );

      warnSpy.mockRestore();
    });
  });

  describe('type inference', () => {
    it('should infer correct types for multiple picked namespaces', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        api: z.object({
          baseUrl: z.string().default('https://api.example.com'),
        }),
        features: z.object({
          auth: z.boolean().default(true),
        }),
      });

      const _result = pickCapabilities(schema, ['ui', 'features'] as const);

      type ParsedResult = z.infer<typeof _result>;
      expectTypeOf<ParsedResult>().toEqualTypeOf<{
        ui: { theme: string };
        features: { auth: boolean };
      }>();

      // Should not include api in the type
      expectTypeOf<ParsedResult>().not.toHaveProperty('api');
    });
  });

  describe('integration with createAppScope/eval', () => {
    it('should work with Eval function for namespace-specific flag schemas', () => {
      const fullSchema = z.object({
        ui: z.object({
          theme: z.enum(['light', 'dark']).default('dark'),
          fontSize: z.number().default(14),
        }),
        api: z.object({
          baseUrl: z.string().default('https://api.example.com'),
          timeout: z.number().default(5000),
        }),
        features: z.object({
          auth: z.boolean().default(true),
          cache: z.boolean().default(false),
        }),
      });

      // Pick only ui and features namespaces
      const pickedSchema = pickCapabilities(fullSchema, ['ui', 'features']);

      // Should work with createAppScope2
      const scope = createAppScope({ flagSchema: pickedSchema });

      expect(scope.flag('ui.theme')).toBe('dark');
      expect(scope.flag('features.auth')).toBe(true);

      // Type checking - these should work
      expectTypeOf(scope.flag('ui.theme')).toEqualTypeOf<'light' | 'dark'>();
      expectTypeOf(scope.flag('features.auth')).toEqualTypeOf<boolean>();

      // These should be caught at compile time
      // @ts-expect-error - api namespace not picked
      scope.flag('api.baseUrl');
      // @ts-expect-error - api namespace not picked
      scope.flag('api.timeout');
    });
  });

  describe('edge cases', () => {
    it('should handle empty key array', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const result = pickCapabilities(schema, [] as const);
      const parsed = result.parse({});

      expect(parsed).toEqual({});
    });

    it('should handle schemas with complex nested structures', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z.object({
            sidebar: z.boolean().default(true),
            grid: z.object({
              columns: z.number().default(12),
            }),
          }),
        }),
        api: z.object({
          baseUrl: z.string().default('https://api.example.com'),
        }),
      });

      const result = pickCapabilities(schema, ['ui'] as const);
      const parsed = result.parse({
        ui: {
          theme: 'light',
          layout: {
            sidebar: false,
            grid: {
              columns: 8,
            },
          },
        },
      });

      expect(parsed).toEqual({
        ui: {
          theme: 'light',
          layout: {
            sidebar: false,
            grid: {
              columns: 8,
            },
          },
        },
      });
    });
  });
});
