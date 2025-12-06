import type { TaskMeta } from 'vitest';
import type { ScoreWithName, ScorerLike } from './scorers';

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
export type EvalTask<TInput, TExpected, TOutput> = (args: {
  input: TInput;
  expected: TExpected;
}) => TOutput | Promise<TOutput> | AsyncIterable<TOutput>;

/**
 * Record type representing a single data point in an evaluation dataset.
 *
 */
export type CollectionRecord<TInput, TExpected> = {
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
 */
export type EvalParams<TInput, TExpected, TOutput> = {
  /** Dataset with input/expected pairs for evaluation, or a function that returns one */
  data:
    | readonly CollectionRecord<TInput, TExpected>[]
    | Promise<readonly CollectionRecord<TInput, TExpected>[]>
    | (() =>
        | readonly CollectionRecord<TInput, TExpected>[]
        | Promise<readonly CollectionRecord<TInput, TExpected>[]>);
  capability: string;
  step?: string | undefined;
  /** The task function to evaluate */
  task: EvalTask<TInput, TExpected, TOutput>;
  /** Array of scoring functions to evaluate the task output */
  scorers: ReadonlyArray<ScorerLike<TInput, TExpected, TOutput>>;
  /** Optional metadata for the evaluation */
  metadata?: Record<string, unknown>;
  /** Optional timeout in milliseconds for task execution */
  timeout?: number;
  /** Optional reduction of flag namespace */
  configFlags?: string[];
};

// Discriminated-union type for per-case runtime flags (console/meta only)
export type RuntimeFlagLog =
  | { kind: 'introduced'; value: unknown }
  | { kind: 'replaced'; value: unknown; default: unknown };

export type RuntimeFlagMap = Record<string, RuntimeFlagLog>;

export type Evaluation = {
  id: string;
  name: string;
  type: string;
  version: string;
  baseline: {
    id: string | undefined;
    name: string | undefined;
  };
  collection: {
    name: string;
    size: number;
  };
  prompt: {
    model: string;
    params: Record<string, unknown>;
  };
  duration: number;
  status: string;
  traceId: string;
  runAt: string;
  tags: string[];
  user: {
    name: string | undefined;
    email: string | undefined;
  };
  cases: Case[];
  flagConfig?: Record<string, any>;
};

export type Case = {
  index: number;
  input: string;
  output: string;
  expected: string;
  duration: string;
  status: string;
  scores: Record<
    string,
    {
      name: string;
      value: number;
      metadata: Record<string, any>;
    }
  >;
  runAt: string;
  spanId: string;
  traceId: string;
  task?: Task;
  runtimeFlags?: RuntimeFlagMap;
};

export type Chat = {
  operation: string;
  capability: string;
  step: string;
  request: {
    max_token: string;
    model: string;
    temperature: number;
  };
  response: {
    finish_reasons: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

export type Task = {
  name: string;
  output: string;
  trial: number;
  type: string;
  error?: string;
  chat: Chat;
};

/**
 * Complete report for a single evaluation case including results and metadata.
 *
 * Generated for each test case when running {@link Eval} with {@link EvalParams}.
 * Contains all {@link Score} results and execution metadata.
 *
 */
export type EvalCaseReport = {
  /** Order/index of this case in the evaluation suite */
  index: number;
  /** Name of the evaluation */
  name: string;
  /** Input data that was provided to the {@link EvalTask} */
  input: string | Record<string, any>;
  /** Output produced by the {@link EvalTask} */
  output: string | Record<string, any>;
  /** Expected output for comparison */
  expected: string | Record<string, any>;
  /** Array of {@link Score} results from all scorers that were run */
  scores: Record<string, ScoreWithName>;
  /** Any errors that occurred during evaluation */
  errors: Error[] | null;
  /** Status of the evaluation case */
  status: 'success' | 'fail' | 'pending';
  /** Duration in milliseconds for the entire case */
  duration: number | undefined;
  /** Timestamp when the case started */
  startedAt: number | undefined;
  /** Flags accessed outside of the picked flags scope for this case */
  outOfScopeFlags?: OutOfScopeFlagAccess[];
  /** Flags that are in scope for this evaluation */
  pickedFlags?: string[];
  /** Runtime flags actually used during this case */
  runtimeFlags?: RuntimeFlagMap;
};

export type FlagDiff = {
  flag: string;
  current: string | undefined;
  baseline: string | undefined;
  default: string | undefined;
};

export type OutOfScopeFlagAccess = {
  flagPath: string;
  accessedAt: number;
  stackTrace: string[];
};

export type OutOfScopeFlag = {
  flagPath: string;
  count: number;
  firstAccessedAt: number;
  lastAccessedAt: number;
  stackTrace: string[];
};

export type RegistrationStatus = { status: 'success' } | { status: 'failed'; error: string };

export type EvaluationReport = {
  id: string;
  name: string;
  version: string;
  runId: string;
  orgId?: string;
  baseline: Evaluation | undefined;
  /** Flags that are in scope for this evaluation */
  configFlags?: string[];
  /** Full flag configuration for this evaluation run */
  flagConfig?: Record<string, any>;
  /** Summary of all flags accessed outside of picked flags scope across all cases */
  outOfScopeFlags?: OutOfScopeFlag[];
  /** End-of-suite config snapshot for console printing only */
  configEnd?: {
    flags?: Record<string, any>;
    pickedFlags?: string[];
    overrides?: Record<string, any>;
  };
  registrationStatus?: RegistrationStatus;
};

export type MetaWithEval = TaskMeta & { evaluation: EvaluationReport };
export type MetaWithCase = TaskMeta & { case: EvalCaseReport };
