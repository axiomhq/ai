import { type z, type ZodObject } from 'zod';

export interface AppScope2Config<
  FS extends Record<string, ZodObject<any>> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
> {
  flagSchema: FS;
  factSchema?: SC;
}

// Helper types for extracting namespace keys
type NamespaceKeys<T extends Record<string, ZodObject<any>>> = keyof T;

// Helper types for extracting flag keys from a specific namespace
type FlagKeys<
  T extends Record<string, ZodObject<any>>,
  N extends NamespaceKeys<T>
> = keyof z.output<T[N]>;

// Helper types to detect which fields have defaults in the schema (for future use)
// type SchemaDefaults<T extends ZodObject<any>> =
//   {
//     [K in keyof T['shape'] as T['shape'][K] extends any ? K : never]: K;
//   } extends Record<infer Keys, any>
//     ? Keys
//     : never;

// Flag function for namespaced access
type NamespacedFlagFunction<FS extends Record<string, ZodObject<any>> | undefined> =
  FS extends Record<string, ZodObject<any>>
    ? {
        // Access single flag: flag('ui', 'theme')
        <N extends NamespaceKeys<FS>, K extends FlagKeys<FS, N>>(
          namespace: N,
          key: K
        ): z.output<FS[N]>[K];
        // Access whole namespace: flag('ui')
        <N extends NamespaceKeys<FS>>(namespace: N): z.output<FS[N]>;
      }
    : <N extends string, K extends string>(namespace: N, key?: K) => any;

type FactFunction<SC extends ZodObject<any> | undefined> =
  SC extends ZodObject<any>
    ? <N extends keyof z.output<SC>>(name: N, value: z.output<SC>[N]) => void
    : 'Error: fact() requires a factSchema to be provided in createAppScope2({ factSchema })';

export interface AppScope2<
  FS extends Record<string, ZodObject<any>> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: NamespacedFlagFunction<FS>;
  fact: FactFunction<SC>;
}

// Basic implementation scaffolding
export function createAppScope2<
  FS extends Record<string, ZodObject<any>> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
>(_config: AppScope2Config<FS, SC>): AppScope2<FS, SC> {
  // Store schemas for runtime validation (will be used in future implementation)
  // const flagSchema = config?.flagSchema;
  // const factSchema = config?.factSchema;

  // TODO: Implement namespaced flag logic
  function flag<N extends string, K extends string>(_namespace: N, key?: K): any {
    // Basic implementation that compiles
    if (key === undefined) {
      // Return whole namespace
      return {};
    }
    // Return single flag
    return undefined;
  }

  // TODO: Implement fact logic
  function fact<N extends string>(name: N, value: any): void {
    // Basic implementation that compiles
    console.log(`Recording fact ${name}:`, value);
  }

  return {
    flag: flag as NamespacedFlagFunction<FS>,
    fact: fact as FactFunction<SC>,
  };
}
