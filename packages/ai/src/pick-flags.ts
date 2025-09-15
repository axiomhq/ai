import { type ZodObject, type ZodRawShape } from 'zod';

/**
 * Pick specific top-level namespaces from a flag schema, creating a new schema
 * with only the selected namespaces.
 *
 * @template S - The source ZodObject schema type
 * @template K - The readonly array of keys from the schema shape
 * @param schema - The source Zod flag schema to pick namespaces from
 * @param keys - Readonly array of namespace keys to pick from the schema
 * @returns A new ZodObject containing only the picked namespaces
 *
 * @example
 * ```typescript
 * const fullFlagSchema = z.object({
 *   ui: z.object({ theme: z.string().default('dark') }),
 *   llm: z.object({ model: z.string().default('gpt-4') }),
 *   payments: z.object({ enabled: z.boolean().default(false) })
 * });
 *
 * const pickedSchema = pickFlags(fullFlagSchema, ['ui', 'llm']);
 * // Result: z.object({ ui: ..., llm: ... }) - payments namespace excluded
 * ```
 */
export function pickFlags<
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
