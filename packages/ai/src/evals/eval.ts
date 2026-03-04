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
  EvaluationReport,
  EvalCaseReport,
  RuntimeFlagLog,
  OutOfScopeFlag,
  Evaluation,
  OutOfScopeFlagAccess,
} from './eval.types';
import type { ScoreWithName, ScorerLike, Scorer } from '../scorers/scorer.types';
import { Mean, type Aggregation } from '../scorers/aggregations';
import { EvaluationApiClient, findEvaluationCases } from './eval.service';
import { getGlobalFlagOverrides, setGlobalFlagOverrides } from './context/global-flags';
import { deepEqual } from '../util/deep-equal';
import { dotNotationToNested } from '../util/dot-path';
import { AxiomCLIError, errorToString } from '../util/errors';
import { tryCatchAsync, toError } from '../util/tryCatch';
import type { ValidateName } from '../util/name-validation';
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
    consoleUrl?: string;
  }
}

const createVersionId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

type RunTaskFailureDetails = {
  duration: number;
  outOfScopeFlags: OutOfScopeFlagAccess[];
  finalFlags: Record<string, any>;
  overrides?: Record<string, any>;
};

const RUN_TASK_FAILURE_DETAILS = Symbol.for('axiom.eval.runTaskFailureDetails');

function attachRunTaskFailureDetails(
  error: unknown,
  details: RunTaskFailureDetails,
): Error & { [RUN_TASK_FAILURE_DETAILS]: RunTaskFailureDetails } {
  const normalized = toError(error) as Error & {
    [RUN_TASK_FAILURE_DETAILS]?: RunTaskFailureDetails;
  };
  normalized[RUN_TASK_FAILURE_DETAILS] = details;
  return normalized as Error & { [RUN_TASK_FAILURE_DETAILS]: RunTaskFailureDetails };
}

function getRunTaskFailureDetails(error: unknown): RunTaskFailureDetails | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  return (error as { [RUN_TASK_FAILURE_DETAILS]?: RunTaskFailureDetails })[
    RUN_TASK_FAILURE_DETAILS
  ];
}

/**
 * Creates and registers an evaluation suite with the given name and parameters.
 *
 * This function sets up a complete evaluation pipeline that will run your {@link EvalTask}
 * against a collection, score the results, and provide detailed {@link EvalCaseReport} reporting.
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
 *   capability: 'capability-name',
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
  TInput,
  TExpected,
  TOutput,
  Name extends string = string,
  Capability extends string = string,
  Step extends string = string,
>(
  name: ValidateName<Name>,
  params: Omit<EvalParams<TInput, TExpected, TOutput>, 'capability' | 'step'> & {
    capability: ValidateName<Capability>;
    step?: ValidateName<Step> | undefined;
  },
): void {
  // Record eval name for validation
  recordName('eval', name);
  recordName('capability', params.capability);
  if (params.step) {
    recordName('step', params.step);
  }

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
  opts.data;
  const collectionPromise:
    | readonly CollectionRecord<TInput, TExpected>[]
    | Promise<readonly CollectionRecord<TInput, TExpected>[]> =
    typeof opts.data === 'function'
      ? (
          opts.data as () =>
            | readonly CollectionRecord<TInput, TExpected>[]
            | Promise<readonly CollectionRecord<TInput, TExpected>[]>
        )()
      : opts.data;
  const user = getGitUserInfo();

  // check if user passed a specific baseline id to the CLI
  const baselineId = inject('baseline');
  const isDebug = inject('debug');
  const isList = inject('list');
  const injectedOverrides = inject('overrides');
  const axiomConfig = inject('axiomConfig');
  const runId = inject('runId');
  const consoleUrl = inject('consoleUrl');

  if (!axiomConfig) {
    throw new AxiomCLIError('Axiom config not found');
  }

  const timeoutMs = opts.timeout ?? axiomConfig?.eval.timeoutMs;

  const instrumentationReady = ensureInstrumentationInitialized(axiomConfig, {
    enabled: !isDebug && !isList,
  });

  const result = await describe(
    evalName,
    async () => {
      const collection = await collectionPromise;

      const evaluationApiClient = new EvaluationApiClient(axiomConfig, consoleUrl);

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
          orgId: undefined,
          baseline: baseline ?? undefined,
          configFlags: opts.configFlags,
        };

        const [, instrumentationInitError] = await tryCatchAsync(instrumentationReady);
        if (instrumentationInitError) {
          instrumentationError = instrumentationInitError;
        }

        suiteSpan = startSpan(`eval ${evalName}-${evalVersion}`, {
          attributes: {
            [Attr.GenAI.Operation.Name]: 'eval',
            [Attr.Eval.Name]: evalName,
            [Attr.Eval.Version]: evalVersion,
            [Attr.Eval.Type]: 'regression', // TODO: where to get experiment type value from?
            [Attr.Eval.Tags]: JSON.stringify(['offline']),
            [Attr.Eval.Collection.ID]: 'custom', // TODO: where to get collection split value from?
            [Attr.Eval.Collection.Name]: 'custom', // TODO: where to get collection name from?
            [Attr.Eval.Collection.Size]: collection.length,
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

        let createEvalResponse;
        if (!isDebug && !isList) {
          createEvalResponse = await evaluationApiClient.createEvaluation({
            id: evalId,
            name: evalName,
            capability: opts.capability,
            step: opts.step,
            dataset: axiomConfig.eval.dataset,
            version: evalVersion,
            baselineId: baselineId ?? undefined,
            runId: runId,
            totalCases: collection.length,
            config: { overrides: injectedOverrides },
            configTimeoutMs: timeoutMs,
            metadata: opts.metadata,
            status: 'running',
          });
        }

        const orgId = createEvalResponse?.data?.orgId;
        const resolvedBaselineId = createEvalResponse?.data?.baselineId;

        // Load baseline if we got a baselineId from the server
        if (!isDebug && !isList && !!resolvedBaselineId) {
          const [baselineResult, baselineError] = await tryCatchAsync(() =>
            findEvaluationCases(resolvedBaselineId, axiomConfig),
          );
          if (baselineError) {
            console.error(`Failed to load baseline: ${errorToString(baselineError)}`);
            instrumentationError = instrumentationError || baselineError;
          } else {
            baseline = baselineResult;
          }
        }

        // Update span with baseline info
        if (baseline) {
          suiteSpan.setAttribute(Attr.Eval.Baseline.ID, baseline.id);
          suiteSpan.setAttribute(Attr.Eval.Baseline.Name, baseline.name);
          suiteSpan.setAttribute(Attr.Eval.Baseline.Version, baseline.version);
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
          trials: opts.trials,
        };

        suiteStart = performance.now();
      });

      afterAll(async (suite) => {
        if (instrumentationError) {
          throw instrumentationError;
        }

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
        const [, flushError] = await tryCatchAsync(flush);
        if (flushError) {
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
        if (!isDebug && !isList) {
          await evaluationApiClient.updateEvaluation({
            id: evalId,
            status: 'completed',
            totalCases: collection.length,
            successCases,
            erroredCases,
            durationMs,
          });
        }
      });

      type CollectionRecordWithIndex = { index: number } & CollectionRecord<TInput, TExpected>;

      await it.concurrent.for(
        collection.map((d, index) => ({ ...d, index }) satisfies CollectionRecordWithIndex),
      )('case', async (data, { task }) => {
        const start = performance.now();
        if (!suiteContext) {
          throw new Error(
            '[Axiom AI] Suite context not initialized. This is likely a bug – instrumentation should complete before tests run.',
          );
        }

        let outOfScopeFlags: OutOfScopeFlagAccess[] = [];

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
              [Attr.Eval.Case.Metadata]: data.metadata ? JSON.stringify(data.metadata) : undefined,
              // user info
              [Attr.Eval.User.Name]: user?.name,
              [Attr.Eval.User.Email]: user?.email,
            },
          },
          async (caseSpan) => {
            const caseContext = trace.setSpan(context.active(), caseSpan);
            const trials = Math.max(1, opts.trials ?? 1);
            let intentionalTrialFailureError: Error | undefined;
            let caseFinalConfigSnapshot:
              | {
                  flags: Record<string, any>;
                  pickedFlags?: string[];
                  overrides?: Record<string, any>;
                }
              | undefined;

            // Set case-level trials attribute
            caseSpan.setAttribute(Attr.Eval.Case.Trials, trials);

            try {
              // Accumulators for per-trial scores
              const perScorerTrials: Record<string, number[]> = {};
              const trialErrors: Array<string | null> = Array.from({ length: trials }, () => null);
              const trialFailures: Error[] = [];
              let lastOutput: TOutput | undefined;
              let successfulTaskDuration = 0;

              // Run each trial
              for (let trialIndex = 0; trialIndex < trials; trialIndex++) {
                try {
                  await startActiveSpan(
                    `trial ${trialIndex}`,
                    {
                      attributes: {
                        [Attr.GenAI.Operation.Name]: 'eval.trial',
                        [Attr.Eval.Trial.Index]: trialIndex,
                        [Attr.Eval.ID]: evalId,
                        [Attr.Eval.Name]: evalName,
                        [Attr.Eval.Version]: evalVersion,
                      },
                    },
                    async (trialSpan) => {
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
                            input: data.input,
                            expected: data.expected,
                            scorers: opts.scorers,
                            task: opts.task,
                            metadata: opts.metadata,
                            configFlags: opts.configFlags,
                            capability: opts.capability,
                            step: opts.step,
                          },
                        );
                        const { output, duration } = result;
                        lastOutput = output;
                        successfulTaskDuration += duration;
                        outOfScopeFlags.push(...result.outOfScopeFlags);

                        caseFinalConfigSnapshot = {
                          flags: result.finalFlags || {},
                          pickedFlags: opts.configFlags,
                          overrides: result.overrides,
                        };

                        // Run scorers inside the trial span
                        await Promise.all(
                          opts.scorers.map(async (scorer) => {
                            const scorerName = getScorerName(scorer);
                            return startActiveSpan(
                              `score ${scorerName}`,
                              {
                                attributes: {
                                  [Attr.GenAI.Operation.Name]: 'eval.score',
                                  [Attr.Eval.Tags]: JSON.stringify(['offline']),
                                  [Attr.Eval.ID]: evalId,
                                  [Attr.Eval.Name]: evalName,
                                  [Attr.Eval.Version]: evalVersion,
                                  [Attr.Eval.Trial.Index]: trialIndex,
                                },
                              },
                              async (scorerSpan) => {
                                const scorerStart = performance.now();
                                try {
                                  const [result, scorerError] = await tryCatchAsync(() =>
                                    scorer({
                                      input: data.input,
                                      output: output,
                                      expected: data.expected,
                                      trialIndex,
                                    }),
                                  );

                                  if (scorerError || !result) {
                                    const scorerDuration = Math.round(
                                      performance.now() - scorerStart,
                                    );
                                    console.error(
                                      `ERROR: scorer ${scorerName} failed. Cause: \n`,
                                      scorerError,
                                    );
                                    const msg = errorToString(scorerError);
                                    const metadata = {
                                      duration: scorerDuration,
                                      startedAt: scorerStart,
                                      error: msg,
                                    };

                                    // Count scorer failures as zero so failed trials affect aggregation.
                                    (perScorerTrials[scorerName] ??= []).push(0);

                                    scorerSpan.setAttributes({
                                      [Attr.Eval.Score.Name]: scorerName,
                                      [Attr.Eval.Score.Metadata]: JSON.stringify(metadata),
                                    });

                                    scorerSpan.setStatus({
                                      code: SpanStatusCode.ERROR,
                                      message: msg,
                                    });
                                    return;
                                  }

                                  const scoreDuration = Math.round(performance.now() - scorerStart);
                                  const scoreValue = result.score as number;
                                  const metadata = Object.assign(
                                    { duration: scoreDuration, startedAt: scorerStart },
                                    result.metadata,
                                  );

                                  // Collect per-trial score
                                  (perScorerTrials[scorerName] ??= []).push(scoreValue);

                                  // Get aggregation config for span attributes
                                  const aggregation: Aggregation =
                                    (scorer as Scorer).aggregation ?? Mean();

                                  scorerSpan.setAttributes({
                                    [Attr.Eval.Score.Name]: scorerName,
                                    [Attr.Eval.Score.Value]: scoreValue,
                                    [Attr.Eval.Score.Metadata]: JSON.stringify(metadata),
                                    [Attr.Eval.Score.Aggregation]: aggregation.type,
                                  });

                                  if (metadata.error) {
                                    const msg = errorToString(metadata.error);
                                    scorerSpan.setStatus({
                                      code: SpanStatusCode.ERROR,
                                      message: msg,
                                    });
                                  }
                                } finally {
                                  scorerSpan.end();
                                }
                              },
                              trialContext,
                            );
                          }),
                        );
                      } catch (error) {
                        const taskFailureDetails = getRunTaskFailureDetails(error);
                        const failure = toError(error);
                        const msg = errorToString(failure);
                        const spanErrorMessage = failure.message || msg;
                        trialErrors[trialIndex] = msg;
                        trialFailures.push(failure);

                        trialSpan.setAttributes({
                          [Attr.Eval.Trial.Error]: spanErrorMessage,
                        });

                        for (const scorer of opts.scorers) {
                          const scorerName = getScorerName(scorer);
                          (perScorerTrials[scorerName] ??= []).push(0);
                        }

                        if (taskFailureDetails) {
                          outOfScopeFlags.push(...taskFailureDetails.outOfScopeFlags);
                          caseFinalConfigSnapshot = {
                            flags: taskFailureDetails.finalFlags || {},
                            pickedFlags: opts.configFlags,
                            overrides: taskFailureDetails.overrides,
                          };
                        }

                        // Re-throw so startActiveSpan records the trial span as ERROR.
                        throw failure;
                      }
                    },
                    caseContext,
                  );
                } catch {
                  // Continue remaining trials after task-level failures.
                }
              }

              // Aggregate scores across trials
              const scores: Record<string, ScoreWithName> = {};
              for (const scorer of opts.scorers) {
                const scorerName = getScorerName(scorer);
                const trialsArr = perScorerTrials[scorerName] ?? [];
                const aggregation: Aggregation = (scorer as Scorer).aggregation ?? Mean();

                const aggregatedValue = trialsArr.length > 0 ? aggregation.aggregate(trialsArr) : 0;

                scores[scorerName] = {
                  name: scorerName,
                  score: aggregatedValue,
                  trials: trialsArr,
                  aggregation: aggregation.type,
                  threshold: aggregation.threshold,
                  metadata: {},
                };
              }

              const output = lastOutput;
              const failedTrials = trialFailures.length;
              const succeededTrials = trials - failedTrials;
              const trialSummary = {
                total: trials,
                succeeded: succeededTrials,
                failed: failedTrials,
              };

              caseSpan.setAttribute(Attr.Eval.Case.Scores, JSON.stringify(scores ? scores : {}));
              if (output !== undefined) {
                caseSpan.setAttribute(
                  Attr.Eval.Case.Output,
                  typeof output === 'string' ? output : JSON.stringify(output),
                );
              }

              // set task meta for showing result in vitest report
              task.meta.case = {
                index: data.index,
                name: evalName,
                expected: data.expected,
                input: data.input,
                output: output,
                metadata: data.metadata,
                scores,
                status: 'success',
                errors: [],
                trialErrors,
                trialSummary,
                duration: successfulTaskDuration,
                startedAt: start,
                outOfScopeFlags,
                pickedFlags: opts.configFlags,
              };

              if (failedTrials > 0) {
                const error = new Error(
                  `Eval case ${data.index} failed with ${failedTrials} trial error(s).`,
                );
                intentionalTrialFailureError = error;
                caseSpan.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: error.message,
                });
                task.meta.case.status = 'fail';
                task.meta.case.errors = trialFailures;
                throw error;
              }

              // Collect out-of-scope flags for evaluation-level aggregation
              allOutOfScopeFlags.push(...outOfScopeFlags);
            } catch (e) {
              console.log(e);
              const error = toError(e);

              if (e === intentionalTrialFailureError && task.meta.case) {
                task.meta.case.status = 'fail';
                task.meta.case.errors = task.meta.case.errors?.length
                  ? task.meta.case.errors
                  : [error];
                allOutOfScopeFlags.push(...outOfScopeFlags);
                throw e;
              }

              const ctx = getEvalContext();
              const ctxOutOfScopeFlags = ctx.outOfScopeFlags || [];
              if (ctxOutOfScopeFlags.length > 0) {
                outOfScopeFlags.push(...ctxOutOfScopeFlags);
              }

              const ctxFlags = ctx.flags || {};
              if (!caseFinalConfigSnapshot && Object.keys(ctxFlags).length > 0) {
                caseFinalConfigSnapshot = {
                  flags: ctxFlags,
                  pickedFlags: opts.configFlags,
                  overrides: ctx.overrides,
                };
              }

              // Populate scores with error metadata for all scorers that didn't run
              const failedScores: Record<string, ScoreWithName> = {};
              for (const scorer of opts.scorers) {
                const scorerName = getScorerName(scorer);
                failedScores[scorerName] = {
                  name: scorerName,
                  score: 0,
                  trials: [],
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
                metadata: data.metadata,
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
                const accessedFlags: Record<string, any> = caseFinalConfigSnapshot?.flags || {};

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

                if (!isDebug && Object.keys(runtimeFlags).length > 0) {
                  const serialized = JSON.stringify(runtimeFlags);
                  caseSpan.setAttribute('eval.case.config.runtime_flags', serialized);
                }

                if (task.meta.case) {
                  task.meta.case.runtimeFlags = runtimeFlags;
                }
              } catch {}

              if (caseFinalConfigSnapshot) {
                finalConfigSnapshot = caseFinalConfigSnapshot;
              }
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
          try {
            const output = await executeTask(opts.task, opts.input, opts.expected!);
            const duration = Math.round(performance.now() - start);
            // set task output
            taskSpan.setAttributes({
              [Attr.Eval.Task.Output]: typeof output === 'string' ? output : JSON.stringify(output),
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
          } catch (error) {
            const ctx = getEvalContext();
            const duration = Math.round(performance.now() - start);
            throw attachRunTaskFailureDetails(error, {
              duration,
              outOfScopeFlags: ctx.outOfScopeFlags || [],
              finalFlags: ctx.flags || {},
              overrides: ctx.overrides,
            });
          }
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
