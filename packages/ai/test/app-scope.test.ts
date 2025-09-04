import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createAppScope } from '../src/app-scope';

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
    const flagSchema = z.object({
      num: z.number().default(42),
    }).strict();

    const appScope = createAppScope({ flagSchema });

    // Valid flag should work
    const num = appScope.flag('num');
    expect(num).toBe(42);

    // This would now be caught by TypeScript, but test runtime behavior
    expect(() => {
      // Simulate invalid value from CLI override
      (appScope as any).flag('invalidKey');
    }).toThrow();
  });

  it('should validate fact types strictly', () => {
    const factSchema = z.object({
      duration: z.number(),
    }).strict();

    const appScope = createAppScope({ factSchema });

    // Valid fact should work
    expect(() => {
      appScope.fact('duration', 123.45);
    }).not.toThrow();

    // Invalid fact type should throw
    expect(() => {
      appScope.fact('duration', 'not a number' as any);
    }).toThrow('Fact \'duration\' validation failed');
  });

  it('should maintain backward compatibility with existing code', () => {
    // Test without schema (old pattern)
    const appScope = createAppScope();
    
    // Should work with explicit defaults
    const strategy = appScope.flag('strategy', 'foo');
    expect(strategy).toBe('foo');
    
    const temperature = appScope.flag('temperature', 0.7);
    expect(temperature).toBe(0.7);
  });
});
