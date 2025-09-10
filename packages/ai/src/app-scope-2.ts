import { type z, type ZodObject } from 'zod';

export interface AppScope2Config<
  FS extends Record<string, ZodObject<any>> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
> {
  flagSchema: FS;
  factSchema?: SC;
}

// Helper types for extracting namespace keys (for future use)
// type NamespaceKeys<T extends Record<string, ZodObject<any>>> = keyof T;

// Helper types for extracting flag keys from a specific namespace (for future use)
// type FlagKeys<
//   T extends Record<string, ZodObject<any>>,
//   N extends NamespaceKeys<T>
// > = keyof z.output<T[N]>;

// Helper types to detect which fields have defaults in the schema (for future use)
// type SchemaDefaults<T extends ZodObject<any>> =
//   {
//     [K in keyof T['shape'] as T['shape'][K] extends any ? K : never]: K;
//   } extends Record<infer Keys, any>
//     ? Keys
//     : never;

// Flag function for dot notation access  
type DotNotationFlagFunction<FS extends Record<string, ZodObject<any>> | undefined> =
  FS extends Record<string, ZodObject<any>>
    ? (path: string, defaultValue?: any) => any
    : (path: string, defaultValue?: any) => any;

type FactFunction<SC extends ZodObject<any> | undefined> =
  SC extends ZodObject<any>
    ? <N extends keyof z.output<SC>>(name: N, value: z.output<SC>[N]) => void
    : 'Error: fact() requires a factSchema to be provided in createAppScope2({ factSchema })';

export interface AppScope2<
  FS extends Record<string, ZodObject<any>> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: DotNotationFlagFunction<FS>;
  fact: FactFunction<SC>;
}

// Basic implementation scaffolding
export function createAppScope2<
  FS extends Record<string, ZodObject<any>> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
>(config: AppScope2Config<FS, SC>): AppScope2<FS, SC> {
  // Store schemas for runtime validation 
  const flagSchema = config?.flagSchema;

  // Helper function to split dot notation path and traverse schema
  function parsePath(path: string) {
    const segments = path.split('.');
    return segments;
  }

  // Helper function to traverse schema object to find the right schema for validation
  function findSchemaAtPath(segments: string[]): any {
    if (!flagSchema || segments.length === 0) return undefined;

    let current: any = flagSchema;
    
    // First segment should be the namespace
    const namespace = segments[0];
    if (!(namespace in current)) {
      return undefined;
    }
    
    current = current[namespace];
    
    // For now, just return the namespace schema - we'll implement deeper traversal later
    return current;
  }

  // TODO: Implement dot notation flag logic
  function flag(path: string, defaultValue?: any): any {
    const segments = parsePath(path);
    findSchemaAtPath(segments); // For now we parse but don't use the result
    
    // Basic implementation - just return defaultValue for now
    // In future units we'll implement actual value lookup and schema validation
    return defaultValue;
  }

  // TODO: Implement fact logic
  function fact<N extends string>(name: N, value: any): void {
    // Basic implementation that compiles
    console.log(`Recording fact ${name}:`, value);
  }

  return {
    flag: flag as DotNotationFlagFunction<FS>,
    fact: fact as FactFunction<SC>,
  };
}
