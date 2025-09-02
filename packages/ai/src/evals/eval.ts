import { afterAll, beforeAll, describe, it } from 'vitest';
import { context, SpanStatusCode, trace, type Context } from '@opentelemetry/api';
import { customAlphabet } from 'nanoid';

import { Attr } from '../otel/semconv/attributes';
import { startSpan, flush } from './instrument';
import { getGitUserInfo } from './git-info';
import type {
  CollectionRecord,
  EvalDefinition,
  EvalTask,
  ExperimentDefinition,
} from './eval.types';
import type { Score } from '../scorers/scorer.types';
import type { EvalCaseMeta, EvalMeta } from './experiment.reporter';
import { DEFAULT_TIMEOUT } from './run-vitest';
import { setValue } from 'src/config/config';

declare module 'vitest' {
  interface TaskMeta {
    case: EvalCaseMeta;
    evaluation: EvalMeta;
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
 * @param params - {@link EvalDefinition} configuration parameters for the evaluation
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
 * });
 * ```
 */
export const defineEval = (config: EvalDefinition): EvalConfig => {
  return new EvalConfig(config);
};

export class EvalConfig {
  constructor(public config: EvalDefinition) {
    return this;
  }

  async run() {
    return await registerEvalTask(this.config).catch(console.error);
  }

  async experimentWith(experimentConfig: ExperimentDefinition) {
    return await registerEvalTask(this.config, experimentConfig).catch(console.error);
  }
}

export async function registerEvalTask(config: EvalDefinition, experiment?: ExperimentDefinition) {
  const datasetPromise = config.data();
  const user = getGitUserInfo();

  // if experiment is provided, override config values
  if (experiment && experiment.metadata) {
    Object.keys(experiment.metadata).forEach((key) => {
      setValue(key, experiment.metadata[key]);
    });
  }

  const runId = nanoid();
  const evalName = `${config.capability}:${config.step}`;
  const suiteName = experiment
    ? `experiment: ${evalName}-${runId}-${experiment.name}`
    : `evaluate: ${evalName}-${runId}`;

  const result = await describe(
    suiteName,
    async () => {
      const dataset = await datasetPromise;
      // create a version code
      let evalId = ''; // get traceId

      // if there is an experiment config provided, override metadata
      const metadata = Object.assign({}, config.metadata, experiment?.metadata);

      const suiteSpan = startSpan(`eval ${evalName}-${runId}`, {
        attributes: {
          [Attr.GenAI.Operation.Name]: 'eval',
          [Attr.Eval.Name]: evalName,
          [Attr.Eval.RunID]: runId,
          [Attr.Eval.Version]: runId,
          [Attr.Eval.Type]: 'regression', // TODO: where to get experiment type value from?
          [Attr.Eval.Tags]: [],
          [Attr.Eval.Collection.ID]: 'custom', // TODO: where to get dataset split value from?
          [Attr.Eval.Collection.Name]: 'custom', // TODO: where to get dataset name from?
          [Attr.Eval.Collection.Size]: dataset.length,
          // metadata
          'eval.metadata': JSON.stringify(metadata),
          // // baseline
          // [Attr.Eval.BaselineID]: baseline ? baseline.id : undefined,
          // [Attr.Eval.BaselineName]: baseline ? baseline.name : undefined,
          // user info
          [Attr.Eval.User.Name]: user?.name,
          [Attr.Eval.User.Email]: user?.email,
        },
      });
      evalId = suiteSpan.spanContext().traceId;
      suiteSpan.setAttribute(Attr.Eval.ID, evalId);

      const suiteContext = trace.setSpan(context.active(), suiteSpan);

      beforeAll((suite) => {
        suite.meta.evaluation = {
          id: evalId,
          name: evalName,
          version: runId,
          metadata: metadata ?? {},
        };
      });

      afterAll(async () => {
        const tags: string[] = ['offline', ...(config.tags ? config.tags : [])];

        suiteSpan.setAttribute(Attr.Eval.Tags, JSON.stringify(tags));

        // end root span
        suiteSpan.setStatus({ code: SpanStatusCode.OK });
        suiteSpan.end();
        await flush();
      });

      await it.concurrent.for(dataset.map((d, index) => ({ ...d, index })))(
        'case',
        async (data: { index: number } & CollectionRecord, { task }) => {
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

          try {
            const { output, duration } = await runTask(
              caseContext,
              {
                id: evalId,
                version: runId,
                name: evalName,
              },
              {
                capability: config.capability,
                step: config.step,
                index: data.index,
                expected: data.expected,
                input: data.input,
                scorers: config.scorers,
                task: config.task,
                metadata: metadata,
              },
            );

            // run scorers
            const scoreList: Score[] = await Promise.all(
              config.scorers.map(async (scorer) => {
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
              output: output as string,
              scores,
              status: 'success',
              errors: [],
              duration,
              startedAt: start,
            };
          } catch (e) {
            console.log(e);
            const error = e as Error;
            caseSpan.recordException(error);
            caseSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

            task.meta.case = {
              name: evalName,
              index: data.index,
              expected: data.expected,
              input: data.input,
              output: e as string,
              scores: {},
              status: 'fail',
              errors: [error],
              startedAt: start,
              duration: Math.round(performance.now() - start),
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
  metadata: Record<string, any>,
  input: TInput,
  expected: TExpected,
): Promise<TOutput> => {
  const taskResultOrStream = await task({ metadata, input, expected });

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
  evaluation: {
    id: string;
    name: string;
    version: string;
  },
  opts: {
    index: number;
    input: TInput;
    expected: TExpected | undefined;
  } & Omit<EvalDefinition, 'data'>,
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

  const { output, duration } = await context.with(
    trace.setSpan(context.active(), taskSpan),
    async () => {
      const start = performance.now();
      const output = await executeTask(opts.task, opts.metadata ?? {}, opts.input, opts.expected);
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
