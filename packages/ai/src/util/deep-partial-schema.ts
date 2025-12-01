import { type ZodObject, type ZodType, type ZodOptional, z } from 'zod';

/**
 * Recursively makes all properties of a ZodObject schema optional (deep partial).
 * This is needed because Zod 4 removed the deprecated `.deepPartial()` method.
 *
 * When validating CLI flag overrides, we only want to validate the flags that are
 * provided, not require all nested objects to be fully specified.
 *
 * This is a fairly simple implementation. If we need more in the future, we
 * can extend it or use `@traversable/zod` -cje
 */
export function makeDeepPartial(schema: ZodObject<any>): ZodType<any> {
  const shape = schema.shape;
  const newShape: Record<string, ZodType<any>> = {};

  for (const [key, value] of Object.entries(shape)) {
    const fieldSchema = value as ZodType<any>;

    // Check if this is a ZodObject by checking for the 'shape' property
    if (isZodObject(fieldSchema)) {
      // Recursively make nested objects deeply partial, then wrap in optional
      newShape[key] = makeDeepPartial(fieldSchema as ZodObject<any>).optional();
    } else if (isZodOptional(fieldSchema)) {
      // Already optional - check if the inner type is an object
      const innerType = (fieldSchema as any)._zod?.def?.innerType;
      if (innerType && isZodObject(innerType)) {
        newShape[key] = makeDeepPartial(innerType).optional();
      } else {
        newShape[key] = fieldSchema;
      }
    } else {
      // Non-object field - just make it optional
      newShape[key] = fieldSchema.optional();
    }
  }

  return z.object(newShape);
}

function isZodObject(schema: ZodType<any>): boolean {
  if (schema === null || typeof schema !== 'object') return false;

  // In Zod 4, check _zod.def.type === 'object' or check for shape property
  const def = (schema as any)._zod?.def;
  if (def?.type === 'object') return true;

  // Also check if it has a shape property directly (for compatibility)
  if ('shape' in schema && typeof (schema as any).shape === 'object') {
    return true;
  }

  return false;
}

function isZodOptional(schema: ZodType<any>): schema is ZodOptional<any> {
  return (
    schema !== null &&
    typeof schema === 'object' &&
    '_zod' in schema &&
    (schema as any)._zod?.def?.type === 'optional'
  );
}
