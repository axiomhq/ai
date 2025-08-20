import { afterAll, describe, it } from 'vitest';
import { context, SpanStatusCode, trace, type Context } from '@opentelemetry/api';
import { customAlphabet } from 'nanoid';

import { Attr } from '../otel/semconv/attributes';
import { startSpan, flush } from './instrument';
import { getGitUserInfo } from './git-info';
import type { CollectionRecord, EvalParams, EvalReport, EvalTask } from './eval.types';
import type { Score } from '../scorers/scorer.types';

declare module 'vitest' {
  interface TaskMeta {
    eval?: EvalReport;
  }
}

const DEFAULT_TIMEOUT = 10000;

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

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
 * import { experimental_Eval as Eval } from 'axiom/ai/evals';
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
  const user = getGitUserInfo();

  const result = await describeFn(
    evalName,
    async () => {
      const dataset = await datasetPromise;

      // ID must be returned after evaluation is registered at Axiom
      // TODO: send api request to register evaluation in Axiom
      const id = nanoid();

      const suiteSpan = startSpan(`eval ${evalName}-${id}`, {
        attributes: {
          [Attr.GenAI.Operation.Name]: 'eval',
          [Attr.Eval.ID]: id,
          [Attr.Eval.Name]: evalName,
          [Attr.Eval.Type]: 'regression', // TODO: where to get experiment type value from?
          [Attr.Eval.Tags]: [], // TODO: where to get experiment tags from?
          [Attr.Eval.Trials]: 1, // TODO: implement trials
          [Attr.Eval.Collection.Name]: 'unknown', // TODO: where to get dataset name from?
          [Attr.Eval.Collection.Split]: 'unknown', // TODO: where to get dataset split value from?
          [Attr.Eval.Collection.Size]: dataset.length,
          // user info
          [Attr.Eval.User.Name]: user?.name,
          [Attr.Eval.User.Email]: user?.email,
        },
      });
      const suiteContext = trace.setSpan(context.active(), suiteSpan);

      afterAll(async () => {
        const tags: string[] = ['offline'];
        suiteSpan.setAttribute(Attr.Eval.Tags, JSON.stringify(tags));

        // end root span
        suiteSpan.setStatus({ code: SpanStatusCode.OK });
        suiteSpan.end();
        await flush();
      });

      await it.concurrent.for(dataset.map((d, index) => ({ ...d, index })))(
        evalName,
        async (data: { index: number } & CollectionRecord, { task }) => {
          const caseName = data.name ?? `${evalName}_${data.index}`;
          const start = performance.now();
          const caseSpan = startSpan(
            `case ${caseName}`,
            {
              attributes: {
                [Attr.GenAI.Operation.Name]: 'eval.case',
                [Attr.Eval.Case.ID]: caseName,
                [Attr.Eval.Case.Index]: data.index,
                [Attr.Eval.Case.Input]:
                  typeof data.input === 'string' ? data.input : JSON.stringify(data.input),
                [Attr.Eval.Case.Expected]:
                  typeof data.expected === 'string' ? data.expected : JSON.stringify(data.expected),
                // user info
                ['eval.user.name']: user?.name,
                ['eval.user.email']: user?.email,
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
            const scoreList: Score[] = await Promise.all(
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

                const start = performance.now();
                const result = await scorer({
                  input: data.input,
                  output,
                  expected: data.expected,
                });

                const duration = Math.round(performance.now() - start);
                const scoreValue = result.score as number;
                const passed = scoreValue >= opts.threshold;
                let hasError: string | false = false;

                scorerSpan.setAttributes({
                  [Attr.Eval.Score.Name]: scorer.name,
                  [Attr.Eval.Score.Value]: scoreValue,
                  [Attr.Eval.Score.Threshold]: opts.threshold,
                  [Attr.Eval.Score.Passed]: passed,
                });

                if (!passed) {
                  hasError = `Score didn't pass`;
                  scorerSpan.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: hasError,
                  });
                } else {
                  scorerSpan.setStatus({ code: SpanStatusCode.OK });
                }
                scorerSpan.end();

                return {
                  ...result,
                  metadata: { duration, startedAt: start, error: hasError || null },
                };
              }),
            );

            const scores = Object.fromEntries(scoreList.map((s) => [s.name, s]));

            // set case output
            caseSpan.setAttributes({
              [Attr.Eval.Case.Output]: typeof output === 'string' ? output : JSON.stringify(output),
              [Attr.Eval.Case.Scores]: JSON.stringify(scores),
            });
            caseSpan.setStatus({ code: SpanStatusCode.OK });

            task.meta.eval = {
              index: data.index,
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
              index: data.index,
              expected: data.expected,
              input: data.input,
              output: e as string,
              scores: {},
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
        [Attr.Eval.Task.Output]: JSON.stringify(output),
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
