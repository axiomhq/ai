import { context, SpanStatusCode, trace, type Context } from "@opentelemetry/api";
import { afterAll, describe, it } from "vitest";
import { flush, startSpan } from "./instrument";
import { Attr } from "../otel/semconv/attributes";

declare module "vitest" {
  interface TaskMeta {
    eval?: EvalReport;
  }
}

export type EvalTask<TInput, TExpected> = (input: TInput, expected: TExpected) => Promise<any> | any

const generateExperimentId = () => {
  return crypto.randomUUID()
}

export type EvalParams = {
  data: () => Promise<{ input: any, expected: any }[]>,
  task: EvalTask<any, any>,
  scorers: any[],
  threshold: number,
  timeout?: number,
  skipIf?: () => boolean,
}

export type Score = { name: string, score: number, duration: number, startedAt: number }

export type EvalReport = {
  order: number;
  name: string,
  input: string,
  output: string,
  expected: string,
  scores: Score[],
  errors: TestError[] | null,
  status: 'success' | 'fail' | 'pending',
  duration: number | undefined,
  startedAt: number | undefined,
  threshold: number | undefined,
}

export const Eval = (name: string, params: EvalParams) => registerEval(name, params)

async function registerEval(
  evalName: string,
  opts: EvalParams,
  vitestOpts: { modifier?: "only" | "skip" } = {}
) {
  const describeFn = vitestOpts.modifier === "skip" ? describe.skip : describe;
  const datasetPromise =
    vitestOpts.modifier === "skip" ? Promise.resolve([]) : opts.data();

  const result = await describeFn(evalName, async () => {
    const dataset = await datasetPromise;

    const suiteSpan = startSpan(`eval ${evalName}`, {
      attributes: {
        [Attr.GenAI.Operation.Name]: 'eval',
        [Attr.Eval.Experiment.ID]: generateExperimentId(),
        [Attr.Eval.Experiment.Name]: evalName,
        [Attr.Eval.Experiment.Type]: 'regression', // TODO: where to get experiment type value from?
        [Attr.Eval.Experiment.Tags]: [], // TODO: where to get experiment tags from?
        [Attr.Eval.Experiment.Version]: "1.0.0", // TODO: where to get experiment version from?
        // [Attr.Eval.Experiment.Group]: "default", // TODO: where to get experiment group from?
        // [Attr.Eval.Experiment.BaseID]: "default", // TODO: where to get experiment base id from?
        // [Attr.Eval.Experiment.BaseName]: "default", // TODO: where to get experiment base name from?
        [Attr.Eval.Experiment.Trials]: 1, // TODO: implement trials
        [Attr.Eval.Dataset.Name]: "test", // TODO: where to get dataset name from?
        [Attr.Eval.Dataset.Split]: "test", // TODO: where to get dataset split value from?
        [Attr.Eval.Dataset.Size]: dataset.length,
      },
    })
    const suiteContext = trace.setSpan(context.active(), suiteSpan)

    afterAll(async () => {
      suiteSpan.setStatus({ code: SpanStatusCode.OK })
      suiteSpan.end()
      await flush()
    })

    await it.concurrent.for(dataset.map((d, index) => ({ ...d, index })))(
      evalName,
      async (data, { task }) => {
        const start = performance.now();
        const caseSpan = startSpan(`case ${evalName}_${data.index}`, {
          attributes: {
            [Attr.GenAI.Operation.Name]: 'eval.case',
            [Attr.Eval.Case.ID]: `${evalName}_${data.index}`,
            [Attr.Eval.Case.Index]: data.index,
            [Attr.Eval.Case.Input]: data.input,
            [Attr.Eval.Case.Expected]: data.expected,
          }
        }, suiteContext)
        const caseContext = trace.setSpan(context.active(), caseSpan)

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
              const scorerSpan = startSpan(`score ${scorer.name}`, {
                attributes: {
                  [Attr.GenAI.Operation.Name]: 'eval.score',
                }
              }, caseContext)

              if (typeof scorer === "function") {
                const start = performance.now();
                const result = await scorer({
                  input: data.input,
                  output,
                  expected: data.expected,
                });
                console.log({ result })

                const duration = Math.round(performance.now() - start);
                const scoreValue = result.score as number;
                const passed = scoreValue >= opts.threshold;

                scorerSpan.setAttributes({
                  [Attr.Eval.Score.Name]: scorer.name,
                  [Attr.Eval.Score.Value]: scoreValue,
                  [Attr.Eval.Score.Threshold]: opts.threshold,
                  [Attr.Eval.Score.Passed]: passed,
                })


                if (!passed) {
                  scorerSpan.recordException(new Error(`Score did not pass`))
                  scorerSpan.setStatus({ code: SpanStatusCode.ERROR })
                } else {
                  scorerSpan.setStatus({ code: SpanStatusCode.OK })
                }
                scorerSpan.end()

                return { ...result, duration, startedAt: start }
              } else {
                // TODO: create custom scorer
              }
            })
          );

          // set case output
          caseSpan.setAttributes({
            [Attr.Eval.Case.Output]: output as string // TODO: what if output is other than a string?,
          })
          caseSpan.setStatus({ code: SpanStatusCode.OK })

          task.meta.eval = {
            order: data.index,
            name: evalName,
            expected: data.expected,
            input: data.input,
            output: output as string,
            scores,
            status: "success",
            errors: [],
            duration,
            startedAt: start,
            threshold: opts.threshold,
          };

        } catch (e) {
          caseSpan.recordException(e as Error)
          caseSpan.setStatus({ code: SpanStatusCode.ERROR })

          task.meta.eval = {
            name: evalName,
            order: data.index,
            expected: data.expected,
            input: data.input,
            output: e as string,
            scores: [],
            status: "fail",
            errors: [e as any],
            startedAt: start,
            duration: Math.round(performance.now() - start),
            threshold: opts.threshold,
          };
          throw e;
        } finally {
          caseSpan.end()
        }
      })
  }, {
    timeout: 10000,
  })

  return result
}

const joinArrayOfUnknownResults = (results: unknown[]): unknown => {
  return results.reduce((acc, result) => {
    if (
      typeof result === "string" ||
      typeof result === "number" ||
      typeof result === "boolean"
    ) {
      return `${acc}${result}`;
    }
    throw new Error(
      `Cannot display results of stream: stream contains non-string, non-number, non-boolean chunks.`
    );
  }, "");
};


const executeTask = async <TInput, TExpected, TOutput>(
  task: EvalTask<TInput, TExpected>,
  input: TInput,
  expected: TExpected
): Promise<TOutput> => {
  const taskResultOrStream = await task(input, expected);

  if (
    typeof taskResultOrStream === "object" &&
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
  } & Omit<
    EvalParams,
    "data"
  >
) => {
  const taskName = opts.task.name ?? 'anonymous';
  // start task span
  const taskSpan = startSpan(`task`, {
    attributes: {
      [Attr.GenAI.Operation.Name]: 'eval.task',
      [Attr.Eval.Task.Name]: taskName,
      [Attr.Eval.Task.Type]: 'llm_completion', // TODO: How to determine task type?
      [Attr.Eval.Task.Trial]: 1,
    }
  }, caseContext)

  const { output, duration } = await context.with(trace.setSpan(context.active(), taskSpan), async () => {
    const start = performance.now();
    const output = await executeTask(opts.task, opts.input, opts.expected);
    const duration = Math.round(performance.now() - start);
    // set task output
    taskSpan.setAttributes({
      [Attr.Eval.Task.Output]: output as string // TODO: what if output is other than a string?,
    })

    taskSpan.setStatus({ code: SpanStatusCode.OK })
    taskSpan.end()

    return { output, duration }
  })

  return {
    output,
    duration,
  };
};
