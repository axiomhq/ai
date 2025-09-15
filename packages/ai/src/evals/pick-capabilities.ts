import { type ZodObject, type ZodRawShape } from 'zod';

/**
 * Pick specific top-level namespaces from a Zod schema, creating a new schema
 * with only the selected namespaces.
 *
 * @template S - The source ZodObject schema type
 * @template K - The readonly array of keys from the schema shape
 * @param schema - The source Zod schema to pick namespaces from
 * @param keys - Readonly array of namespace keys to pick from the schema
 * @returns A new ZodObject containing only the picked namespaces
 *
 * @example
 * ```typescript
 * const fullSchema = z.object({
 *   ui: z.object({ theme: z.string().default('dark') }),
 *   api: z.object({ baseUrl: z.string().default('https://api.com') }),
 *   features: z.object({ auth: z.boolean().default(true) })
 * });
 *
 * const pickedSchema = pickCapabilities(fullSchema, ['ui', 'features']);
 * // Result: z.object({ ui: ..., features: ... }) - api capability excluded
 * ```
 */
export function pickCapabilities<
  S extends ZodObject<ZodRawShape>,
  K extends ReadonlyArray<keyof S['shape']>,
>(schema: S, keys: K): ZodObject<Pick<S['shape'], K[number]>> {
  // Validate that all requested keys exist in the schema and warn for unknown keys
  const schemaKeys = Object.keys(schema.shape);
  const unknownKeys = keys.filter((key) => !schemaKeys.includes(key as string));

  if (unknownKeys.length > 0) {
    console.warn(`[AxiomAI] Unknown namespace keys: ${unknownKeys.join(', ')}`);
  }

  // Use Zod's built-in pick method to create the new schema
  // Create the pick record in a type-safe way
  const pickRecord = {} as any;
  for (const key of keys) {
    pickRecord[key] = true;
  }

  return schema.pick(pickRecord) as ZodObject<Pick<S['shape'], K[number]>>;
}
