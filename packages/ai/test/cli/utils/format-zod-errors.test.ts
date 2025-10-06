import { describe, it, expect } from 'vitest';
import { formatZodErrors, generateFlagExamples } from '../../../src/cli/utils/format-zod-errors';
import { z, type ZodError } from 'zod';

describe('formatZodErrors', () => {
  it('formats basic invalid type errors', () => {
    const schema = z.object({
      temperature: z.number(),
    });

    try {
      schema.parse({ temperature: 'invalid' });
    } catch (error) {
      const formatted = formatZodErrors(error as ZodError);
      expect(formatted).toContain("flag 'temperature' expected number");
    }
  });

  it('formats validation errors with nested paths', () => {
    const schema = z.object({
      model: z.object({
        name: z.string(),
        temperature: z.number().min(0).max(2),
      }),
    });

    try {
      schema.parse({ model: { name: 123, temperature: 3 } });
    } catch (error) {
      const formatted = formatZodErrors(error as ZodError);
      expect(formatted).toContain("flag 'model.name' expected string");
      expect(formatted).toContain("flag 'model.temperature' is too big");
    }
  });

  it('formats enum validation errors', () => {
    const schema = z.object({
      mode: z.enum(['dev', 'prod', 'test']),
    });

    try {
      schema.parse({ mode: 'invalid' });
    } catch (error) {
      const formatted = formatZodErrors(error as ZodError);
      expect(formatted).toContain('flag \'mode\' must be one of: "dev", "prod", "test"');
    }
  });

  it('handles unrecognized keys at root level with descriptive error message', () => {
    const schema = z
      .object({
        temperature: z.number(),
      })
      .strict();

    try {
      schema.parse({ temperature: 0.7, extraFlag: 'value' });
    } catch (error) {
      const formatted = formatZodErrors(error as ZodError);

      expect(formatted).toContain("unrecognized flag 'extraFlag'");
    }
  });

  it('does not incorrectly find an issue at root', () => {
    const schema = z
      .object({
        temperature: z.number(),
      })
      .strict();

    try {
      schema.parse({ temperature: 0.7, extraFlag: 'value' });
    } catch (error) {
      const formatted = formatZodErrors(error as ZodError);

      expect(formatted).not.toContain("flag '':");
    }
  });

  it('handles multiple unrecognized keys', () => {
    const schema = z
      .object({
        temperature: z.number(),
      })
      .strict();

    try {
      schema.parse({
        temperature: 0.7,
        extraFlag1: 'value1',
        extraFlag2: 'value2',
      });
    } catch (error) {
      const formatted = formatZodErrors(error as ZodError);

      // Should mention both extra flags
      expect(formatted).toContain('extraFlag1');
      expect(formatted).toContain('extraFlag2');
      expect(formatted).toContain('unrecognized flags');
    }
  });
});

describe('generateFlagExamples', () => {
  it('generates examples for invalid type errors', () => {
    const schema = z.object({
      temperature: z.number(),
      enabled: z.boolean(),
      model: z.string(),
    });

    try {
      schema.parse({ temperature: 'invalid', enabled: 'yes', model: 123 });
    } catch (error) {
      const examples = generateFlagExamples(error as ZodError);

      expect(examples).toContain('--flag.temperature=0.7');
      expect(examples).toContain('--flag.enabled=true');
      expect(examples).toContain('--flag.model="value"');
      expect(examples.length).toBeLessThanOrEqual(3);
    }
  });

  it('generates examples for enum validation errors', () => {
    const schema = z.object({
      mode: z.enum(['dev', 'prod']),
    });

    try {
      schema.parse({ mode: 'invalid' });
    } catch (error) {
      const examples = generateFlagExamples(error as ZodError);
      expect(examples).toContain('--flag.mode=dev');
    }
  });

  it('generates examples for number range errors', () => {
    const schema = z.object({
      temperature: z.number().min(0).max(2),
    });

    try {
      schema.parse({ temperature: -1 });
    } catch (error) {
      const examples = generateFlagExamples(error as ZodError);
      expect(examples).toContain('--flag.temperature=0');
    }
  });
});
