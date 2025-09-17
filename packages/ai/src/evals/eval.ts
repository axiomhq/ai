import { afterAll, beforeAll, describe, inject, it } from 'vitest';
import { context, SpanStatusCode, trace, type Context } from '@opentelemetry/api';
import { customAlphabet } from 'nanoid';
import { withEvalContext, getEvalContext } from './context/storage';

import { Attr } from '../otel/semconv/attributes';
import { startSpan, flush } from './instrument';
import { getGitUserInfo } from './git-info';
import type { CollectionRecord, EvalParams, EvalTask, InputOf, ExpectedOf } from './eval.types';
import type { Score, Scorer } from './scorers';
import { findBaseline, findEvaluationCases } from './eval.service';
import type { EvalCaseReport, EvaluationReport } from './reporter';
import { DEFAULT_TIMEOUT } from './run-vitest';

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
  const Data extends readonly { input: any; expected: any }[],
  Out extends string | Record<string, any>,
  TaskFn extends EvalTask<InputOf<Data>, ExpectedOf<Data>, Out>,
  In = InputOf<Data>,
  Exp = ExpectedOf<Data>,
>(
  name: string,
  params: {
    data: () => Data | Promise<Data>;
    task: TaskFn;
    scorers: ReadonlyArray<Scorer<In, Exp, Out>>;
    metadata?: Record<string, unknown>;
    timeout?: number;
    configFlags?: string[];
  },
): void;

/**
 *
 */
export function Eval<
  // Explicit generics overload – allows users to pass explicit types.
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

async function registerEval<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
>(evalName: string, opts: EvalParams<TInput, TExpected, TOutput>) {
  const datasetPromise = opts.data();
  const user = getGitUserInfo();

  // TODO: BEFORE MERGE - we were creating `evalScope` here before

  // check if user passed a specific baseline id to the CLI
  const baselineId = inject('baseline');

  const result = await describe(
    `evaluate: ${evalName}`,
    async () => {
      const dataset = await datasetPromise;
      // if user passed a baseline id, if not, find the latest evaluation and use it as a baseline
      const baseline = baselineId
        ? await findEvaluationCases(baselineId)
        : await findBaseline(evalName);
      // create a version code
      const evalVersion = nanoid();
      let evalId = ''; // get traceId

      const suiteSpan = startSpan(`eval ${evalName}-${evalVersion}`, {
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

      const suiteContext = trace.setSpan(context.active(), suiteSpan);

      // Track out-of-scope flags across all cases for evaluation-level reporting
      const allOutOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[] =
        [];

      beforeAll((suite) => {
        suite.meta.evaluation = {
          id: evalId,
          name: evalName,
          version: evalVersion,
          baseline: baseline ?? undefined,
        };
      });

      afterAll(async (suite) => {
        const tags: string[] = ['offline'];
        suiteSpan.setAttribute(Attr.Eval.Tags, JSON.stringify(tags));

        // Aggregate out-of-scope flags for evaluation-level reporting
        const flagSummary = new Map<
          string,
          { count: number; firstAccessedAt: number; lastAccessedAt: number }
        >();

        for (const flag of allOutOfScopeFlags) {
          if (flagSummary.has(flag.flagPath)) {
            const existing = flagSummary.get(flag.flagPath)!;
            existing.count++;
            existing.firstAccessedAt = Math.min(existing.firstAccessedAt, flag.accessedAt);
            existing.lastAccessedAt = Math.max(existing.lastAccessedAt, flag.accessedAt);
          } else {
            flagSummary.set(flag.flagPath, {
              count: 1,
              firstAccessedAt: flag.accessedAt,
              lastAccessedAt: flag.accessedAt,
            });
          }
        }

        // Update evaluation report with aggregated out-of-scope flags
        if (suite.meta.evaluation) {
          suite.meta.evaluation.outOfScopeFlags = Array.from(flagSummary.entries()).map(
            ([flagPath, stats]) => ({
              flagPath,
              ...stats,
            }),
          );
        }

        // end root span
        suiteSpan.setStatus({ code: SpanStatusCode.OK });
        suiteSpan.end();
        await flush();
      });

      await it.concurrent.for(dataset.map((d, index) => ({ ...d, index })))(
        'case',
        async (data: { index: number } & CollectionRecord<TInput, TExpected>, { task }) => {
          const start = performance.now();
          const caseSpan = startSpan(
            `case ${data.index}`,
            {
              attributes: {
                [Attr.GenAI.Operation.Name]: 'eval.case',
                [Attr.Eval.ID]: evalId,
                [Attr.Eval.Name]: evalName,
                [Attr.Eval.Version]: evalName,
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

          let outOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[] =
            [];
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

            // run scorers
            const scoreList: Score[] = await Promise.all(
              opts.scorers.map(async (scorer) => {
                const scorerSpan = startSpan(
                  `score ${scorer.name}`,
                  {
                    attributes: {
                      [Attr.GenAI.Operation.Name]: 'eval.score',
                      [Attr.Eval.ID]: evalId,
                      [Attr.Eval.Name]: evalName,
                      [Attr.Eval.Version]: evalName,
                    },
                  },
                  caseContext,
                );

                const start = performance.now();
                const result = await scorer({
                  input: data.input,
                  output,
                  expected: data.expected,
                });

                const duration = Math.round(performance.now() - start);
                const scoreValue = result.score as number;

                // set score value to the score span
                scorerSpan.setAttributes({
                  [Attr.Eval.Score.Name]: result.name, // make sure to use name returned by result not the name of scorer function
                  [Attr.Eval.Score.Value]: scoreValue,
                });

                scorerSpan.setStatus({ code: SpanStatusCode.OK });
                scorerSpan.end();

                return {
                  ...result,
                  metadata: { duration, startedAt: start, error: null },
                };
              }),
            );

            const scores = Object.fromEntries(scoreList.map((s) => [s.name, s]));

            // set case output
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

            // Try to get out-of-scope flags even in error case
            try {
              const ctx = getEvalContext();
              outOfScopeFlags =
                ctx.outOfScopeFlags ||
                ([] as { flagPath: string; accessedAt: number; stackTrace: string[] }[]);
            } catch {
              // If we can't get context, use empty array
              outOfScopeFlags = [] as {
                flagPath: string;
                accessedAt: number;
                stackTrace: string[];
              }[];
            }

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

            // Collect out-of-scope flags for evaluation-level aggregation even in error case
            allOutOfScopeFlags.push(...outOfScopeFlags);
            throw e;
          } finally {
            caseSpan.end();
          }
        },
      );
    },
    DEFAULT_TIMEOUT,
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
  // TODO: BEFORE MERGE - we had `evalScope` here before... need to figure out what to do instead
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

  const { output, duration, outOfScopeFlags } = await context.with(
    trace.setSpan(context.active(), taskSpan),
    async (): Promise<{
      output: TOutput;
      duration: number;
      outOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
    }> => {
      // Initialize evaluation context for flag/fact access
      return withEvalContext(
        { pickedFlags: opts.configFlags },
        async (): Promise<{
          output: TOutput;
          duration: number;
          outOfScopeFlags: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
        }> => {
          // TODO: BEFORE MERGE - before we were setting config scope if provided here

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

          return { output, duration, outOfScopeFlags };
        },
      );
    },
  );

  return {
    output,
    duration,
    outOfScopeFlags,
  };
};
