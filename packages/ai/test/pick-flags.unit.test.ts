import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../src/app-scope';
import {
  setGlobalFlagOverrides,
  clearGlobalFlagOverrides,
} from '../src/evals/context/global-flags';
import { withEvalContext } from '../src/evals/context/storage';

// TODO: BEFORE MERGE - needed?
describe('pickFlags functionality', () => {
  beforeEach(() => {
    clearGlobalFlagOverrides();
  });

  afterEach(() => {
    clearGlobalFlagOverrides();
  });

  describe('happy path - basic pickFlags functionality', () => {
    it('should pick single namespace and allow flag resolution', () => {
      // Create a comprehensive flag schema with multiple namespaces
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
          temperature: z.number().default(0.7),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
          provider: z.string().default('stripe'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only the UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should be able to access UI flags
      expect(uiScope.flag('ui.theme')).toBe('dark');
      expect(uiScope.flag('ui.fontSize')).toBe(14);

      // Should be able to access the whole UI namespace object
      expect(uiScope.flag('ui')).toEqual({ theme: 'dark', fontSize: 14 });
    });

    it('should pick multiple namespaces and allow flag resolution for all', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
          temperature: z.number().default(0.7),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
          provider: z.string().default('stripe'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick UI and LLM namespaces
      const pickedScope = appScope.pickFlags(['ui', 'llm']);

      // Should be able to access both picked namespaces
      expect(pickedScope.flag('ui.theme')).toBe('dark');
      expect(pickedScope.flag('ui.fontSize')).toBe(14);
      expect(pickedScope.flag('llm.model')).toBe('gpt-4');
      expect(pickedScope.flag('llm.temperature')).toBe(0.7);

      // Should be able to access whole namespace objects
      expect(pickedScope.flag('ui')).toEqual({ theme: 'dark', fontSize: 14 });
      expect(pickedScope.flag('llm')).toEqual({ model: 'gpt-4', temperature: 0.7 });
    });
  });

  describe('exclusion - verify excluded namespace flags fail', () => {
    it('should return undefined and log error for excluded namespace flags', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should work for included namespace
      expect(uiScope.flag('ui.theme')).toBe('dark');
      expect(consoleSpy).not.toHaveBeenCalled();

      // Should fail for excluded namespaces
      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const llmResult = uiScope.flag('llm.model');
      expect(llmResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "llm.model"'));

      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const paymentsResult = uiScope.flag('payments.enabled');
      expect(paymentsResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid flag: "payments.enabled"'),
      );

      consoleSpy.mockRestore();
    });

    it('should fail for namespace-level access to excluded namespaces', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should work for included namespace
      expect(uiScope.flag('ui')).toEqual({ theme: 'dark' });
      expect(consoleSpy).not.toHaveBeenCalled();

      // Should fail for excluded namespace
      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const paymentsResult = uiScope.flag('payments');
      expect(paymentsResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "payments"'));

      consoleSpy.mockRestore();
    });
  });

  describe('unknown keys - verify console.warn for invalid keys', () => {
    it('should warn about unknown namespace keys but continue working', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick valid and invalid namespaces
      const pickedScope = appScope.pickFlags(['ui', 'unknown', 'invalid'] as any);

      // Should warn about unknown keys
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown namespace keys: unknown, invalid'),
      );

      // Should still work for valid namespaces
      expect((pickedScope as any).flag('ui.theme')).toBe('dark');

      warnSpy.mockRestore();
    });

    it('should handle all unknown keys gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only unknown namespaces
      const pickedScope = appScope.pickFlags(['unknown', 'invalid'] as any);

      // Should warn about all unknown keys
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown namespace keys: unknown, invalid'),
      );

      // Should result in a scope that has no valid flags
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error - Testing unknown namespace access
      const result = pickedScope.flag('ui.theme');
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "ui.theme"'));

      warnSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('defaults propagation - schema defaults work correctly after picking', () => {
    it('should preserve all types of defaults in picked namespaces', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          fontSize: z.number().default(14),
          nested: z
            .object({
              spacing: z.number().default(8),
              colors: z
                .object({
                  primary: z.string().default('#007bff'),
                })
                .default({ primary: '#007bff' }),
            })
            .default({ spacing: 8, colors: { primary: '#007bff' } }),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
          config: z
            .object({
              temperature: z.number().default(0.7),
            })
            .default({ temperature: 0.7 }),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should preserve simple field defaults
      expect(uiScope.flag('ui.theme')).toBe('dark');
      expect(uiScope.flag('ui.fontSize')).toBe(14);

      // Should preserve nested object defaults
      expect(uiScope.flag('ui.nested')).toEqual({
        spacing: 8,
        colors: { primary: '#007bff' },
      });
      expect(uiScope.flag('ui.nested.spacing')).toBe(8);
      expect(uiScope.flag('ui.nested.colors.primary')).toBe('#007bff');

      // Should be able to access the whole namespace
      expect(uiScope.flag('ui')).toEqual({
        theme: 'dark',
        fontSize: 14,
        nested: {
          spacing: 8,
          colors: { primary: '#007bff' },
        },
      });
    });

    it('should work with object-level defaults', () => {
      const flagSchema = z.object({
        ui: z
          .object({
            theme: z.string(),
            fontSize: z.number(),
          })
          .default({ theme: 'light', fontSize: 16 }),
        api: z
          .object({
            baseUrl: z.string(),
            timeout: z.number(),
          })
          .default({ baseUrl: 'https://api.example.com', timeout: 5000 }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should use object-level defaults
      expect(uiScope.flag('ui')).toEqual({ theme: 'light', fontSize: 16 });
      expect((uiScope as any).flag('ui.theme')).toBe('light');
      expect((uiScope as any).flag('ui.fontSize')).toBe(16);
    });
  });

  describe('override isolation - overrides dont bleed into non-picked namespaces', () => {
    it('should work with CLI overrides for picked namespaces', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
      });

      // Set global overrides only for UI namespace
      setGlobalFlagOverrides({
        'ui.theme': 'light',
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should get CLI override for picked namespace
      expect(uiScope.flag('ui.theme')).toBe('light');

      // Should fail for non-picked namespaces
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const llmResult = uiScope.flag('llm.model');
      expect(llmResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "llm.model"'));

      consoleSpy.mockRestore();
    });

    it('should respect namespace isolation even with eval context overrides', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Use withEvalContext to simulate eval environment

      const result = withEvalContext({ 'ui.theme': 'custom' }, () => {
        // Should work for picked namespace
        expect(uiScope.flag('ui.theme')).toBe('custom');

        // Should fail for non-picked namespace
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // @ts-expect-error - Intentionally testing access to non-picked namespace
        const llmResult = uiScope.flag('llm.model');
        expect(llmResult).toBeUndefined();
        consoleSpy.mockRestore();

        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should properly isolate namespace access in picked scopes', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z.object({
            sidebar: z.boolean().default(true),
          }),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick only UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should work for all levels of picked namespace
      expect(uiScope.flag('ui.theme')).toBe('dark');
      expect(uiScope.flag('ui.layout.sidebar')).toBe(true);
      expect(uiScope.flag('ui')).toEqual({
        theme: 'dark',
        layout: { sidebar: true },
      });

      // Should fail for all non-picked namespaces
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // @ts-expect-error - Intentionally testing access to non-picked namespace
      expect(uiScope.flag('llm.model')).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "llm.model"'));

      // @ts-expect-error - Intentionally testing access to non-picked namespace
      expect(uiScope.flag('payments.enabled')).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid flag: "payments.enabled"'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty key arrays', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick no namespaces
      const emptyScope = appScope.pickFlags([]);

      // All flag calls should fail
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // @ts-expect-error - Testing empty scope access
      const result = emptyScope.flag('ui.theme');
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "ui.theme"'));

      consoleSpy.mockRestore();
    });

    it('should handle duplicate keys gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick with duplicates
      const pickedScope = appScope.pickFlags(['ui', 'ui', 'llm']);

      // Should still work (Zod handles duplicates)
      expect(pickedScope.flag('ui.theme')).toBe('dark');
      expect(pickedScope.flag('llm.model')).toBe('gpt-4');

      // Filter out updateEvalContext warnings and check for duplicate warnings
      const duplicateWarnings = warnSpy.mock.calls.filter(
        (call) => !call[0].includes('updateEvalContext called outside'),
      );
      expect(duplicateWarnings).toHaveLength(0);

      warnSpy.mockRestore();
    });

    it('should maintain flagSchema functionality in picked scopes', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick UI and LLM namespaces
      const pickedScope = appScope.pickFlags(['ui', 'llm']);

      // Should be able to access flagSchema for picked namespaces
      const uiSchema = pickedScope.flagSchema('ui');
      expect(uiSchema).toBeDefined();

      const llmSchema = pickedScope.flagSchema('llm');
      expect(llmSchema).toBeDefined();

      // Should error for non-picked namespace
      expect(() => {
        // @ts-expect-error - Intentionally testing access to non-picked namespace schema
        pickedScope.flagSchema('payments');
      }).toThrow();

      // Should be able to get full picked schema
      const fullSchema = pickedScope.flagSchema();
      expect(fullSchema).toBeDefined();
      expect(Object.keys(fullSchema.shape)).toEqual(['ui', 'llm']);
    });

    it('should work with deeply nested schemas', () => {
      const flagSchema = z.object({
        ui: z.object({
          layout: z.object({
            sidebar: z.object({
              width: z.number().default(250),
              position: z.string().default('left'),
            }),
            header: z.object({
              height: z.number().default(60),
              sticky: z.boolean().default(true),
            }),
          }),
          theme: z.object({
            colors: z.object({
              primary: z.string().default('#007bff'),
              secondary: z.string().default('#6c757d'),
            }),
          }),
        }),
        api: z.object({
          endpoints: z.object({
            users: z.string().default('/api/users'),
            posts: z.string().default('/api/posts'),
          }),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // Pick UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should be able to access deeply nested paths
      expect(uiScope.flag('ui.layout.sidebar.width')).toBe(250);
      expect(uiScope.flag('ui.layout.sidebar.position')).toBe('left');
      expect(uiScope.flag('ui.layout.header.height')).toBe(60);
      expect(uiScope.flag('ui.theme.colors.primary')).toBe('#007bff');

      // Should be able to access intermediate objects if they have complete defaults
      expect(uiScope.flag('ui.layout.sidebar')).toEqual({
        width: 250,
        position: 'left',
      });

      // Should fail for non-picked namespace
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const result = uiScope.flag('api.endpoints.users');
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid flag: "api.endpoints.users"'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('integration with app scope methods', () => {
    it('should work with fact() method when factSchema is present', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
        }),
      });

      const factSchema = z.object({
        duration: z.number(),
        tokenCount: z.number().optional(),
      });

      const appScope = createAppScope({ flagSchema, factSchema });

      // Pick UI namespace
      const uiScope = appScope.pickFlags(['ui']);

      // Should still be able to record facts
      expect(() => {
        (uiScope as any).fact('duration', 123.45);
        (uiScope as any).fact('tokenCount', 1000);
      }).not.toThrow();
    });

    it('should fail to call pickFlags when flagSchema is missing', () => {
      const appScope = createAppScope({ flagSchema: undefined });

      expect(() => {
        // @ts-expect-error - should fail at both compile and runtime
        appScope.pickFlags(['ui']);
      }).toThrow(
        '[AxiomAI] pickFlags requires a flagSchema to be provided in createAppScope({ flagSchema })',
      );
    });

    it('should allow nested pickFlags calls', () => {
      const flagSchema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
          layout: z.object({
            sidebar: z.boolean().default(true),
          }),
        }),
        llm: z.object({
          model: z.string().default('gpt-4'),
          config: z.object({
            temperature: z.number().default(0.7),
          }),
        }),
        payments: z.object({
          enabled: z.boolean().default(false),
        }),
      });

      const appScope = createAppScope({ flagSchema });

      // First pick: get UI and LLM
      const firstPick = appScope.pickFlags(['ui', 'llm']);

      // Second pick: narrow down to just UI
      const secondPick = firstPick.pickFlags(['ui']);

      // Should work for final picked namespace
      expect(secondPick.flag('ui.theme')).toBe('dark');
      expect(secondPick.flag('ui.layout.sidebar')).toBe(true);

      // Should fail for namespaces not in the final pick
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const llmResult = secondPick.flag('llm.model');
      expect(llmResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid flag: "llm.model"'));

      // @ts-expect-error - Intentionally testing access to non-picked namespace
      const paymentsResult = secondPick.flag('payments.enabled');
      expect(paymentsResult).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid flag: "payments.enabled"'),
      );

      consoleSpy.mockRestore();
    });
  });
});
