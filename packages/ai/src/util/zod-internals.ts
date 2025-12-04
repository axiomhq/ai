import type { ZodObject, ZodType } from 'zod';

/**
 * Zod v3/v4 compatibility helpers.
 *
 * Zod v3 uses `schema._def` with `_def.typeName` (enum like ZodFirstPartyTypeKind.ZodObject)
 * Zod v4 uses `schema._zod.def` with `def.type` (string literal like "object")
 *
 * This module centralizes all internal Zod access so version differences
 * are handled in one place.
 */

/** Normalized schema kinds we care about */
export type ZodKind =
  | 'object'
  | 'optional'
  | 'default'
  | 'nullable'
  | 'array'
  | 'record'
  | 'union'
  | 'discriminatedUnion'
  | 'other';

/** Minimal internal def shape we access */
interface ZodInternalDef {
  type?: unknown;
  typeName?: unknown;
  innerType?: ZodType<unknown>;
  defaultValue?: unknown;
  shape?: Record<string, ZodType<unknown>>;
  valueType?: ZodType<unknown>;
}

/**
 * Get the internal def object from a schema.
 * Handles both Zod v3 (_def) and v4 (_zod.def) structures.
 */
export function getDef(schema: unknown): ZodInternalDef | undefined {
  if (!schema || typeof schema !== 'object') return undefined;

  const s = schema as Record<string, unknown>;

  // v4: _zod.def
  if (s._zod && typeof s._zod === 'object') {
    const zod = s._zod as Record<string, unknown>;
    if (zod.def && typeof zod.def === 'object') {
      return zod.def as ZodInternalDef;
    }
  }

  // v3: _def
  if (s._def && typeof s._def === 'object') {
    return s._def as ZodInternalDef;
  }

  // Some internal code uses .def directly
  if (s.def && typeof s.def === 'object') {
    return s.def as ZodInternalDef;
  }

  return undefined;
}

/**
 * Get the raw type string from a def.
 * v4: def.type (string like "object")
 * v3: def.typeName (enum like "ZodObject")
 */
function getDefRawType(def: ZodInternalDef | undefined): string | undefined {
  if (!def) return undefined;
  const raw = def.type ?? def.typeName;
  if (raw == null) return undefined;
  return typeof raw === 'string' ? raw : String(raw);
}

/**
 * Get the normalized ZodKind from a schema or def.
 */
export function getKind(schemaOrDef: unknown): ZodKind | undefined {
  // If it looks like a def already (has type or typeName), use it directly
  const def =
    schemaOrDef &&
    typeof schemaOrDef === 'object' &&
    ('type' in schemaOrDef || 'typeName' in schemaOrDef)
      ? (schemaOrDef as ZodInternalDef)
      : getDef(schemaOrDef);

  const raw = getDefRawType(def);
  if (!raw) return undefined;

  // Normalize v3 enum names (ZodObject) and v4 string literals (object)
  const normalized = raw.replace(/^Zod/, '').toLowerCase();

  switch (normalized) {
    case 'object':
      return 'object';
    case 'optional':
      return 'optional';
    case 'default':
      return 'default';
    case 'nullable':
      return 'nullable';
    case 'array':
      return 'array';
    case 'record':
      return 'record';
    case 'union':
      return 'union';
    case 'discriminatedunion':
      return 'discriminatedUnion';
    default:
      return 'other';
  }
}

/**
 * Check if a schema is an object schema (has shape).
 */
export function isObjectSchema(schema: unknown): schema is ZodObject<Record<string, ZodType>> {
  if (!schema || typeof schema !== 'object') return false;

  // Check for shape property directly (works in both v3 and v4)
  if ('shape' in schema && typeof (schema as Record<string, unknown>).shape === 'object') {
    return true;
  }

  return getKind(schema) === 'object';
}

/**
 * Check if a schema is an optional wrapper.
 */
export function isOptionalSchema(schema: unknown): boolean {
  return getKind(schema) === 'optional';
}

/**
 * Check if a schema is a nullable wrapper.
 */
export function isNullableSchema(schema: unknown): boolean {
  return getKind(schema) === 'nullable';
}

/**
 * Check if a schema is a default wrapper.
 */
export function isDefaultSchema(schema: unknown): boolean {
  return getKind(schema) === 'default';
}

/**
 * Get the innerType from wrapper schemas (optional, nullable, default).
 */
export function getInnerType(schema: unknown): ZodType<unknown> | undefined {
  const def = getDef(schema);
  return def?.innerType;
}

/**
 * Get the shape from an object schema.
 */
export function getShape(schema: unknown): Record<string, ZodType<unknown>> | undefined {
  if (!schema || typeof schema !== 'object') return undefined;

  // Direct shape property (both v3 and v4 have this on ZodObject)
  const s = schema as Record<string, unknown>;
  if (s.shape && typeof s.shape === 'object') {
    return s.shape as Record<string, ZodType<unknown>>;
  }

  // Fallback to def.shape
  const def = getDef(schema);
  return def?.shape;
}

/**
 * Get the default value from a schema wrapped in ZodDefault.
 */
export function getDefaultValue(schema: unknown): unknown {
  const def = getDef(schema);
  return def?.defaultValue;
}

/**
 * Get the valueType from a record schema.
 */
export function getRecordValueType(schema: unknown): ZodType<unknown> | undefined {
  const def = getDef(schema);
  return def?.valueType;
}

/**
 * Unwrap transparent wrappers (optional, nullable, default) to get the core schema.
 * Useful when you need to check the underlying type.
 */
export function unwrapTransparent(schema: ZodType<unknown>): ZodType<unknown> {
  let current: unknown = schema;

  for (let i = 0; i < 10; i++) {
    const kind = getKind(current);
    if (!kind) break;

    if (kind === 'optional' || kind === 'nullable' || kind === 'default') {
      const inner = getInnerType(current);
      if (!inner) break;
      current = inner;
      continue;
    }
    break;
  }

  return current as ZodType<unknown>;
}

/**
 * Check if a schema is a transparent wrapper (optional, nullable, or default).
 */
export function isTransparentWrapper(schema: unknown): boolean {
  const kind = getKind(schema);
  return kind === 'optional' || kind === 'nullable' || kind === 'default';
}
