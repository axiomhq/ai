import { trace } from '@opentelemetry/api';
import { type z, type ZodObject, type ZodDefault } from 'zod';
import { getEvalContext, updateEvalContext } from './evals/context/storage';
import { getGlobalFlagOverrides } from './evals/context/global-flags';
import { validateCliFlags } from './validate-flags';

export interface AppScopeConfig<
  FS extends ZodObject<any> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
> {
  // TODO: BEFORE MERGE - do we want to allow instantiating without flagSchema?
  // maybe a user only wants facts?
  flagSchema: FS;
  factSchema?: SC;
}

// Helper types to detect which fields have defaults in the schema
type SchemaDefaults<T extends ZodObject<any>> =
  {
    [K in keyof T['shape'] as T['shape'][K] extends ZodDefault<any> ? K : never]: K;
  } extends Record<infer Keys, any>
    ? Keys
    : never;

// Helper types for better error messages and type inference
type FlagFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? {
        // Overload for fields with schema defaults - can pass only key, or key and value
        <N extends SchemaDefaults<FS>>(name: N): z.output<FS>[N];
        // Overload for any field with explicit default - key and value required for fields without schema defaults
        <N extends keyof z.output<FS>>(name: N, defaultValue: z.output<FS>[N]): z.output<FS>[N];
      }
    : <N extends string>(name: N, defaultValue: any) => any;

type FactFunction<SC extends ZodObject<any> | undefined> =
  SC extends ZodObject<any>
    ? <N extends keyof z.output<SC>>(name: N, value: z.output<SC>[N]) => void
    : 'Error: fact() requires a factSchema to be provided in createAppScope({ factSchema })';

export interface AppScope<
  FS extends ZodObject<any> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: FlagFunction<FS>;
  fact: FactFunction<SC>;
}

class InvalidFlagError extends Error {
  constructor(
    message: string,
    public zodError: z.ZodError,
  ) {
    super(message);
    this.name = 'InvalidFlagError';
  }
}

class InvalidFactError extends Error {
  constructor(
    message: string,
    public zodError: z.ZodError,
  ) {
    super(message);
    this.name = 'InvalidFactError';
  }
}

// Schema-only API
export function createAppScope<
  FS extends ZodObject<any> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
>(config: AppScopeConfig<FS, SC>): AppScope<FS, SC>;

export function createAppScope<
  FS extends ZodObject<any> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
>(config: AppScopeConfig<FS, SC>): AppScope<FS, SC> {
  // Store schemas for runtime validation (if provided)
  const flagSchema = config?.flagSchema;
  const factSchema = config?.factSchema;

  // Automatically validate CLI flags if flagSchema is provided
  if (flagSchema) {
    validateCliFlags(flagSchema);
  }

  /**
   * Get a typed flag value.
   * Checks context overrides first, then provided default, then schema defaults.
   * Validates using schema if provided.
   */
  function flag<N extends string>(name: N, defaultValue?: any): any {
    const ctx = getEvalContext();
    const globalOverrides = getGlobalFlagOverrides();

    let finalValue: any;
    let hasValue = false;

    // Check global CLI overrides first (highest priority)
    if (name in globalOverrides) {
      finalValue = globalOverrides[name];
      hasValue = true;
    }
    // Check context overrides (from withFlags() or overrideFlags)
    else if (name in ctx.flags) {
      finalValue = ctx.flags[name];
      hasValue = true;
    }
    // Use provided default (overrides schema default)
    else if (defaultValue !== undefined) {
      finalValue = defaultValue;
      hasValue = true;
    }
    // If no override or explicit default, try schema default
    else if (flagSchema) {
      try {
        // Try to parse just the field to see if it has a default
        const fieldSchema = flagSchema.shape[name];
        if (fieldSchema && '_def' in fieldSchema) {
          const fieldDef = fieldSchema._def;
          if (fieldDef.defaultValue !== undefined) {
            finalValue =
              typeof fieldDef.defaultValue === 'function'
                ? fieldDef.defaultValue()
                : fieldDef.defaultValue;
            hasValue = true;
          }
        }
      } catch {
        // Schema inspection failed, continue
      }
    }

    if (!hasValue) {
      // TODO: BEFORE MERGE - what should we do here? error? log? user decides in config?
      // throw new Error(`Flag '${name}' is required but not provided and has no default value`);
      console.error(`Flag '${name}' is required but not provided and has no default value`);
    }

    // Validate with schema if provided
    if (flagSchema) {
      const result = flagSchema
        .strict()
        .partial()
        .safeParse({ [name]: finalValue });
      if (!result.success) {
        throw new InvalidFlagError(`Flag '${name}' validation failed`, result.error);
      }
      // Use validated value in case of coercion
      finalValue = result.data[name] ?? finalValue;
    }

    // Store accessed flag for tracking
    updateEvalContext({ [name]: finalValue });

    // Write to current active span
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      span.setAttributes({ [`flag.${name}`]: String(finalValue) });
    }

    return finalValue;
  }

  /**
   * Record a typed fact value.
   * Facts are write-only, no defaults needed.
   * Validates using schema if provided.
   */
  function fact<N extends string>(name: N, value: any): void {
    let finalValue = value;

    // Validate with schema if provided
    if (factSchema) {
      const result = factSchema
        .strict()
        .partial()
        .safeParse({ [name]: value });
      if (!result.success) {
        throw new InvalidFactError(`Fact '${name}' validation failed`, result.error);
      }
      // Use validated value in case of coercion
      finalValue = result.data[name] ?? value;
    }

    // Store in context for tracking
    updateEvalContext(undefined, { [name]: finalValue });

    // Write to current active span
    // TODO: BEFORE MERGE - is this what we want?
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      span.setAttributes({ [`fact.${name}`]: String(finalValue) });
      // Also record as timestamped event for time-series data
      span.addEvent('fact.recorded', {
        [`fact.${name}`]: String(finalValue),
      });
    }
  }

  return {
    flag: flag as FlagFunction<FS>,
    fact: fact as FactFunction<SC>,
  };
}
