import { type ZodObject, type ZodType, z } from 'zod';
import { getKind, getInnerType, isObjectSchema, getDefaultValue } from './zod-internals';

/**
 * Recursively makes all properties of a ZodObject schema optional (deep partial).
 * This is needed because Zod 4 removed the deprecated `.deepPartial()` method.
 *
 * When validating CLI flag overrides, we only want to validate the flags that are
 * provided, not require all nested objects to be fully specified.
 */
export function makeDeepPartial(schema: ZodObject<Record<string, ZodType>>): ZodType {
  const shape = schema.shape;
  const newShape: Record<string, ZodType> = {};

  for (const [key, value] of Object.entries(shape)) {
    newShape[key] = makeDeepPartialField(value as ZodType);
  }

  return z.object(newShape);
}

/**
 * Apply deep partial semantics to a single field of an object shape.
 */
function makeDeepPartialField(fieldSchema: ZodType): ZodType {
  const kind = getKind(fieldSchema);

  // Plain object field - recurse and make optional
  if (isObjectSchema(fieldSchema)) {
    const partialObject = makeDeepPartial(fieldSchema as ZodObject<Record<string, ZodType>>);
    return partialObject.optional();
  }

  // Optional wrapper - check if inner type is an object
  if (kind === 'optional') {
    const inner = getInnerType(fieldSchema);
    if (inner && isObjectSchema(inner)) {
      const partialInner = makeDeepPartial(inner as ZodObject<Record<string, ZodType>>);
      return partialInner.optional();
    }
    // Already optional and not an object - preserve as-is
    return fieldSchema;
  }

  // Nullable wrapper - check if inner type is an object
  if (kind === 'nullable') {
    const inner = getInnerType(fieldSchema);
    if (inner && isObjectSchema(inner)) {
      const partialInner = makeDeepPartial(inner as ZodObject<Record<string, ZodType>>);
      return partialInner.nullable().optional();
    }
    // Nullable non-object - just make optional
    return fieldSchema.optional();
  }

  // Default wrapper - check if inner type is an object
  if (kind === 'default') {
    const inner = getInnerType(fieldSchema);
    const defaultValue = getDefaultValue(fieldSchema);

    if (inner && isObjectSchema(inner)) {
      const partialInner = makeDeepPartial(inner as ZodObject<Record<string, ZodType>>);
      // Reapply the default on the deep-partialled object, preserving function references for lazy defaults
      return (partialInner as ZodObject<Record<string, ZodType>>).default(defaultValue as any);
    }
    // Non-object with default - make optional to allow partial validation
    return fieldSchema.optional();
  }

  // All other field types - just make optional
  return fieldSchema.optional();
}
