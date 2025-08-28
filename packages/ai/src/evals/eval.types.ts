import type { Scorer } from 'src/scorers/scorer.types';
import type { ModelParams, PromptMessage } from 'src/types';

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
export type EvalTask<TInput, TExpected> = (args: {
  model: string;
  params: ModelParams;
  input: TInput;
  expected: TExpected;
}) => Promise<any> | any;

/**
 * Record type of a matric of collection data
 */
export type CollectionRecord = {
  /** Optional name for the record, if not set, it will default to eval name + index of the record */
  input: string | Record<string, any>;
  expected: string | Record<string, any>;
  metadata?: Record<string, any>;
};

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
  data: () => Promise<CollectionRecord[]> | CollectionRecord[];
  /** The name of the model */
  model: string;
  /** The {@Link Options} object to configure models */
  params: ModelParams;
  /** The {@Link PromptMessage[]} template */
  prompt: PromptMessage[];
  /** The {@link EvalTask} function to execute for each data item */
  task: EvalTask<any, any>;
  /** Array of scoring functions to evaluate the task output, producing {@link Score} results */
  scorers: Array<Scorer>;
  /** KeyValue map for extra metadata */
  metadata?: Record<string, any>;
  /** Optional timeout in milliseconds for task execution */
  timeout?: number;
};
