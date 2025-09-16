import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../src/app-scope';
import {
  setGlobalFlagOverrides,
  clearGlobalFlagOverrides,
} from '../src/evals/context/global-flags';

describe('createAppScope with Zod schemas', () => {
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

  it('should not be allowed to call without flagSchema', () => {
    // @ts-expect-error
    const _appScope = createAppScope();
    // @ts-expect-error
    const _appScope2 = createAppScope({ factSchema: z.object({}) });
  });
});

describe('createAppScope auto-validation', () => {
  beforeEach(() => {
    clearGlobalFlagOverrides();
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearGlobalFlagOverrides();
  });

  describe('unit tests (mocked validation)', () => {
    let validateSpy: any;

    beforeEach(async () => {
      // Create a spy on the actual function
      const validateModule = await import('../src/validate-flags');
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
});
