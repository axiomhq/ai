import { afterAll, beforeAll, describe, inject, it } from 'vitest';
import { context, SpanStatusCode, trace, type Context } from '@opentelemetry/api';
import { customAlphabet } from 'nanoid';
import { withEvalContext, getEvalContext, getConfigScope } from './context/storage';

import { Attr } from '../otel/semconv/attributes';
import type { ResolvedAxiomConfig } from '../config/index';
import { startActiveSpan, startSpan, flush, ensureInstrumentationInitialized } from './instrument';
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
  Evaluation,
  OutOfScopeFlagAccess,
} from './eval.types';
import type { ScoreWithName, ScorerLike } from './scorers';
import { EvaluationApiClient, findEvaluationCases } from './eval.service';
import { getGlobalFlagOverrides, setGlobalFlagOverrides } from './context/global-flags';
import { deepEqual } from '../util/deep-equal';
import { dotNotationToNested } from '../util/dot-path';
import { AxiomCLIError, errorToString } from '../cli/errors';
import type { ValidateName } from './name-validation';
import { recordName } from './name-validation-runtime';

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
    list?: boolean;
    overrides?: Record<string, any>;
    axiomConfig?: ResolvedAxiomConfig;
    runId: string;
  }
}

const createVersionId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

/**
 * Creates and registers an evaluation suite with the given name and parameters.
 *
 * This function sets up a complete evaluation pipeline that will run your {@link EvalTask}
 * against a dataset, score the results, and provide detailed {@link EvalCaseReport} reporting.
 *
 *
 * @param name - Human-readable name for the evaluation suite
 * @param params - {@link EvalParams} configuration parameters for the evaluation
 *
 * @example
 * ```typescript
 * import { Eval } from 'axiom/ai/evals';
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
  Name extends string = string,
>(
  name: ValidateName<Name>,
  params: Omit<
    EvalParams<InputOf<Data>, ExpectedOf<Data>, OutputOf<TaskFn>>,
    'data' | 'task' | 'scorers'
  > & {
    data: () => Data | Promise<Data>;
    task: TaskFn;
    scorers: ReadonlyArray<ScorerLike<InputOf<Data>, ExpectedOf<Data>, OutputOf<TaskFn>>>;
  },
): void;

/**
 * Explicit generics overload – allows users to pass explicit types.
 */
export function Eval<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
  Name extends string = string,
>(name: ValidateName<Name>, params: EvalParams<TInput, TExpected, TOutput>): void;

/**
 * Implementation
 */
export function Eval(name: string, params: any): void {
  // Record eval name for validation
  recordName('eval', name);

  // Record all scorer names for validation
  if (params.scorers) {
    for (const scorer of params.scorers) {
      const scorerName = getScorerName(scorer, '');
      recordName('scorer', scorerName);
    }
  }

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

const getScorerName = <TScorer extends ScorerLike<any, any, any>>(
  scorer: TScorer,
  fallback: string = 'unknown',
) => {
  return (scorer as any).name || fallback;
};

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
  const isList = inject('list');
  const injectedOverrides = inject('overrides');
  const axiomConfig = inject('axiomConfig');
  const runId = inject('runId');

  if (!axiomConfig) {
    throw new AxiomCLIError('Axiom config not found');
  }

  const timeoutMs = opts.timeout ?? axiomConfig?.eval.timeoutMs;

  const instrumentationReady =
    !isDebug && !isList ? ensureInstrumentationInitialized(axiomConfig) : Promise.resolve();

  const result = await describe(
    evalName,
    async () => {
      const dataset = await datasetPromise;

      const evaluationApiClient = new EvaluationApiClient(axiomConfig);

      // create a version code
      const evalVersion = createVersionId();
      let evalId = ''; // get traceId
      let suiteStart: number;

      let suiteSpan: ReturnType<typeof startSpan> | undefined;
      let suiteContext: Context | undefined;
      let instrumentationError: unknown = undefined;
      let baseline: Evaluation | null | undefined = undefined;

      // Track out-of-scope flags across all cases for evaluation-level reporting
      const allOutOfScopeFlags: OutOfScopeFlagAccess[] = [];

      // Track final config snapshot from the last executed case for reporter printing
      let finalConfigSnapshot:
        | { flags: Record<string, any>; pickedFlags?: string[]; overrides?: Record<string, any> }
        | undefined;

      beforeAll(async (suite) => {
        suite.meta.evaluation = {
          id: evalId,
          name: evalName,
          version: evalVersion,
          runId: runId,
          orgId: undefined,
          baseline: baseline ?? undefined,
          configFlags: opts.configFlags,
        };

        try {
          await instrumentationReady;
        } catch (error) {
          instrumentationError = error;
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
            // capability
            [Attr.Eval.Capability.Name]: opts.capability,
            [Attr.Eval.Step.Name]: opts.step ?? undefined,
            // metadata
            [Attr.Eval.Metadata]: JSON.stringify(opts.metadata),
            // run
            [Attr.Eval.Run.ID]: runId,
            // user info
            [Attr.Eval.User.Name]: user?.name,
            [Attr.Eval.User.Email]: user?.email,
          },
        });
        evalId = suiteSpan.spanContext().traceId;
        suite.meta.evaluation.id = evalId;
        suiteSpan.setAttribute(Attr.Eval.ID, evalId);
        suiteContext = trace.setSpan(context.active(), suiteSpan);

        const flagConfig = captureFlagConfig(opts.configFlags);
        suite.meta.evaluation.flagConfig = flagConfig;
        const flagConfigJson = JSON.stringify(flagConfig);
        suiteSpan.setAttribute(Attr.Eval.Config.Flags, flagConfigJson);

        const createEvalResponse = await evaluationApiClient.createEvaluation({
          id: evalId,
          name: evalName,
          capability: opts.capability,
          step: opts.step,
          dataset: axiomConfig.eval.dataset,
          version: evalVersion,
          baselineId: baselineId ?? undefined,
          runId: runId,
          totalCases: dataset.length,
          config: { overrides: injectedOverrides },
          configTimeoutMs: timeoutMs,
          metadata: opts.metadata,
          status: 'running',
        });

        const orgId = createEvalResponse?.data?.orgId;
        const resolvedBaselineId = createEvalResponse?.data?.baselineId;

        // Load baseline if we got a baselineId from the server
        try {
          if (!isDebug && !isList && resolvedBaselineId) {
            baseline = await findEvaluationCases(resolvedBaselineId, axiomConfig);
          }
        } catch (error) {
          console.error(`Failed to load baseline: ${errorToString(error)}`);
          instrumentationError = instrumentationError || error;
        }

        // Update span with baseline info
        if (baseline) {
          suiteSpan.setAttribute(Attr.Eval.Baseline.ID, baseline.id);
          suiteSpan.setAttribute(Attr.Eval.Baseline.Name, baseline.name);
          suiteSpan.setAttribute(Attr.Eval.Baseline.Version, baseline.version);
        }

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
          runId: runId,
          orgId: orgId ?? undefined,
          baseline: baseline ?? undefined,
          configFlags: opts.configFlags,
          registrationStatus: instrumentationError
            ? {
                status: 'failed',
                error: errorToString(instrumentationError),
              }
            : { status: 'success' },
        };

        suiteStart = performance.now();
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

        // flush traces before updating Evaluation in Axiom
        try {
          await flush();
        } catch (flushError) {
          // Update registration status to failed if flush fails
          if (suite.meta.evaluation) {
            suite.meta.evaluation.registrationStatus = {
              status: 'failed',
              error: errorToString(flushError),
            };
          }
        }

        const durationMs = Math.round(performance.now() - suiteStart);

        const successCases = suite.tasks.filter(
          (task) => task.meta.case.status === 'success',
        ).length;
        const erroredCases = suite.tasks.filter(
          (task) => task.meta.case.status === 'fail' || task.meta.case.status === 'pending',
        ).length;

        // signal Axiom that evaluation finished to kick of summary calculations
        await evaluationApiClient.updateEvaluation({
          id: evalId,
          status: 'completed',
          totalCases: dataset.length,
          successCases,
          erroredCases,
          durationMs,
        });
      });

      type CollectionRecordWithIndex = { index: number } & CollectionRecord<TInput, TExpected>;

      await it.concurrent.for(
        dataset.map((d, index) => ({ ...d, index }) satisfies CollectionRecordWithIndex),
      )('case', async (data, { task }) => {
        const start = performance.now();
        if (!suiteContext) {
          throw new Error(
            '[Axiom AI] Suite context not initialized. This is likely a bug – instrumentation should complete before tests run.',
          );
        }

        await startActiveSpan(
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
          async (caseSpan) => {
            const caseContext = trace.setSpan(context.active(), caseSpan);

            const numTrials = opts.trials ?? 1;
            let outOfScopeFlags: OutOfScopeFlagAccess[] = [];

            const trialResults: {
              output: TOutput;
              scores: Record<string, ScoreWithName>;
              duration: number;
            }[] = [];
            let lastError: Error | null = null;

            try {
              for (let trialIndex = 0; trialIndex < numTrials; trialIndex++) {
                const trialSpan = startSpan(
                  `trial ${trialIndex}`,
                  {
                    attributes: {
                      [Attr.GenAI.Operation.Name]: 'eval.trial',
                      [Attr.Eval.ID]: evalId,
                      [Attr.Eval.Name]: evalName,
                      [Attr.Eval.Version]: evalVersion,
                      [Attr.Eval.Case.Index]: data.index,
                      [Attr.Eval.Trial.Index]: trialIndex,
                    },
                  },
                  caseContext,
                );
                const trialContext = trace.setSpan(context.active(), trialSpan);

                try {
                  const result = await runTask(
                    trialContext,
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
                      capability: opts.capability,
                      step: opts.step,
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
                      const scorerName = getScorerName(scorer);
                      return startActiveSpan(
                        `score ${scorerName}`,
                        {
                          attributes: {
                            [Attr.GenAI.Operation.Name]: 'eval.score',
                            [Attr.Eval.ID]: evalId,
                            [Attr.Eval.Name]: evalName,
                            [Attr.Eval.Version]: evalVersion,
                          },
                        },
                        async (scorerSpan) => {
                          const start = performance.now();
                          const result = await scorer({
                            input: data.input,
                            output,
                            expected: data.expected,
                          });

                          const duration = Math.round(performance.now() - start);
                          const scoreValue = result.score as number;

                          scorerSpan.setAttributes({
                            [Attr.Eval.Score.Name]: scorerName,
                            [Attr.Eval.Score.Value]: scoreValue,
                          });

                          return {
                            name: scorerName,
                            ...result,
                            metadata: { duration, startedAt: start, error: null },
                          };
                        },
                        trialContext,
                      );
                    }),
                  );

                  const scores = Object.fromEntries(scoreList.map((s) => [s.name, s]));

                  trialSpan.setAttributes({
                    [Attr.Eval.Case.Output]:
                      typeof output === 'string' ? output : JSON.stringify(output),
                    [Attr.Eval.Case.Scores]: JSON.stringify(scores ? scores : {}),
                  });
                  trialSpan.setStatus({ code: SpanStatusCode.OK });
                  trialSpan.end();

                  trialResults.push({ output, scores, duration });

                  allOutOfScopeFlags.push(...outOfScopeFlags);
                } catch (e) {
                  console.log(e);
                  const error = e as Error;
                  trialSpan.recordException(error);
                  trialSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                  trialSpan.end();

                  const ctx = getEvalContext();
                  outOfScopeFlags = ctx.outOfScopeFlags || ([] as OutOfScopeFlagAccess[]);

                  lastError = error;

                  // For now, if a trial fails, we continue with remaining trials
                  // but we could make this configurable in the future
                }
              }

              if (trialResults.length > 0) {
                const scorerNames = Object.keys(trialResults[0].scores);
                const averagedScores: Record<string, ScoreWithName> = {};

                for (const scorerName of scorerNames) {
                  const scorerValues = trialResults
                    .map((trial) => trial.scores[scorerName])
                    .filter((s) => s !== undefined);

                  if (scorerValues.length > 0) {
                    const avgScore =
                      scorerValues.reduce((sum, s) => sum + (s.score as number), 0) /
                      scorerValues.length;

                    averagedScores[scorerName] = {
                      ...scorerValues[0],
                      score: avgScore,
                    };
                  }
                }

                const avgDuration =
                  trialResults.reduce((sum, t) => sum + t.duration, 0) / trialResults.length;

                const lastTrial = trialResults[trialResults.length - 1];

                task.meta.case = {
                  index: data.index,
                  name: evalName,
                  expected: data.expected,
                  input: data.input,
                  output: lastTrial.output,
                  scores: averagedScores,
                  status: 'success',
                  errors: [],
                  duration: Math.round(avgDuration),
                  startedAt: start,
                  outOfScopeFlags,
                  pickedFlags: opts.configFlags,
                };

                caseSpan.setAttributes({
                  [Attr.Eval.Case.Output]:
                    typeof lastTrial.output === 'string'
                      ? lastTrial.output
                      : JSON.stringify(lastTrial.output),
                  [Attr.Eval.Case.Scores]: JSON.stringify(averagedScores),
                });
              } else if (lastError) {
                // All trials failed - populate failedScores for better error reporting
                const ctx = getEvalContext();
                outOfScopeFlags = ctx.outOfScopeFlags || ([] as OutOfScopeFlagAccess[]);

                const failedScores: Record<string, ScoreWithName> = {};
                for (const scorer of opts.scorers) {
                  const scorerName = getScorerName(scorer);
                  failedScores[scorerName] = {
                    name: scorerName,
                    score: 0,
                    metadata: {
                      duration: 0,
                      startedAt: start,
                      error: lastError.message,
                    },
                  };
                }

                task.meta.case = {
                  name: evalName,
                  index: data.index,
                  expected: data.expected,
                  input: data.input,
                  output: String(lastError),
                  scores: failedScores,
                  status: 'fail',
                  errors: [lastError],
                  startedAt: start,
                  duration: Math.round(performance.now() - start),
                  outOfScopeFlags,
                  pickedFlags: opts.configFlags,
                };
              }

              caseSpan.setStatus({ code: SpanStatusCode.OK });
            } catch (e) {
              console.log(e);
              const error = e as Error;
              caseSpan.recordException(error);
              caseSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

              const ctx = getEvalContext();
              outOfScopeFlags = ctx.outOfScopeFlags || ([] as OutOfScopeFlagAccess[]);

              // Populate scores with error metadata for all scorers that didn't run
              const failedScores: Record<string, ScoreWithName> = {};
              for (const scorer of opts.scorers) {
                const scorerName = getScorerName(scorer);
                failedScores[scorerName] = {
                  name: scorerName,
                  score: 0,
                  metadata: {
                    duration: 0,
                    startedAt: start,
                    error: error.message,
                  },
                };
              }

              task.meta.case = {
                name: evalName,
                index: data.index,
                expected: data.expected,
                input: data.input,
                output: String(e),
                scores: failedScores,
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
            }
          },
          suiteContext,
        );
      });
    },
    timeoutMs,
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
) => {
  const taskName = opts.task.name ?? 'anonymous';

  return startActiveSpan(
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
    async (taskSpan) => {
      // Initialize evaluation context for flag/fact access
      const { output, duration, outOfScopeFlags, finalFlags, overrides } = await withEvalContext(
        { pickedFlags: opts.configFlags },
        async (): Promise<{
          output: TOutput;
          duration: number;
          outOfScopeFlags: OutOfScopeFlagAccess[];
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

      return {
        output,
        duration,
        outOfScopeFlags,
        finalFlags,
        overrides,
      };
    },
    caseContext,
  );
};
