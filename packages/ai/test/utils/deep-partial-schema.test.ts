import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { makeDeepPartial } from '../../src/util/deep-partial-schema';

describe('makeDeepPartial', () => {
  describe('basic schema transformation', () => {
    it('makes top-level required fields optional', () => {
      const schema = z.object({
        name: z.string(),
        count: z.number(),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ name: 'test' }).success).toBe(true);
      expect(partial.safeParse({ count: 42 }).success).toBe(true);
      expect(partial.safeParse({ name: 'test', count: 42 }).success).toBe(true);
    });

    it('validates types when values are provided', () => {
      const schema = z.object({
        name: z.string(),
        count: z.number(),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({ name: 123 }).success).toBe(false);
      expect(partial.safeParse({ count: 'not-a-number' }).success).toBe(false);
    });
  });

  describe('nested object handling', () => {
    it('makes nested object fields optional', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string(),
          fontSize: z.number(),
        }),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ ui: {} }).success).toBe(true);
      expect(partial.safeParse({ ui: { theme: 'dark' } }).success).toBe(true);
      expect(partial.safeParse({ ui: { fontSize: 14 } }).success).toBe(true);
    });

    it('handles deeply nested structures', () => {
      const schema = z.object({
        app: z.object({
          ui: z.object({
            layout: z.object({
              sidebar: z.object({
                width: z.number(),
                collapsed: z.boolean(),
              }),
            }),
          }),
        }),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ app: {} }).success).toBe(true);
      expect(partial.safeParse({ app: { ui: {} } }).success).toBe(true);
      expect(partial.safeParse({ app: { ui: { layout: {} } } }).success).toBe(true);
      expect(
        partial.safeParse({
          app: { ui: { layout: { sidebar: { width: 200 } } } },
        }).success,
      ).toBe(true);
    });
  });

  describe('default value handling', () => {
    it('applies defaults when parsing empty object', () => {
      const schema = z.object({
        name: z.string().default('default-name'),
        count: z.number().default(0),
      });

      const partial = makeDeepPartial(schema);
      const result = partial.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: 'default-name',
          count: 0,
        });
      }
    });

    it('handles nested defaults', () => {
      const schema = z.object({
        ui: z.object({
          theme: z.string().default('dark'),
        }),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ ui: {} }).success).toBe(true);
    });
  });

  describe('optional field handling', () => {
    it('handles already-optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ required: 'test' }).success).toBe(true);
      expect(partial.safeParse({ optional: 'test' }).success).toBe(true);
    });

    it('handles optional nested objects', () => {
      const schema = z.object({
        config: z.optional(
          z.object({
            name: z.string(),
            value: z.number(),
          }),
        ),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ config: {} }).success).toBe(true);
      expect(partial.safeParse({ config: { name: 'test' } }).success).toBe(true);
    });
  });

  describe('primitive types', () => {
    it('handles string fields', () => {
      const schema = z.object({ value: z.string() });
      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ value: 'test' }).success).toBe(true);
      expect(partial.safeParse({ value: 123 }).success).toBe(false);
    });

    it('handles number fields', () => {
      const schema = z.object({ value: z.number() });
      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ value: 42 }).success).toBe(true);
      expect(partial.safeParse({ value: 'not-number' }).success).toBe(false);
    });

    it('handles boolean fields', () => {
      const schema = z.object({ value: z.boolean() });
      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ value: true }).success).toBe(true);
      expect(partial.safeParse({ value: false }).success).toBe(true);
      expect(partial.safeParse({ value: 'true' }).success).toBe(false);
    });

    it('handles enum fields', () => {
      const schema = z.object({ mode: z.enum(['dev', 'prod']) });
      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ mode: 'dev' }).success).toBe(true);
      expect(partial.safeParse({ mode: 'prod' }).success).toBe(true);
      expect(partial.safeParse({ mode: 'invalid' }).success).toBe(false);
    });
  });

  describe('array fields', () => {
    it('handles array fields', () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ items: [] }).success).toBe(true);
      expect(partial.safeParse({ items: ['a', 'b'] }).success).toBe(true);
    });

    it('handles arrays of objects', () => {
      const schema = z.object({
        users: z.array(z.object({ name: z.string() })),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ users: [] }).success).toBe(true);
      expect(partial.safeParse({ users: [{ name: 'Alice' }] }).success).toBe(true);
    });
  });

  describe('complex real-world schemas', () => {
    it('handles flag schema pattern used in app-scope', () => {
      const flagSchema = z.object({
        supportAgent: z.object({
          categorizeMessage: z.object({
            model: z.enum(['gpt-4o-mini', 'gpt-5-mini']).default('gpt-4o-mini'),
          }),
          retrieveFromKnowledgeBase: z.object({
            model: z.enum(['gpt-4o-mini', 'gpt-5-mini']).default('gpt-4o-mini'),
            maxDocuments: z.number().default(1),
          }),
        }),
      });

      const partial = makeDeepPartial(flagSchema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ supportAgent: {} }).success).toBe(true);
      expect(
        partial.safeParse({
          supportAgent: { categorizeMessage: { model: 'gpt-5-mini' } },
        }).success,
      ).toBe(true);
    });

    it('handles mixed required and default fields', () => {
      const schema = z.object({
        model: z.object({
          temperature: z.number().min(0).max(2).default(0.7),
          name: z.string().default('gpt-4o'),
        }),
        debug: z.boolean().default(false),
      });

      const partial = makeDeepPartial(schema);

      expect(partial.safeParse({}).success).toBe(true);
      expect(partial.safeParse({ model: { temperature: 0.9 } }).success).toBe(true);
      expect(partial.safeParse({ debug: true }).success).toBe(true);
      expect(partial.safeParse({ model: { temperature: 5 } }).success).toBe(false);
    });
  });
});
