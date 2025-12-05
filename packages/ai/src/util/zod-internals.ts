import type { ZodObject, ZodType } from 'zod';

/**
 * Detect if a schema is from Zod v4.
 * v4 schemas have `_zod`, v3 schemas only have `_def`.
 */
export function isZodV4Schema(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return false;
  const s = schema as Record<string, unknown>;
  return '_zod' in s;
}

/**
 * Assert that a schema is from Zod v4, throwing a helpful error if it isn't.
 */
export function assertZodV4(schema: unknown, context: string): void {
  if (!isZodV4Schema(schema)) {
    throw new Error(
      `[AxiomAI] Zod v4 schemas are required (detected in ${context}). Found unsupported Zod version.`,
    );
  }
}

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

/** Minimal internal def shape we access (Zod v4) */
interface ZodInternalDef {
  type?: unknown;
  innerType?: ZodType<unknown>;
  defaultValue?: unknown;
  shape?: Record<string, ZodType<unknown>>;
  valueType?: ZodType<unknown>;
}

/**
 * Get the internal def object from a Zod v4 schema.
 */
export function getDef(schema: unknown): ZodInternalDef | undefined {
  if (!schema || typeof schema !== 'object') return undefined;

  const s = schema as Record<string, unknown>;

  if (s._zod && typeof s._zod === 'object') {
    const zod = s._zod as Record<string, unknown>;
    if (zod.def && typeof zod.def === 'object') {
      return zod.def as ZodInternalDef;
    }
  }

  return undefined;
}

/**
 * Get the raw type string from a def (Zod v4).
 */
function getDefRawType(def: ZodInternalDef | undefined): string | undefined {
  if (!def) return undefined;
  const raw = def.type;
  if (raw == null) return undefined;
  return typeof raw === 'string' ? raw : String(raw);
}

/**
 * Get the normalized ZodKind from a schema or def (Zod v4).
 */
export function getKind(schemaOrDef: unknown): ZodKind | undefined {
  // If it looks like a def already (has type), use it directly
  const def =
    schemaOrDef && typeof schemaOrDef === 'object' && 'type' in schemaOrDef
      ? (schemaOrDef as ZodInternalDef)
      : getDef(schemaOrDef);

  const raw = getDefRawType(def);
  if (!raw) return undefined;

  const normalized = raw.toLowerCase();

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

  if ('shape' in schema && typeof (schema as Record<string, unknown>).shape === 'object') {
    return true;
  }

  return getKind(schema) === 'object';
}

/**
 * Get the innerType from wrapper schemas (optional, nullable, default).
 */
export function getInnerType(schema: unknown): ZodType<unknown> | undefined {
  const def = getDef(schema);
  return def?.innerType;
}

/**
 * Get the shape from an object schema (Zod v4).
 */
export function getShape(schema: unknown): Record<string, ZodType<unknown>> | undefined {
  if (!schema || typeof schema !== 'object') return undefined;

  // Direct shape property (Zod v4)
  const s = schema as Record<string, unknown>;
  if (s.shape && typeof s.shape === 'object') {
    return s.shape as Record<string, ZodType<unknown>>;
  }

  return undefined;
}

/**
 * Get the default value from a schema wrapped in ZodDefault.
 */
export function getDefaultValue(schema: unknown): unknown {
  const def = getDef(schema);
  return def?.defaultValue;
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
