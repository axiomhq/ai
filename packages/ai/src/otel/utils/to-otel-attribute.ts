import { type AttributeValue } from '@opentelemetry/api';

function toHomogeneousArray(input: unknown[]): AttributeValue | undefined {
  if (input.length === 0) return undefined;

  const converted: (string | number | boolean)[] = [];
  const types = new Set<string>();

  for (const item of input) {
    const converted_item = toOtelPrimitive(item);
    if (converted_item !== undefined) {
      converted.push(converted_item);
      types.add(typeof converted_item);
    }
  }

  if (converted.length === 0) return undefined;

  if (types.size > 1) {
    return converted.map((item) => String(item)) as AttributeValue;
  }

  return converted as AttributeValue;
}

function toOtelPrimitive(v: unknown): string | number | boolean | undefined {
  switch (typeof v) {
    case 'string':
      return v;
    case 'number':
      return Number.isFinite(v) ? v : undefined;
    case 'boolean':
      return v;
    case 'bigint':
      if (v >= Number.MIN_SAFE_INTEGER && v <= Number.MAX_SAFE_INTEGER) {
        return Number(v);
      }
      return v.toString();
    case 'function':
    case 'symbol':
    case 'undefined':
      return undefined;
    case 'object':
      if (v === null) return undefined;
      if (v instanceof Date) return v.toISOString();
      if (v instanceof Error) return v.message;
      // fallback: stringify object-ish values
      return safeStringify(v);
  }
}

function safeStringify(obj: unknown): string | undefined {
  try {
    // Convert BigInt -> Number inside objects so JSON.stringify won't throw.
    // Functions/undefined are dropped by JSON rules.
    const s = JSON.stringify(obj, (_k, val) =>
      typeof val === 'bigint' ? Number(val) : val instanceof Date ? val.toISOString() : val,
    );
    // Avoid empty/meaningless "{}" for Map/Set—stringify those explicitly
    if (s === '{}') {
      if (obj instanceof Map) {
        return JSON.stringify(Object.fromEntries(obj));
      }
      if (obj instanceof Set) {
        return JSON.stringify(Array.from(obj));
      }
    }
    return s ?? undefined;
  } catch {
    // As a last resort, use toString() if present
    try {
      const t = (obj as any)?.toString?.();
      return typeof t === 'string' ? t : undefined;
    } catch {
      return undefined;
    }
  }
}

export function toOtelAttribute(input: unknown): AttributeValue | undefined {
  // primitives fast-path
  switch (typeof input) {
    case 'string':
      return input;
    case 'number':
      return Number.isFinite(input) ? input : undefined;
    case 'boolean':
      return input;
    case 'bigint':
      if (input >= Number.MIN_SAFE_INTEGER && input <= Number.MAX_SAFE_INTEGER) {
        return Number(input);
      }
      return input.toString();
    case 'function':
    case 'symbol':
    case 'undefined':
      return undefined;
  }

  // arrays -> homogeneous array of primitives
  if (Array.isArray(input)) {
    return toHomogeneousArray(input);
  }

  // date -> ISO string
  if (input instanceof Date) {
    return input.toISOString();
  }

  // null / objects -> JSON string
  if (input === null) return undefined;
  return safeStringify(input);
}
