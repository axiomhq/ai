import { afterAll, beforeAll, describe, inject, it } from 'vitest';
import { context, SpanStatusCode, trace, type Context } from '@opentelemetry/api';
import { customAlphabet } from 'nanoid';
import { withEvalContext, getEvalContext, getConfigScope } from './context/storage';

import { Attr } from '../otel/semconv/attributes';
import type { ResolvedAxiomConfig } from '../config/index';
import { startSpan, flush, ensureInstrumentationInitialized } from './instrument';
import { getGitUserInfo } from './git-info';
import type {
  CollectionRecord,
  EvalParams,
  EvalTask,
  InputOf,
  ExpectedOf,
  OutputOf,
  EvaluationReport,
  EvalCaseReport,
  RuntimeFlagLog,
  OutOfScopeFlag,
} from './eval.types';
import type { Score, ScoreWithName } from './scorers';
import { findBaseline, findEvaluationCases } from './eval.service';
import { getGlobalFlagOverrides, setGlobalFlagOverrides } from './context/global-flags';
import { deepEqual } from '../util/deep-equal';
import { dotNotationToNested } from '../util/dot-path';
import { AxiomCLIError } from '../cli/errors';

declare module 'vitest' {
  interface TestSuiteMeta {
    evaluation: EvaluationReport;
  }
  interface TaskMeta {
    case: EvalCaseReport;
    evaluation: EvaluationReport;
  }
  export interface ProvidedContext {
    baseline?: string;
    debug?: boolean;
    overrides?: Record<string, any>;
    axiomConfig?: ResolvedAxiomConfig;
  }
}

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

/**
 * Creates and registers an evaluation suite with the given name and parameters.
 *
 * This function sets up a complete evaluation pipeline that will run your {@link EvalTask}
 * against a dataset, score the results, and provide detailed {@link EvalCaseReport} reporting.
 *
 * @experimental This API is experimental and may change in future versions.
 *
 * @param name - Human-readable name for the evaluation suite
 * @param params - {@link EvalParams} configuration parameters for the evaluation
 *
 * @example
 * ```typescript
 * import { experimental_Eval as Eval } from 'axiom/ai/evals';
 *
 * Eval('Text Generation Quality', {
 *   data: async () => [
 *     { input: 'Explain photosynthesis', expected: 'Plants convert light to energy...' },
 *     { input: 'What is gravity?', expected: 'Gravity is a fundamental force...' }
 *   ],
 *   task: async ({ input }) => {
 *     const result = await generateText({
 *       model: yourModel,
 *       prompt: input
 *     });
 *     return result.text;
 *   },
 *   scorers: [similarityScorer, factualAccuracyScorer],
 * });
 * ```
 */
export function Eval<
  // Inference-friendly overload – no explicit generics required by callers.
  Data extends readonly CollectionRecord<any, any>[],
  TaskFn extends (args: {
    input: InputOf<Data>;
    expected: ExpectedOf<Data>;
  }) => string | Record<string, any> | Promise<string | Record<string, any>>,
>(
  name: string,
  params: Omit<
    EvalParams<InputOf<Data>, ExpectedOf<Data>, OutputOf<TaskFn>>,
    'data' | 'task' | 'scorers'
  > & {
    data: () => Data | Promise<Data>;
    task: TaskFn;
    scorers: ReadonlyArray<
      (args: {
        input: InputOf<Data>;
        expected: ExpectedOf<Data>;
        output: OutputOf<TaskFn>;
      }) => Score | Promise<Score>
    >;
  },
): void;

/**
 * Explicit generics overload – allows users to pass explicit types.
 */
export function Eval<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
>(name: string, params: EvalParams<TInput, TExpected, TOutput>): void;

/**
 * Implementation
 */
export function Eval(name: string, params: any): void {
  registerEval(name, params as EvalParams<any, any, any>).catch(console.error);
}

/**
 * Capture full flag configuration filtered by configFlags scope
 */
function captureFlagConfig(configFlags?: string[]): Record<string, any> {
  if (!configFlags || configFlags.length === 0) {
    return {};
  }

  const scope = getConfigScope();
  const allDefaults = scope?.getAllDefaultFlags?.() ?? {};
  const overrides = getGlobalFlagOverrides();

  const merged = { ...allDefaults, ...overrides };

  // Filter to only flags in configFlags scope
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(merged)) {
    const isInScope = configFlags.some((pattern) => key.startsWith(pattern));
    if (isInScope) {
      filtered[key] = value;
    }
  }

  return dotNotationToNested(filtered);
}

async function registerEval<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
>(evalName: string, opts: EvalParams<TInput, TExpected, TOutput>) {
  const datasetPromise = opts.data();
  const user = getGitUserInfo();

  // check if user passed a specific baseline id to the CLI
  const baselineId = inject('baseline');
  const isDebug = inject('debug');
  const injectedOverrides = inject('overrides');
  const axiomConfig = inject('axiomConfig');

  if (!axiomConfig) {
    throw new AxiomCLIError('Axiom config not found');
  }

  const instrumentationReady = !isDebug
    ? ensureInstrumentationInitialized(axiomConfig)
    : Promise.resolve();

  const result = await describe(
    `evaluate: ${evalName}`,
    async () => {
      const dataset = await datasetPromise;

      const baseline = isDebug
        ? undefined
        : baselineId
          ? await findEvaluationCases(baselineId, axiomConfig)
          : await findBaseline(evalName, axiomConfig);

      // create a version code
      const evalVersion = nanoid();
      let evalId = ''; // get traceId

      let suiteSpan: ReturnType<typeof startSpan> | undefined;
      let suiteContext: Context | undefined;
      let instrumentationError: unknown = undefined;

      // Track out-of-scope flags across all cases for evaluation-level reporting
      const allOutOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[] =
        [];

      // Track final config snapshot from the last executed case for reporter printing
      let finalConfigSnapshot:
        | { flags: Record<string, any>; pickedFlags?: string[]; overrides?: Record<string, any> }
        | undefined;

      beforeAll(async (suite) => {
        try {
          await instrumentationReady;
        } catch (error) {
          instrumentationError = error;
          throw error;
        }

        suiteSpan = startSpan(`eval ${evalName}-${evalVersion}`, {
          attributes: {
            [Attr.GenAI.Operation.Name]: 'eval',
            [Attr.Eval.Name]: evalName,
            [Attr.Eval.Version]: evalVersion,
            [Attr.Eval.Type]: 'regression', // TODO: where to get experiment type value from?
            [Attr.Eval.Tags]: [],
            [Attr.Eval.Collection.ID]: 'custom', // TODO: where to get dataset split value from?
            [Attr.Eval.Collection.Name]: 'custom', // TODO: where to get dataset name from?
            [Attr.Eval.Collection.Size]: dataset.length,
            // metadata
            'eval.metadata': JSON.stringify(opts.metadata),
            // baseline
            [Attr.Eval.BaselineID]: baseline ? baseline.id : undefined,
            [Attr.Eval.BaselineName]: baseline ? baseline.name : undefined,
            // user info
            [Attr.Eval.User.Name]: user?.name,
            [Attr.Eval.User.Email]: user?.email,
          },
        });
        evalId = suiteSpan.spanContext().traceId;
        suiteSpan.setAttribute(Attr.Eval.ID, evalId);
        suiteContext = trace.setSpan(context.active(), suiteSpan);

        // Ensure worker process knows CLI overrides
        if (injectedOverrides && Object.keys(injectedOverrides).length > 0) {
          try {
            setGlobalFlagOverrides(injectedOverrides);
          } catch {}
        }

        suite.meta.evaluation = {
          id: evalId,
          name: evalName,
          version: evalVersion,
          baseline: baseline ?? undefined,
          configFlags: opts.configFlags,
        };

        const flagConfig = captureFlagConfig(opts.configFlags);
        suite.meta.evaluation.flagConfig = flagConfig;
        const flagConfigJson = JSON.stringify(flagConfig);
        suiteSpan.setAttribute('eval.config.flags', flagConfigJson);
      });

      afterAll(async (suite) => {
        if (instrumentationError) {
          throw instrumentationError;
        }

        const tags: string[] = ['offline'];
        suiteSpan?.setAttribute(Attr.Eval.Tags, JSON.stringify(tags));

        // Aggregate out-of-scope flags for evaluation-level reporting
        const flagSummary = new Map<string, OutOfScopeFlag>();

        for (const flag of allOutOfScopeFlags) {
          if (flagSummary.has(flag.flagPath)) {
            const existing = flagSummary.get(flag.flagPath)!;
            existing.count++;
            existing.firstAccessedAt = Math.min(existing.firstAccessedAt, flag.accessedAt);
            existing.lastAccessedAt = Math.max(existing.lastAccessedAt, flag.accessedAt);
          } else {
            flagSummary.set(flag.flagPath, {
              flagPath: flag.flagPath,
              count: 1,
              firstAccessedAt: flag.accessedAt,
              lastAccessedAt: flag.accessedAt,
              stackTrace: flag.stackTrace,
            });
          }
        }

        // Update evaluation report with aggregated out-of-scope flags
        if (suite.meta.evaluation && suiteSpan) {
          suite.meta.evaluation.outOfScopeFlags = Array.from(flagSummary.entries()).map(
            ([_flagPath, stats]) => stats,
          );

          // Attach end-of-suite config snapshot for reporter printing
          const allDefaults = getConfigScope()?.getAllDefaultFlags();
          const pickedFlags = finalConfigSnapshot?.pickedFlags;
          const overrides = injectedOverrides ?? getGlobalFlagOverrides();

          suite.meta.evaluation.configEnd = {
            flags: allDefaults,
            pickedFlags,
            overrides,
          };
        }

        // end root span
        suiteSpan?.setStatus({ code: SpanStatusCode.OK });
        suiteSpan?.end();
        await flush();
      });

      type CollectionRecordWithIndex = { index: number } & CollectionRecord<TInput, TExpected>;

      await it.concurrent.for(
        dataset.map((d, index) => ({ ...d, index }) satisfies CollectionRecordWithIndex),
      )('case', async (data: CollectionRecordWithIndex, { task }) => {
        const start = performance.now();
        if (!suiteContext) {
          throw new Error(
            '[Axiom AI] Suite context not initialized. This is likely a bug – instrumentation should complete before tests run.',
          );
        }

        const caseSpan = startSpan(
          `case ${data.index}`,
          {
            attributes: {
              [Attr.GenAI.Operation.Name]: 'eval.case',
              [Attr.Eval.ID]: evalId,
              [Attr.Eval.Name]: evalName,
              [Attr.Eval.Version]: evalVersion,
              [Attr.Eval.Case.Index]: data.index,
              [Attr.Eval.Case.Input]:
                typeof data.input === 'string' ? data.input : JSON.stringify(data.input),
              [Attr.Eval.Case.Expected]:
                typeof data.expected === 'string' ? data.expected : JSON.stringify(data.expected),
              // user info
              [Attr.Eval.User.Name]: user?.name,
              [Attr.Eval.User.Email]: user?.email,
            },
          },
          suiteContext,
        );
        const caseContext = trace.setSpan(context.active(), caseSpan);

        let outOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[] = [];
        try {
          const result = await runTask(
            caseContext,
            {
              id: evalId,
              version: evalVersion,
              name: evalName,
            },
            {
              index: data.index,
              expected: data.expected,
              input: data.input,
              scorers: opts.scorers,
              task: opts.task,
              metadata: opts.metadata,
              configFlags: opts.configFlags,
            },
          );
          const { output, duration } = result;
          outOfScopeFlags = result.outOfScopeFlags;

          finalConfigSnapshot = {
            flags: result.finalFlags || {},
            pickedFlags: opts.configFlags,
            overrides: result.overrides,
          };

          const scoreList: ScoreWithName[] = await Promise.all(
            opts.scorers.map(async (scorer) => {
              const scorerName = (scorer as any).name || 'unknown';
              const scorerSpan = startSpan(
                `score ${scorerName}`,
                {
                  attributes: {
                    [Attr.GenAI.Operation.Name]: 'eval.score',
                    [Attr.Eval.ID]: evalId,
                    [Attr.Eval.Name]: evalName,
                    [Attr.Eval.Version]: evalVersion,
                  },
                },
                caseContext,
              );

              const start = performance.now();
              const result = await scorer({
                input: data.input,
                output,
                expected: data.expected as any,
              });

              const duration = Math.round(performance.now() - start);
              const scoreValue = result.score as number;

              scorerSpan.setAttributes({
                [Attr.Eval.Score.Name]: scorerName,
                [Attr.Eval.Score.Value]: scoreValue,
              });

              scorerSpan.setStatus({ code: SpanStatusCode.OK });
              scorerSpan.end();

              return {
                name: scorerName,
                ...result,
                metadata: { duration, startedAt: start, error: null },
              };
            }),
          );

          const scores = Object.fromEntries(scoreList.map((s) => [s.name, s]));

          caseSpan.setAttributes({
            [Attr.Eval.Case.Output]: typeof output === 'string' ? output : JSON.stringify(output),
            [Attr.Eval.Case.Scores]: JSON.stringify(scores ? scores : {}),
          });
          caseSpan.setStatus({ code: SpanStatusCode.OK });

          // set task meta for showing result in vitest report
          task.meta.case = {
            index: data.index,
            name: evalName,
            expected: data.expected,
            input: data.input,
            output: output,
            scores,
            status: 'success',
            errors: [],
            duration,
            startedAt: start,
            outOfScopeFlags,
            pickedFlags: opts.configFlags,
          };

          // Collect out-of-scope flags for evaluation-level aggregation
          allOutOfScopeFlags.push(...outOfScopeFlags);
        } catch (e) {
          console.log(e);
          const error = e as Error;
          caseSpan.recordException(error);
          caseSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

          const ctx = getEvalContext();
          outOfScopeFlags =
            ctx.outOfScopeFlags ||
            ([] as { flagPath: string; accessedAt: number; stackTrace: string[] }[]);

          task.meta.case = {
            name: evalName,
            index: data.index,
            expected: data.expected,
            input: data.input,
            output: String(e),
            scores: {},
            status: 'fail',
            errors: [error],
            startedAt: start,
            duration: Math.round(performance.now() - start),
            outOfScopeFlags,
            pickedFlags: opts.configFlags,
          };

          allOutOfScopeFlags.push(...outOfScopeFlags);
          throw e;
        } finally {
          // Compute per-case runtime flags report and attach to span/meta
          try {
            const DEBUG = process.env.AXIOM_DEBUG === 'true';

            const accessedFlags: Record<string, any> = finalConfigSnapshot?.flags || {};

            const accessed = Object.keys(accessedFlags);
            const allDefaults = getConfigScope()?.getAllDefaultFlags?.() ?? {};

            const runtimeFlags: Record<string, RuntimeFlagLog> = {};
            for (const key of accessed) {
              const value = accessedFlags[key];
              if (key in allDefaults) {
                const replaced = !deepEqual(value, allDefaults[key]);
                if (replaced) {
                  runtimeFlags[key] = { kind: 'replaced', value, default: allDefaults[key] };
                }
              } else {
                runtimeFlags[key] = { kind: 'introduced', value };
              }
            }

            if (!DEBUG && Object.keys(runtimeFlags).length > 0) {
              const serialized = JSON.stringify(runtimeFlags);
              caseSpan.setAttribute('eval.case.config.runtime_flags', serialized);
            }

            if (task.meta.case) {
              task.meta.case.runtimeFlags = runtimeFlags;
            }
          } catch {}
          caseSpan.end();
        }
      });
    },
    axiomConfig?.eval.timeoutMs,
  );

  return result;
}

const joinArrayOfUnknownResults = <T extends string | Record<string, any>>(results: T[]): T => {
  if (results.length === 0) {
    return '' as unknown as T;
  }

  // If all results are strings, concatenate them
  if (results.every((r) => typeof r === 'string')) {
    return results.join('') as unknown as T;
  }

  // If we have objects, return the last one (streaming typically overwrites)
  return results[results.length - 1];
};

const executeTask = async <
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
>(
  task: EvalTask<TInput, TExpected, TOutput>,
  input: TInput,
  expected: TExpected,
): Promise<TOutput> => {
  const taskResultOrStream = await task({ input, expected });

  if (
    typeof taskResultOrStream === 'object' &&
    taskResultOrStream &&
    Symbol.asyncIterator in taskResultOrStream
  ) {
    const chunks: TOutput[] = [];

    for await (const chunk of taskResultOrStream) {
      chunks.push(chunk);
    }

    return joinArrayOfUnknownResults<TOutput>(chunks as TOutput[]);
  }

  return taskResultOrStream;
};

const runTask = async <
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
>(
  caseContext: Context,
  evaluation: {
    id: string;
    name: string;
    version: string;
  },
  opts: {
    index: number;
    input: TInput;
    expected: TExpected | undefined;
  } & Omit<EvalParams<TInput, TExpected, TOutput>, 'data'>,
  // TODO: EXPERIMENTS - we had `evalScope` here before... need to figure out what to do instead
) => {
  const taskName = opts.task.name ?? 'anonymous';
  // start task span
  const taskSpan = startSpan(
    `task`,
    {
      attributes: {
        [Attr.GenAI.Operation.Name]: 'eval.task',
        [Attr.Eval.Task.Name]: taskName,
        [Attr.Eval.Task.Type]: 'llm_completion', // TODO: How to determine task type?
        [Attr.Eval.ID]: evaluation.id,
        [Attr.Eval.Name]: evaluation.name,
        [Attr.Eval.Version]: evaluation.version,
      },
    },
    caseContext,
  );

  const { output, duration, outOfScopeFlags, finalFlags, overrides } = await context.with(
    trace.setSpan(context.active(), taskSpan),
    async (): Promise<{
      output: TOutput;
      duration: number;
      outOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
      finalFlags: Record<string, any>;
      overrides?: Record<string, any>;
    }> => {
      // Initialize evaluation context for flag/fact access
      return withEvalContext(
        { pickedFlags: opts.configFlags },
        async (): Promise<{
          output: TOutput;
          duration: number;
          outOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
          finalFlags: Record<string, any>;
          overrides?: Record<string, any>;
        }> => {
          // TODO: EXPERIMENTS - before we were setting config scope if provided here

          const start = performance.now();
          const output = await executeTask(opts.task, opts.input, opts.expected!);
          const duration = Math.round(performance.now() - start);
          // set task output
          taskSpan.setAttributes({
            [Attr.Eval.Task.Output]: JSON.stringify(output),
          });

          taskSpan.setStatus({ code: SpanStatusCode.OK });
          taskSpan.end();

          // Get out-of-scope flags from the evaluation context
          const ctx = getEvalContext();
          const outOfScopeFlags = ctx.outOfScopeFlags || [];

          return {
            output,
            duration,
            outOfScopeFlags,
            finalFlags: ctx.flags || {},
            overrides: ctx.overrides,
          };
        },
      );
    },
  );

  return {
    output,
    duration,
    outOfScopeFlags,
    finalFlags,
    overrides,
  };
};
