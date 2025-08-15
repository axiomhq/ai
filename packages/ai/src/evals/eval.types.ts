import type { Score, Scorer } from 'src/scorers/scorer.types';
import type { TestError } from 'vitest';

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
  data: () => Promise<{ input: any; expected: any }[]> | { input: any; expected: any }[];
  /** The {@link EvalTask} function to execute for each data item */
  task: EvalTask<any, any>;
  /** Array of scoring functions to evaluate the task output, producing {@link Score} results */
  scorers: Array<Scorer>;
  /** Minimum score threshold for passing (0.0 to 1.0) */
  threshold: number;
  /** Optional timeout in milliseconds for task execution */
  timeout?: number;
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
  index: number;
  /** Name of the evaluation */
  name: string;
  /** Input data that was provided to the {@link EvalTask} */
  input: string;
  /** Output produced by the {@link EvalTask} */
  output: string;
  /** Expected output for comparison */
  expected: string;
  /** Array of {@link Score} results from all scorers that were run */
  scores: Record<string, Score>;
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
