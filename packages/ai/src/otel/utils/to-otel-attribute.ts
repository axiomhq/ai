import { type AttributeValue } from '@opentelemetry/api';

export function toOtelAttribute(input: unknown): AttributeValue | undefined {
  // primitives fast-path
  switch (typeof input) {
    case 'string':
      return input;
    case 'number':
      if (Number.isFinite(input)) return input;
      if (input === Infinity) return 'Infinity';
      if (input === -Infinity) return '-Infinity';
      if (isNaN(input)) return 'NaN';
      return input;
    case 'boolean':
      return input;
    case 'bigint':
      return Number(input); // NOTE: precision may be lost
    case 'function':
    case 'symbol':
    case 'undefined':
      return undefined;
  }

  // arrays → array of primitives (filter out unsupported)
  if (Array.isArray(input)) {
    const arr = input
      .map(toOtelPrimitiveOrString)
      .filter((v): v is string | number | boolean => v !== undefined);
    return arr.length ? (arr as AttributeValue) : undefined;
  }

  // date → ISO string
  if (input instanceof Date) {
    return input.toISOString();
  }

  // null / objects → JSON string
  if (input === null) return undefined;
  return safeStringify(input);
}

// --- helpers ---

function toOtelPrimitiveOrString(v: unknown): string | number | boolean | undefined {
  switch (typeof v) {
    case 'string':
      return v;
    case 'number':
      return Number.isFinite(v) ? v : undefined;
    case 'boolean':
      return v;
    case 'bigint':
      return Number(v); // NOTE: precision may be lost
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
    // Convert BigInt → Number inside objects so JSON.stringify won't throw.
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
      // @ts-ignore
      const t = (obj as any)?.toString?.();
      return typeof t === 'string' ? t : undefined;
    } catch {
      return undefined;
    }
  }
}
