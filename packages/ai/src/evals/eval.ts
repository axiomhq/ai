import { context, SpanStatusCode, trace, type Context } from '@opentelemetry/api';
import { afterAll, describe, it } from 'vitest';
import type { TestError } from 'vitest';
import { Attr } from '../otel/semconv/attributes';
import { startSpan, flush } from './instrument';

declare module 'vitest' {
  interface TaskMeta {
    eval?: EvalReport;
  }
}

const DEFAULT_TIMEOUT = 10000;

/**
 * Function type for evaluation tasks that process input data and produce output.
 *
 * Used with {@link EvalParams} to define the task that will be evaluated against a dataset.
 * The task output will be scored by functions defined in {@link EvalParams.scorers}.
 *
 * @experimental This API is experimental and may change in future versions.
 *
 * @param input - The input data to process
 * @param expected - The expected output for comparison/validation
 * @returns Promise that resolves to the task output, or the output directly
 *
 * @example
 * ```typescript
 * const textGenerationTask: EvalTask<string, string> = async (input, expected) => {
 *   const result = await generateText({
 *     model: myModel,
 *     prompt: input
 *   });
 *   return result.text;
 * };
 * ```
 */
export type EvalTask<TInput, TExpected> = (
  input: TInput,
  expected: TExpected,
) => Promise<any> | any;

/**
 * Configuration parameters for running an evaluation.
 *
 * Used with {@link Eval} to define how an evaluation should be executed.
 * Results are captured in {@link EvalReport} format.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type EvalParams = {
  /** Function that returns the dataset with input/expected pairs for evaluation */
  data: () => Promise<{ input: any; expected: any }[]>;
  /** The {@link EvalTask} function to execute for each data item */
  task: EvalTask<any, any>;
  /** Array of scoring functions to evaluate the task output, producing {@link Score} results */
  scorers: any[];
  /** Minimum score threshold for passing (0.0 to 1.0) */
  threshold: number;
  /** Optional timeout in milliseconds for task execution */
  timeout?: number;
  /** Optional function to conditionally skip the evaluation */
  skipIf?: () => boolean;
};

/**
 * Represents a score result from an evaluation scorer.
 *
 * Produced by scorer functions defined in {@link EvalParams.scorers} and
 * included in the {@link EvalReport} for each evaluation case.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type Score = {
  /** Name of the scorer that produced this score */
  name: string;
  /** Numerical score value (typically 0.0 to 1.0) */
  score: number;
  /** Duration in milliseconds that the scoring took */
  duration: number;
  /** Timestamp when scoring started */
  startedAt: number;
};

/**
 * Complete report for a single evaluation case including results and metadata.
 *
 * Generated for each test case when running {@link Eval} with {@link EvalParams}.
 * Contains all {@link Score} results and execution metadata.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type EvalReport = {
  /** Order/index of this case in the evaluation suite */
  order: number;
  /** Name of the evaluation */
  name: string;
  /** Input data that was provided to the {@link EvalTask} */
  input: string;
  /** Output produced by the {@link EvalTask} */
  output: string;
  /** Expected output for comparison */
  expected: string;
  /** Array of {@link Score} results from all scorers that were run */
  scores: Score[];
  /** Any errors that occurred during evaluation */
  errors: TestError[] | null;
  /** Status of the evaluation case */
  status: 'success' | 'fail' | 'pending';
  /** Duration in milliseconds for the entire case */
  duration: number | undefined;
  /** Timestamp when the case started */
  startedAt: number | undefined;
  /** Score threshold from {@link EvalParams.threshold} that was used for pass/fail determination */
  threshold: number | undefined;
};

/**
 * Creates and registers an evaluation suite with the given name and parameters.
 *
 * This function sets up a complete evaluation pipeline that will run your {@link EvalTask}
 * against a dataset, score the results, and provide detailed {@link EvalReport} reporting.
 *
 * @experimental This API is experimental and may change in future versions.
 *
 * @param name - Human-readable name for the evaluation suite
 * @param params - {@link EvalParams} configuration parameters for the evaluation
 *
 * @example
 * ```typescript
 * import { experimental_Eval as Eval } from 'axiom';
 *
 * Eval('Text Generation Quality', {
 *   data: async () => [
 *     { input: 'Explain photosynthesis', expected: 'Plants convert light to energy...' },
 *     { input: 'What is gravity?', expected: 'Gravity is a fundamental force...' }
 *   ],
 *   task: async (input) => {
 *     const result = await generateText({
 *       model: yourModel,
 *       prompt: input
 *     });
 *     return result.text;
 *   },
 *   scorers: [similarityScorer, factualAccuracyScorer],
 *   threshold: 0.7
 * });
 * ```
 */
export const Eval = (name: string, params: EvalParams): void => {
  registerEval(name, params).catch(console.error);
};

async function registerEval(
  evalName: string,
  opts: EvalParams,
  vitestOpts: { modifier?: 'only' | 'skip' } = {},
) {
  const describeFn = vitestOpts.modifier === 'skip' ? describe.skip : describe;
  const datasetPromise = vitestOpts.modifier === 'skip' ? Promise.resolve([]) : opts.data();

  const result = await describeFn(
    evalName,
    async () => {
      const dataset = await datasetPromise;

      // ID must be returned after evaluation is registered at Axiom
      let id = '';
      // register eval at Axiom
      try {
        const resp = await fetch(`${process.env.AXIOM_URL}/api/v1/evaluations`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
            'x-axiom-check': 'good',
          },
          body: JSON.stringify({
            name: evalName,
            type: 'regression',
            version: '1.0.0',
          }),
        });

        const body = await resp.json();
        if (resp.status >= 400) {
          console.error(body);
          return;
        }

        id = body.data.id;
      } catch (err) {
        console.error({ error: err });
      }

      const suiteSpan = startSpan(`eval ${evalName}`, {
        attributes: {
          [Attr.GenAI.Operation.Name]: 'eval',
          [Attr.Eval.Experiment.ID]: id,
          [Attr.Eval.Experiment.Name]: evalName,
          [Attr.Eval.Experiment.Type]: 'regression', // TODO: where to get experiment type value from?
          [Attr.Eval.Experiment.Tags]: [], // TODO: where to get experiment tags from?
          [Attr.Eval.Experiment.Version]: '1.0.0', // TODO: where to get experiment version from?
          // [Attr.Eval.Experiment.Group]: "default", // TODO: where to get experiment group from?
          // [Attr.Eval.Experiment.BaseID]: "default", // TODO: where to get experiment base id from?
          // [Attr.Eval.Experiment.BaseName]: "default", // TODO: where to get experiment base name from?
          [Attr.Eval.Experiment.Trials]: 1, // TODO: implement trials
          [Attr.Eval.Dataset.Name]: 'test', // TODO: where to get dataset name from?
          [Attr.Eval.Dataset.Split]: 'test', // TODO: where to get dataset split value from?
          [Attr.Eval.Dataset.Size]: dataset.length,
        },
      });
      const suiteContext = trace.setSpan(context.active(), suiteSpan);

      afterAll(async () => {
        // mark experiment as completed
        try {
          await fetch(`${process.env.AXIOM_URL}/api/v1/evaluations/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
              'x-axiom-check': 'good',
            },
            body: JSON.stringify({
              status: 'completed',
              statusMessage: '-',
            }),
          });
        } catch (err) {
          console.error(err);
        }
        suiteSpan.setStatus({ code: SpanStatusCode.OK });
        suiteSpan.end();
        await flush();
      });

      await it.concurrent.for(dataset.map((d, index) => ({ ...d, index })))(
        evalName,
        async (data, { task }) => {
          const start = performance.now();
          const caseSpan = startSpan(
            `case ${evalName}_${data.index}`,
            {
              attributes: {
                [Attr.GenAI.Operation.Name]: 'eval.case',
                [Attr.Eval.Case.ID]: `${evalName}_${data.index}`,
                [Attr.Eval.Case.Index]: data.index,
                [Attr.Eval.Case.Input]: data.input,
                [Attr.Eval.Case.Expected]: data.expected,
              },
            },
            suiteContext,
          );
          const caseContext = trace.setSpan(context.active(), caseSpan);

          try {
            const { output, duration } = await runTask(caseContext, {
              index: data.index,
              expected: data.expected,
              input: data.input,
              scorers: opts.scorers,
              task: opts.task,
              threshold: opts.threshold,
            });

            // run scorers
            const scores = await Promise.all(
              opts.scorers.map(async (scorer) => {
                const scorerSpan = startSpan(
                  `score ${scorer.name}`,
                  {
                    attributes: {
                      [Attr.GenAI.Operation.Name]: 'eval.score',
                    },
                  },
                  caseContext,
                );

                if (typeof scorer === 'function') {
                  const start = performance.now();
                  const result = await scorer({
                    input: data.input,
                    output,
                    expected: data.expected,
                  });

                  const duration = Math.round(performance.now() - start);
                  const scoreValue = result.score as number;
                  const passed = scoreValue >= opts.threshold;

                  scorerSpan.setAttributes({
                    [Attr.Eval.Score.Name]: scorer.name,
                    [Attr.Eval.Score.Value]: scoreValue,
                    [Attr.Eval.Score.Threshold]: opts.threshold,
                    [Attr.Eval.Score.Passed]: passed,
                  });

                  if (!passed) {
                    scorerSpan.recordException(new Error(`Score did not pass`));
                    scorerSpan.setStatus({ code: SpanStatusCode.ERROR });
                  } else {
                    scorerSpan.setStatus({ code: SpanStatusCode.OK });
                  }
                  scorerSpan.end();

                  return { ...result, duration, startedAt: start };
                } else {
                  // TODO: create custom scorer
                }
              }),
            );

            // set case output
            caseSpan.setAttributes({
              [Attr.Eval.Case.Output]: output as string, // TODO: what if output is other than a string?,
            });
            caseSpan.setStatus({ code: SpanStatusCode.OK });

            task.meta.eval = {
              order: data.index,
              name: evalName,
              expected: data.expected,
              input: data.input,
              output: output as string,
              scores,
              status: 'success',
              errors: [],
              duration,
              startedAt: start,
              threshold: opts.threshold,
            };
          } catch (e) {
            caseSpan.recordException(e as Error);
            caseSpan.setStatus({ code: SpanStatusCode.ERROR });

            task.meta.eval = {
              name: evalName,
              order: data.index,
              expected: data.expected,
              input: data.input,
              output: e as string,
              scores: [],
              status: 'fail',
              errors: [e as any],
              startedAt: start,
              duration: Math.round(performance.now() - start),
              threshold: opts.threshold,
            };
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

const joinArrayOfUnknownResults = (results: unknown[]): unknown => {
  return results.reduce((acc, result) => {
    if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
      return `${acc}${result}`;
    }
    throw new Error(
      `Cannot display results of stream: stream contains non-string, non-number, non-boolean chunks.`,
    );
  }, '');
};

const executeTask = async <TInput, TExpected, TOutput>(
  task: EvalTask<TInput, TExpected>,
  input: TInput,
  expected: TExpected,
): Promise<TOutput> => {
  const taskResultOrStream = await task(input, expected);

  if (
    typeof taskResultOrStream === 'object' &&
    taskResultOrStream &&
    Symbol.asyncIterator in taskResultOrStream
  ) {
    const chunks: TOutput[] = [];

    for await (const chunk of taskResultOrStream) {
      chunks.push(chunk);
    }

    return joinArrayOfUnknownResults(chunks) as TOutput;
  }

  return taskResultOrStream;
};

const runTask = async <TInput, TExpected>(
  caseContext: Context,
  opts: {
    index: number;
    input: TInput;
    expected: TExpected | undefined;
    threshold: number;
  } & Omit<EvalParams, 'data'>,
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
        [Attr.Eval.Task.Trial]: 1,
      },
    },
    caseContext,
  );

  const { output, duration } = await context.with(
    trace.setSpan(context.active(), taskSpan),
    async () => {
      const start = performance.now();
      const output = await executeTask(opts.task, opts.input, opts.expected);
      const duration = Math.round(performance.now() - start);
      // set task output
      taskSpan.setAttributes({
        [Attr.Eval.Task.Output]: output as string, // TODO: what if output is other than a string?,
      });

      taskSpan.setStatus({ code: SpanStatusCode.OK });
      taskSpan.end();

      return { output, duration };
    },
  );

  return {
    output,
    duration,
  };
};
