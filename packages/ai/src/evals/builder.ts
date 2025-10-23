import type { EvalParams } from './eval.types';
import { Eval } from './eval'; // existing Eval function
import { withEvalContext } from './context/storage';

export interface EvalBuilder<
  AllowedFlags extends Record<string, any> = {},
  TInput extends string | Record<string, any> = string,
  TExpected extends string | Record<string, any> = string,
  TOutput extends string | Record<string, any> = string,
> {
  withFlags<F extends Partial<AllowedFlags>>(
    flags: F,
  ): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput>;
  withModel(model: string): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput>;
  withTimeout(timeout: number): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput>;
  run(suffix?: string): void; // registers with Vitest
}

class EvalBuilderImpl<
  AllowedFlags extends Record<string, any> = {},
  TInput extends string | Record<string, any> = string,
  TExpected extends string | Record<string, any> = string,
  TOutput extends string | Record<string, any> = string,
> implements EvalBuilder<AllowedFlags, TInput, TExpected, TOutput>
{
  private hasRun = false; // Prevent double registration

  constructor(
    private name: string,
    private params: EvalParams<TInput, TExpected, TOutput>,
    private overrides: {
      flags?: Partial<AllowedFlags>;
      model?: string;
      timeout?: number;
    } = {},
  ) {}

  withFlags<F extends Partial<AllowedFlags>>(
    flags: F,
  ): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput> {
    return new EvalBuilderImpl<AllowedFlags, TInput, TExpected, TOutput>(this.name, this.params, {
      ...this.overrides,
      flags: { ...this.overrides.flags, ...flags },
    });
  }

  withModel(model: string): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput> {
    return new EvalBuilderImpl<AllowedFlags, TInput, TExpected, TOutput>(this.name, this.params, {
      ...this.overrides,
      model,
    });
  }

  withTimeout(timeout: number): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput> {
    return new EvalBuilderImpl<AllowedFlags, TInput, TExpected, TOutput>(this.name, this.params, {
      ...this.overrides,
      timeout,
    });
  }

  run(suffix = ''): void {
    if (this.hasRun) {
      throw new Error(`Eval "${this.name}" has already been run. Create a new builder instance.`);
    }
    this.hasRun = true;

    const finalName = suffix ? `${this.name}:${suffix}` : this.name;
    const finalParams: EvalParams<TInput, TExpected, TOutput> = {
      ...this.params,
      ...(this.overrides.model && { model: this.overrides.model }),
      ...(this.overrides.timeout && { timeout: this.overrides.timeout }),
    };

    // If flags are overridden, wrap the task to set flag context
    if (this.overrides.flags && Object.keys(this.overrides.flags).length > 0) {
      const originalTask = finalParams.task;
      finalParams.task = (args: { input: TInput; expected: TExpected }) => {
        return withEvalContext({ initialFlags: this.overrides.flags! }, () => originalTask(args));
      };
    }

    // Call existing Eval function - this handles all Vitest registration
    Eval<TInput, TExpected, TOutput>(finalName, finalParams);
  }
}

/**
 * Create a new eval builder that can be composed with .withFlags(), .run(), etc.
 * This is the new API alongside the existing Eval() function.
 */
export function defineEval<
  TInput extends string | Record<string, any> = string,
  TExpected extends string | Record<string, any> = string,
  TOutput extends string | Record<string, any> = string,
  AllowedFlags extends Record<string, any> = {},
>(
  name: string,
  params: EvalParams<TInput, TExpected, TOutput>,
): EvalBuilder<AllowedFlags, TInput, TExpected, TOutput> {
  return new EvalBuilderImpl<AllowedFlags, TInput, TExpected, TOutput>(name, params);
}

// TODO: BEFORE MERGE - note that this isn't used???
/**
 * Pre-typed defineEval for app-specific flag/fact types.
 * Created by: const defineAppEval = createTypedDefineEval<AppFlags>();
 */
export function createTypedDefineEval<AppFlags extends Record<string, any>>() {
  return function defineAppEval<
    TInput extends string | Record<string, any> = string,
    TExpected extends string | Record<string, any> = string,
    TOutput extends string | Record<string, any> = string,
  >(
    name: string,
    params: EvalParams<TInput, TExpected, TOutput>,
  ): EvalBuilder<AppFlags, TInput, TExpected, TOutput> {
    return defineEval<TInput, TExpected, TOutput, AppFlags>(name, params);
  };
}
