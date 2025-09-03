import type { EvalParams } from './eval.types';
import { Eval } from './eval'; // existing Eval function
import { withEvalContext } from './context/storage';

export interface EvalBuilder<AllowedFlags extends Record<string, any> = {}> {
  withFlags<F extends Partial<AllowedFlags>>(flags: F): EvalBuilder<AllowedFlags>;
  withModel(model: string): EvalBuilder<AllowedFlags>;
  withTimeout(timeout: number): EvalBuilder<AllowedFlags>;
  run(suffix?: string): void; // registers with Vitest
}

class EvalBuilderImpl<AllowedFlags extends Record<string, any> = {}>
  implements EvalBuilder<AllowedFlags>
{
  private hasRun = false; // Prevent double registration

  constructor(
    private name: string,
    private params: EvalParams,
    private overrides: {
      flags?: Partial<AllowedFlags>;
      model?: string;
      timeout?: number;
    } = {},
  ) {}

  withFlags<F extends Partial<AllowedFlags>>(flags: F): EvalBuilder<AllowedFlags> {
    return new EvalBuilderImpl(this.name, this.params, {
      ...this.overrides,
      flags: { ...this.overrides.flags, ...flags },
    });
  }

  withModel(model: string): EvalBuilder<AllowedFlags> {
    return new EvalBuilderImpl(this.name, this.params, {
      ...this.overrides,
      model,
    });
  }

  withTimeout(timeout: number): EvalBuilder<AllowedFlags> {
    return new EvalBuilderImpl(this.name, this.params, {
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
    const finalParams: EvalParams = {
      ...this.params,
      ...(this.overrides.model && { model: this.overrides.model }),
      ...(this.overrides.timeout && { timeout: this.overrides.timeout }),
    };

    // If flags are overridden, wrap the task to set flag context
    if (this.overrides.flags && Object.keys(this.overrides.flags).length > 0) {
      const originalTask = finalParams.task;
      finalParams.task = async (args) => {
        return withEvalContext(this.overrides.flags!, () => {
          return originalTask(args);
        });
      };
    }

    // Call existing Eval function - this handles all Vitest registration
    Eval(finalName, finalParams);
  }
}

/**
 * Create a new eval builder that can be composed with .withFlags(), .run(), etc.
 * This is the new API alongside the existing Eval() function.
 */
export function defineEval<AllowedFlags extends Record<string, any> = {}>(
  name: string,
  params: EvalParams,
): EvalBuilder<AllowedFlags> {
  return new EvalBuilderImpl<AllowedFlags>(name, params);
}

/**
 * Pre-typed defineEval for app-specific flag/fact types.
 * Created by: const defineAppEval = createTypedDefineEval<AppFlags>();
 */
export function createTypedDefineEval<AppFlags extends Record<string, any>>() {
  return function defineAppEval(name: string, params: EvalParams): EvalBuilder<AppFlags> {
    return defineEval<AppFlags>(name, params);
  };
}
