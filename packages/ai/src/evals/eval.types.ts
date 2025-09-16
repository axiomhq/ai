import type { Scorer } from './scorers';

// TODO: BEFORE MERGE - really?
export type { Scorer } from './scorers';

// Type utilities for automatic inference
/** Extract the input type from CollectionRecord[] */
export type InputOf<Data extends readonly CollectionRecord<any, any>[]> =
  Data[number] extends CollectionRecord<infer I, any> ? I : never;

/** Extract the expected type from CollectionRecord[] */
export type ExpectedOf<Data extends readonly CollectionRecord<any, any>[]> =
  Data[number] extends CollectionRecord<any, infer E> ? E : never;

/** Extract the output type from a task function */
export type OutputOf<TaskFn extends (...args: any) => any> = TaskFn extends (
  ...args: any
) => AsyncIterable<infer O>
  ? O
  : Awaited<ReturnType<TaskFn>>;

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
 * @returns The task output, Promise, or AsyncIterable for streaming
 *
 * @example
 * ```typescript
 * const textGenerationTask: EvalTask<string, string, string> = async ({ input, expected }) => {
 *   const result = await generateText({
 *     model: myModel,
 *     prompt: input
 *   });
 *   return result.text;
 * };
 * ```
 */
export type EvalTask<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
> = (args: {
  input: TInput;
  expected: TExpected;
}) => TOutput | Promise<TOutput> | AsyncIterable<TOutput>;

/**
 * Record type representing a single data point in an evaluation dataset.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type CollectionRecord<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
> = {
  /** The input data for the evaluation case */
  input: TInput;
  /** The expected output for comparison/validation */
  expected: TExpected;
  /** Optional metadata for the record */
  metadata?: Record<string, unknown>;
};

/**
 * Configuration parameters for running an evaluation.
 *
 * Used with {@link Eval} to define how an evaluation should be executed.
 * Results are captured in {@link EvalReport} format.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type EvalParams<
  TInput extends string | Record<string, any>,
  TExpected extends string | Record<string, any>,
  TOutput extends string | Record<string, any>,
> = {
  /** Function that returns the dataset with input/expected pairs for evaluation */
  data: () =>
    | readonly CollectionRecord<TInput, TExpected>[]
    | Promise<readonly CollectionRecord<TInput, TExpected>[]>;
  /** The task function to evaluate */
  task: EvalTask<TInput, TExpected, TOutput>;
  /** Array of scoring functions to evaluate the task output */
  scorers: ReadonlyArray<Scorer<TInput, TExpected, TOutput>>;
  /** Optional metadata for the evaluation */
  metadata?: Record<string, unknown>;
  /** Optional timeout in milliseconds for task execution */
  timeout?: number;
  /** Optional reduction of flag namespace */
  // TODO: BEFORE MERGE - make more typesafe
  configFlags?: string[];
};
