import { Type as TypeBox, type TSchema as TypeBoxSchema, type Static } from '@sinclair/typebox';

/**
 * Template-friendly TypeBox types for use with Nunjucks and Handlebars.
 *
 * These types are designed to be easily serializable and work well in template contexts
 * where data needs to be rendered as strings or used in conditionals and loops.
 *
 * All composite types (Array, Object, etc.) only accept other Template types.
 */

// Brand to distinguish Template types from raw TypeBox types
declare const SchemaBrand: unique symbol;
type TSchema<T extends TypeBoxSchema = TypeBoxSchema> = T & { [SchemaBrand]: true };

// Utility type to infer TypeScript types from TSchema
export type InferSchema<T extends TSchema> = Static<T>;

// Utility type to infer context types from prompt arguments
export type InferContext<T extends Record<string, TSchema>> = Static<
  ReturnType<typeof createObject<T>>
>;

type OmitFirst<T extends any[]> = T extends [any, ...infer R] ? R : never;

// Helper to create branded Template types
const createTemplateType = <T extends TypeBoxSchema>(schema: T): TSchema<T> => schema as TSchema<T>;

// Primitive type creators
const createString = (...args: Parameters<typeof TypeBox.String>) =>
  createTemplateType(TypeBox.String(...args));
const createNumber = (...args: Parameters<typeof TypeBox.Number>) =>
  createTemplateType(TypeBox.Number(...args));
const createInteger = (...args: Parameters<typeof TypeBox.Integer>) =>
  createTemplateType(TypeBox.Integer(...args));
const createBoolean = (...args: Parameters<typeof TypeBox.Boolean>) =>
  createTemplateType(TypeBox.Boolean(...args));
const createNull = (...args: Parameters<typeof TypeBox.Null>) =>
  createTemplateType(TypeBox.Null(...args));
const createLiteral = <T extends string | number | boolean>(
  value: T,
  ...args: OmitFirst<Parameters<typeof TypeBox.Literal>>
) => createTemplateType(TypeBox.Literal(value, ...args));
const createUndefined = (...args: Parameters<typeof TypeBox.Undefined>) =>
  createTemplateType(TypeBox.Undefined(...args));

// Collection type creators - only accept Template types
const createArray = <T extends TSchema>(
  items: T,
  ...args: OmitFirst<Parameters<typeof TypeBox.Array>>
) => createTemplateType(TypeBox.Array(items, ...args));

const createObject = <T extends Record<string, TSchema>>(
  properties: T,
  ...args: OmitFirst<Parameters<typeof TypeBox.Object>>
) => createTemplateType(TypeBox.Object(properties, ...args));

const createRecord = <V extends TSchema>(
  value: V,
  ...args: OmitFirst<OmitFirst<Parameters<typeof TypeBox.Record>>>
) => createTemplateType(TypeBox.Record(TypeBox.String(), value, ...args));

const createTuple = <T extends TSchema[]>(
  types: [...T],
  ...args: OmitFirst<Parameters<typeof TypeBox.Tuple>>
) => {
  return createTemplateType(TypeBox.Tuple(types, ...args));
};

// Modifier type creators - only accept Template types
const createOptional = <T extends TSchema>(
  schema: T,
  ...args: OmitFirst<Parameters<typeof TypeBox.Optional>>
) => createTemplateType(TypeBox.Optional(schema, true, ...args));

const createUnion = <T extends TSchema[]>(
  schemas: [...T],
  ...args: OmitFirst<Parameters<typeof TypeBox.Union>>
) => createTemplateType(TypeBox.Union(schemas, ...args));

// Export all template-friendly types as a namespace
export const Type = {
  // Primitives
  String: createString,
  Number: createNumber,
  Integer: createInteger,
  Boolean: createBoolean,
  Null: createNull,
  Undefined: createUndefined,

  // Literals
  Literal: createLiteral,

  // Collections - only accept Template types
  Array: createArray,
  Object: createObject,
  Record: createRecord,
  Tuple: createTuple,

  // Modifiers - only accept Template types
  Optional: createOptional,
  Union: createUnion,
} as const;

// Export the branded type for advanced usage
export type { TSchema };

// Default export for convenience
export default Type;
