import { describe, it, expect, expectTypeOf } from 'vitest';
import { Type, type TSchema, type InferSchema } from '../../src/template';

describe('Template Types', () => {
  it('should create basic primitive types', () => {
    const stringType = Type.String();
    const numberType = Type.Number();
    const booleanType = Type.Boolean();

    // Type assertions: verify the schema types are correct
    expectTypeOf(stringType).toExtend<TSchema>();
    expectTypeOf(numberType).toExtend<TSchema>();
    expectTypeOf(booleanType).toExtend<TSchema>();

    // Type assertions: verify inferred types are correct
    expectTypeOf<InferSchema<typeof stringType>>().toEqualTypeOf<string>();
    expectTypeOf<InferSchema<typeof numberType>>().toEqualTypeOf<number>();
    expectTypeOf<InferSchema<typeof booleanType>>().toEqualTypeOf<boolean>();

    expect(stringType).toBeDefined();
    expect(numberType).toBeDefined();
    expect(booleanType).toBeDefined();
  });

  it('should create literal types', () => {
    const stringLiteral = Type.Literal('hello');
    const numberLiteral = Type.Literal(42);
    const booleanLiteral = Type.Literal(true);

    // Type assertions: verify literal types are inferred correctly
    expectTypeOf<InferSchema<typeof stringLiteral>>().toEqualTypeOf<'hello'>();
    expectTypeOf<InferSchema<typeof numberLiteral>>().toEqualTypeOf<42>();
    expectTypeOf<InferSchema<typeof booleanLiteral>>().toEqualTypeOf<true>();

    expect(stringLiteral).toBeDefined();
    expect(numberLiteral).toBeDefined();
    expect(booleanLiteral).toBeDefined();
  });

  it('should create collection types with Template constraints', () => {
    const arrayType = Type.Array(Type.String());
    const objectType = Type.Object({
      name: Type.String(),
      age: Type.Number(),
      active: Type.Boolean(),
    });
    const recordType = Type.Record(Type.String());

    // Type assertions: verify collection types are inferred correctly
    expectTypeOf<InferSchema<typeof arrayType>>().toEqualTypeOf<string[]>();
    expectTypeOf<InferSchema<typeof objectType>>().toEqualTypeOf<{
      name: string;
      age: number;
      active: boolean;
    }>();
    expectTypeOf<InferSchema<typeof recordType>>().toEqualTypeOf<Record<string, string>>();

    expect(arrayType).toBeDefined();
    expect(objectType).toBeDefined();
    expect(recordType).toBeDefined();
  });

  it('should create modifier types with Template constraints', () => {
    const optionalType = Type.Union([Type.String(), Type.Undefined()]);
    const unionType = Type.Union([Type.String(), Type.Number(), Type.Literal('special')]);

    type UnionType = InferSchema<typeof unionType>;
    type OptionalType = InferSchema<typeof optionalType>;

    expectTypeOf(optionalType).toExtend<TSchema>();
    expectTypeOf(unionType).toExtend<TSchema>();

    expectTypeOf<OptionalType>().not.toBeUnknown();
    expectTypeOf<UnionType>().not.toBeUnknown();

    expectTypeOf<InferSchema<typeof optionalType>>().toEqualTypeOf<string | undefined>();
    expectTypeOf<InferSchema<typeof unionType>>().toEqualTypeOf<string | number>();

    expect(optionalType).toBeDefined();
    expect(unionType).toBeDefined();
  });

  it('should create complex nested schemas', () => {
    const complexSchema = Type.Object({
      user: Type.Object({
        id: Type.String(),
        profile: Type.Object({
          name: Type.String(),
          age: Type.Optional(Type.Integer()),
          preferences: Type.Record(Type.Boolean()),
        }),
        roles: Type.Array(Type.String()),
        status: Type.Union([Type.Literal('active'), Type.Literal('inactive')]),
      }),
      metadata: Type.Optional(Type.Record(Type.String())),
    });

    // Type assertion: verify schema is valid
    expectTypeOf(complexSchema).toExtend<TSchema>();

    expectTypeOf<InferSchema<typeof complexSchema>>().toEqualTypeOf<{
      user: {
        id: string;
        profile: {
          name: string;
          age: number | undefined;
          preferences: Record<string, boolean>;
        };
        roles: string[];
        status: 'active' | 'inactive';
      };
      metadata: Record<string, string> | undefined;
    }>;

    expect(complexSchema).toBeDefined();
  });

  it('should work with tuples', () => {
    const tupleType = Type.Tuple([Type.String(), Type.Number(), Type.Boolean()]);

    // Type assertion: verify schema is valid
    expectTypeOf(tupleType).toExtend<TSchema>();

    type TupleType = InferSchema<typeof tupleType>;
    expectTypeOf<TupleType>().not.toBeUnknown();
    expectTypeOf<TupleType>().toEqualTypeOf<[string, number, boolean]>();

    expect(tupleType).toBeDefined();
  });

  it('should enforce Template type constraints at compile time', () => {
    // These should compile without errors as they use only Template types
    const validArray = Type.Array(Type.String());
    const validObject = Type.Object({
      field: Type.Number(),
    });
    const validUnion = Type.Union([Type.String(), Type.Number()]);

    // Type assertions: verify these are valid TemplateSchema types
    expectTypeOf(validArray).toExtend<TSchema>();
    expectTypeOf(validObject).toExtend<TSchema>();
    expectTypeOf(validUnion).toExtend<TSchema>();

    expectTypeOf<InferSchema<typeof validArray>>().toEqualTypeOf<string[]>();
    expectTypeOf<InferSchema<typeof validObject>>().toEqualTypeOf<{
      field: number;
    }>();
    expectTypeOf<InferSchema<typeof validUnion>>().toEqualTypeOf<string | number>();

    // Verify runtime behavior still works
    expect(validArray).toBeDefined();
    expect(validObject).toBeDefined();
    expect(validUnion).toBeDefined();
  });
});
