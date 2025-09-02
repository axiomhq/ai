import type { Scorer } from 'src/scorers/scorer.types';

/**
 * Function type for evaluation tasks that process input data and produce output.
 *
 * Used with {@link EvalDefinition} to define the task that will be evaluated against a dataset.
 * The task output will be scored by functions defined in {@link EvalDefinition.scorers}.
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
  metadata: Record<string, any>;
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
export interface EvalDefinition {
  capability: string;
  step: string;
  /** Function that returns the dataset with input/expected pairs for evaluation */
  data: () => Promise<CollectionRecord[]> | CollectionRecord[];
  /** The {@link EvalTask} function to execute for each data item */
  task: EvalTask<any, any>;
  /** Array of scoring functions to evaluate the task output, producing {@link Score} results */
  scorers: Array<Scorer>;
  /** KeyValue map for extra metadata */
  metadata?: Record<string, any>;
  tags?: string[];
  /** Optional timeout in milliseconds for task execution */
  timeout?: number;
}

export type ExperimentDefinition = {
  name: string;
  description?: string;
  metadata: Record<string, any>;
};
