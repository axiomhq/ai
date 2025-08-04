import { describe, it, expect, expectTypeOf, assertType } from 'vitest';
import { parse, Template, type InferContext } from '../../src/prompt';
import type { Prompt } from '../../src/types';

describe('Type Inference', () => {
  it('should infer context types from prompt arguments', async () => {
    // Define a prompt with specific argument types
    const prompt = {
      name: 'user-greeting',
      slug: 'user-greeting',
      version: '1.0',
      model: 'gpt-4',
      options: {},
      messages: [
        {
          role: 'system' as const,
          content: 'Hello {{ user.name }}! Age: {{ user.age }}, Active: {{ user.isActive }}',
        },
      ],
      arguments: {
        user: Template.Object({
          name: Template.String(),
          age: Template.Integer(),
          isActive: Template.Boolean(),
          roles: Template.Array(Template.String()),
        }),
      },
    } satisfies Prompt;

    // Type assertion: verify the inferred context type is correct
    type ExpectedContext = InferContext<typeof prompt.arguments>;
    expectTypeOf<ExpectedContext>().toEqualTypeOf<{
      user: {
        name: string;
        age: number;
        isActive: boolean;
        roles: string[];
      };
    }>();

    // Context is now strongly typed based on the prompt arguments
    const context = {
      user: {
        name: 'John Doe',
        age: 30,
        isActive: true,
        roles: ['admin', 'user'],
      },
    };

    // Type assertion: verify context matches expected type
    assertType<ExpectedContext>(context);

    const result = await parse(prompt, {
      context,
    });

    expect(result.messages[0].content).toContain('Hello John Doe!');
    expect(result.messages[0].content).toContain('Age: 30');
    expect(result.messages[0].content).toContain('Active: true');
  });

  it('should work with union types and literals', async () => {
    const prompt = {
      name: 'status-check',
      slug: 'status-check',
      version: '1.0',
      model: 'gpt-4',
      options: {},
      messages: [
        {
          role: 'system',
          content: 'Status: {{ status }}, Priority: {{ priority }}',
        },
      ],
      arguments: {
        status: Template.Union([
          Template.Literal('active'),
          Template.Literal('inactive'),
          Template.Literal('pending'),
        ]),
        priority: Template.Union([
          Template.Literal('high'),
          Template.Literal('medium'),
          Template.Literal('low'),
        ]),
      },
    } satisfies Prompt;

    // Type assertion: verify union literal types are inferred correctly
    type ExpectedContext = InferContext<typeof prompt.arguments>;
    expectTypeOf<ExpectedContext>().toEqualTypeOf<{
      status: 'active' | 'inactive' | 'pending';
      priority: 'high' | 'medium' | 'low';
    }>();

    // TypeScript will enforce these must be the literal values
    const context = {
      status: 'active' as const,
      priority: 'high' as const,
    };

    // Type assertion: verify context is assignable to expected type
    assertType<ExpectedContext>(context);

    const result = await parse(prompt, {
      context,
    });

    expect(result.messages[0].content).toBe('Status: active, Priority: high');
  });

  it('should work with optional fields', async () => {
    const prompt = {
      name: 'optional-fields',
      slug: 'optional-fields',
      version: '1.0',
      model: 'gpt-4',
      options: {},
      messages: [
        {
          role: 'system',
          content: 'Name: {{ name }}{{#if description}}, Desc: {{ description }}{{/if}}',
        },
      ],
      arguments: {
        name: Template.String(),
        description: Template.Optional(Template.String()),
      },
    } satisfies Prompt;

    // Type assertion: verify optional fields are typed correctly
    type ExpectedContext = InferContext<typeof prompt.arguments>;
    expectTypeOf<ExpectedContext>().toEqualTypeOf<{
      name: string;
      description?: string;
    }>();

    // description is optional in the context
    const context = {
      name: 'Test Item',
      // description can be omitted
    };

    // Type assertion: verify context with omitted optional field is valid
    assertType<ExpectedContext>(context);

    // Type assertion: verify context with optional field is also valid
    const contextWithDescription = {
      name: 'Test Item',
      description: 'A test description',
    };
    assertType<ExpectedContext>(contextWithDescription);

    const result = await parse(prompt, {
      context,
    });

    expect(result.messages[0].content).toBe('Name: Test Item');
  });

  it('should enforce type constraints at compile time', () => {
    const _prompt = {
      name: 'type-constraints',
      slug: 'type-constraints',
      version: '1.0',
      model: 'gpt-4',
      options: {},
      messages: [{ role: 'system', content: 'Test' }],
      arguments: {
        stringField: Template.String(),
        numberField: Template.Number(),
        literalField: Template.Literal('specific-value'),
      },
    } satisfies Prompt;

    type ExpectedContext = InferContext<typeof _prompt.arguments>;

    // Type assertions: verify field types are correct
    expectTypeOf<ExpectedContext['stringField']>().toEqualTypeOf<string>();
    expectTypeOf<ExpectedContext['numberField']>().toEqualTypeOf<number>();
    expectTypeOf<ExpectedContext['literalField']>().toEqualTypeOf<'specific-value'>();

    // Verify the complete context type
    expectTypeOf<ExpectedContext>().toEqualTypeOf<{
      stringField: string;
      numberField: number;
      literalField: 'specific-value';
    }>();
  });
});
