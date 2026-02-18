import { context, trace, SpanStatusCode, type SpanContext } from '@opentelemetry/api';
import { getGlobalTracer } from '../otel/initAxiomAI';
import type {
  OnlineEvalScorerEntry,
  OnlineEvalScorerInput,
  SampledOnlineEvalScorer,
  Scorer,
  ScorerResult,
  ScorerSampling,
} from './types';
import { executeScorer } from './executor';
import { Attr } from '../otel/semconv/attributes';
import type { ValidateName } from '../util/name-validation';
import { isValidName } from '../util/name-validation-runtime';

type ScorerEntry<TInput, TOutput> = OnlineEvalScorerEntry<TInput, TOutput, any>;
type ScorerInput<TInput, TOutput> = OnlineEvalScorerInput<TInput, TOutput, any>;

type InferScorerMetadata<TScorerEntry> =
  TScorerEntry extends SampledOnlineEvalScorer<any, any, any>
    ? InferScorerMetadata<TScorerEntry['scorer']>
    : TScorerEntry extends Scorer<any, any, infer TMetadata>
      ? TMetadata
      : TScorerEntry extends ScorerResult<infer TMetadata>
        ? TMetadata
        : never;

type InferScorerName<TScorerEntry> =
  TScorerEntry extends SampledOnlineEvalScorer<any, any, any>
    ? InferScorerName<TScorerEntry['scorer']>
    : TScorerEntry extends ScorerResult<any>
      ? TScorerEntry['name']
      : TScorerEntry extends Scorer<any, any, any>
        ? string
        : never;

type IsBroadString<T extends string> = string extends T ? true : false;

type DuplicateScorerNames<
  TEntries extends readonly unknown[],
  Seen extends string = never,
  Duplicates extends string = never,
> = TEntries extends readonly [infer Head, ...infer Tail]
  ? InferScorerName<Head> extends infer ScorerName
    ? ScorerName extends string
      ? IsBroadString<ScorerName> extends true
        ? DuplicateScorerNames<Tail extends readonly unknown[] ? Tail : never, Seen, Duplicates>
        : ScorerName extends Seen
          ? DuplicateScorerNames<
              Tail extends readonly unknown[] ? Tail : never,
              Seen,
              Duplicates | ScorerName
            >
          : DuplicateScorerNames<
              Tail extends readonly unknown[] ? Tail : never,
              Seen | ScorerName,
              Duplicates
            >
      : DuplicateScorerNames<Tail extends readonly unknown[] ? Tail : never, Seen, Duplicates>
    : never
  : Duplicates;

type EnsureUniqueScorerNames<TEntries extends readonly unknown[]> = [
  DuplicateScorerNames<TEntries>,
] extends [never]
  ? TEntries
  : never & {
      __axiomDuplicateScorerNames__: DuplicateScorerNames<TEntries>;
    };

type InferOnlineEvalResult<TScorers extends readonly unknown[]> = ScorerResult<
  InferScorerMetadata<TScorers[number]>
>;

type InferOnlineEvalResultRecord<TScorers extends readonly unknown[]> = Partial<
  Record<Extract<InferScorerName<TScorers[number]>, string>, InferOnlineEvalResult<TScorers>>
>;

type NormalizedScorerEntry<TInput, TOutput> = {
  name: string;
  scorer: ScorerInput<TInput, TOutput>;
  sampling?: ScorerSampling<TInput, TOutput>;
};

/**
 * Options for online evaluation.
 */
export type OnlineEvalParams<
  TInput,
  TOutput,
  TScorers extends readonly ScorerEntry<TInput, TOutput>[] = readonly ScorerEntry<
    TInput,
    TOutput
  >[],
> = {
  /** High-level capability being evaluated (e.g., 'qa', 'summarization') */
  capability: string;
  /** Specific step within the capability (e.g., 'answer', 'extract') */
  step?: string;
  /**
   * Explicit SpanContext(s) to link the eval span to originating generation span(s).
   * When omitted, the active span's context is used automatically.
   * Use this for deferred evaluation when onlineEval is called after the
   * originating span has completed.
   * Supports both single context and multiple contexts for multi-span linking.
   */
  links?: SpanContext | SpanContext[];
  /** Input to pass to scorers (optional - only needed for input+output scorers) */
  input?: TInput;
  /** Output to evaluate */
  output: TOutput;
  /** Scorers or precomputed scores. Supports optional per-scorer sampling. */
  scorers: EnsureUniqueScorerNames<TScorers>;
};

/**
 * Determines if an individual scorer should run based on sampling configuration.
 */
async function shouldSample<TInput, TOutput>(
  sampling: ScorerSampling<TInput, TOutput> | undefined,
  args: { input?: TInput; output: TOutput },
): Promise<boolean> {
  if (sampling === undefined) return true;
  if (typeof sampling === 'number') {
    if (sampling >= 1) return true;
    if (sampling <= 0) return false;
    return Math.random() < sampling;
  }
  return Boolean(await sampling(args));
}

function isSampledScorerEntry<TInput, TOutput>(
  entry: ScorerEntry<TInput, TOutput>,
): entry is SampledOnlineEvalScorer<TInput, TOutput, any> {
  return typeof entry === 'object' && entry !== null && 'scorer' in entry;
}

function resolveScorerName<TInput, TOutput>(scorer: ScorerInput<TInput, TOutput>): string {
  if (typeof scorer === 'function') {
    return scorer.name || 'unknown';
  }
  return scorer.name;
}

function normalizeScorerEntry<TInput, TOutput>(
  entry: ScorerEntry<TInput, TOutput>,
): NormalizedScorerEntry<TInput, TOutput> {
  if (isSampledScorerEntry(entry)) {
    return {
      name: resolveScorerName(entry.scorer),
      scorer: entry.scorer,
      sampling: entry.sampling,
    };
  }

  return {
    name: resolveScorerName(entry),
    scorer: entry,
  };
}

function getDuplicateScorerNames<TInput, TOutput>(
  entries: readonly NormalizedScorerEntry<TInput, TOutput>[],
): string[] {
  const nameCounts = new Map<string, number>();

  for (const entry of entries) {
    nameCounts.set(entry.name, (nameCounts.get(entry.name) ?? 0) + 1);
  }

  return [...nameCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort();
}

/**
 * Run online evaluation scorers against production outputs.
 *
 * Returns a promise that resolves to scorer results. Use `void onlineEval(...)`
 * for fire-and-forget, or `await onlineEval(...)` when you need to wait for
 * completion (e.g., before flushing telemetry in short-lived processes).
 *
 * Each eval span links back to the originating generation span via an
 * OpenTelemetry span link. Parent/child hierarchy follows natural context
 * propagation — inside `withSpan` the eval is a child, outside it depends
 * on the active context.
 *
 * ## Usage Patterns
 *
 * **Inside withSpan (recommended):**
 * Active span is automatically detected and linked.
 * ```ts
 * await withSpan({ capability: 'qa', step: 'answer' }, async () => {
 *   const response = await generateText({ ... });
 *   void onlineEval(
 *     'my-eval',
 *     { capability: 'qa', step: 'answer' },
 *     { output: response.text, scorers: [formatScorer] }
 *   );
 *   return response.text;
 * });
 * ```
 *
 * **Deferred evaluation with explicit link:**
 * Pass the originating span's context for linking when evaluating later.
 * Supports single or multiple span contexts.
 * ```ts
 * let spanCtx: SpanContext;
 * const result = await withSpan({ ... }, async (span) => {
 *   spanCtx = span.spanContext();
 *   return await generateText({ ... });
 * });
 * void onlineEval('my-eval', { ..., links: spanCtx }, { output: result, scorers });
 *
 * // Or link to multiple spans:
 * void onlineEval('my-eval', { ..., links: [spanCtx1, spanCtx2] }, { output, scorers });
 * ```
 *
 * **Awaiting for flush (short-lived processes):**
 * ```ts
 * await onlineEval('my-eval', { ... }, { output, scorers });
 * await flushTelemetry();
 * ```
 *
 * @param name - Eval name (A-Z, a-z, 0-9, -, _ only). Used as the span name and `eval.name` attribute.
 * @param meta - Evaluation metadata for categorization
 * @param meta.capability - High-level capability being evaluated
 * @param meta.step - Optional step within the capability
 * @param meta.links - Optional SpanContext(s) to link to (auto-detected if omitted)
 * @param params - Evaluation configuration
 * @param options.input - Input to pass to scorers
 * @param options.output - Output to evaluate
 * @param options.scorers - Scorer entries with optional per-scorer sampling
 * @returns Promise resolving to scorer results keyed by scorer name
 */
export function onlineEval<
  TInput,
  TOutput,
  Name extends string,
  const TScorers extends readonly ScorerEntry<TInput, TOutput>[],
>(
  name: ValidateName<Name>,
  params: OnlineEvalParams<TInput, TOutput, TScorers>,
): Promise<InferOnlineEvalResultRecord<TScorers>> {
  const nameValidation = isValidName(name as string);
  if (!nameValidation.valid) {
    throw new Error(`[AxiomAI] Invalid eval name: ${nameValidation.error}`);
  }

  if (params.scorers.length === 0) {
    return Promise.resolve({});
  }

  const rawLinks = params.links ?? trace.getSpan(context.active())?.spanContext();
  const linkContexts = rawLinks ? (Array.isArray(rawLinks) ? rawLinks : [rawLinks]) : [];

  return executeOnlineEvalInternal(name as string, params, linkContexts);
}

async function executeOnlineEvalInternal<
  TInput,
  TOutput,
  const TScorers extends readonly ScorerEntry<TInput, TOutput>[],
>(
  name: string,
  params: OnlineEvalParams<TInput, TOutput, TScorers>,
  linkContexts: SpanContext[],
): Promise<InferOnlineEvalResultRecord<TScorers>> {
  const tracer = getGlobalTracer();

  const evalSpan = tracer.startSpan(
    `eval ${name}`,
    linkContexts.length > 0 ? { links: linkContexts.map((ctx) => ({ context: ctx })) } : {},
  );

  const evalAttrs: Record<string, string> = {
    [Attr.GenAI.Operation.Name]: 'eval',
    [Attr.Eval.Name]: name,
    [Attr.Eval.Capability.Name]: params.capability,
    [Attr.Eval.Tags]: JSON.stringify(['online']),
  };
  if (params.step) {
    evalAttrs[Attr.Eval.Step.Name] = params.step;
  }
  evalSpan.setAttributes(evalAttrs);

  try {
    const normalizedScorers = params.scorers.map((entry) => normalizeScorerEntry(entry));
    const duplicateScorerNames = getDuplicateScorerNames(normalizedScorers);
    if (duplicateScorerNames.length > 0) {
      throw new Error(
        `Duplicate scorer names are not allowed: ${duplicateScorerNames
          .map((name) => `"${name}"`)
          .join(', ')}`,
      );
    }

    const outcomes = await Promise.all(
      normalizedScorers.map(async (entry) => {
        try {
          const sampledIn = await shouldSample(entry.sampling, {
            input: params.input,
            output: params.output,
          });

          if (!sampledIn) {
            return { sampledOut: true as const };
          }

          return {
            sampledOut: false as const,
            result: await executeScorer({
              scorer: entry.scorer,
              input: params.input,
              output: params.output,
              parentSpan: evalSpan,
              capability: params.capability,
              step: params.step,
              evalName: name,
            }),
          };
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          return {
            sampledOut: false as const,
            result: await executeScorer({
              scorer: {
                name: entry.name,
                score: null,
                error: error.message,
              },
              input: params.input,
              output: params.output,
              parentSpan: evalSpan,
              capability: params.capability,
              step: params.step,
              evalName: name,
            }),
          };
        }
      }),
    );

    const results: Record<string, InferOnlineEvalResult<TScorers>> = {};
    let sampledOutCount = 0;

    for (const outcome of outcomes) {
      if (outcome.sampledOut) {
        sampledOutCount += 1;
        continue;
      }

      results[outcome.result.name] = outcome.result as InferOnlineEvalResult<TScorers>;
    }

    const failedCount = Object.values(results).filter((result) => result.error).length;
    const ranCount = Object.keys(results).length;

    const scoresSummary: Record<string, ScorerResult> = {};
    for (const [name, result] of Object.entries(results)) {
      scoresSummary[name] = {
        name: result.name,
        score: result.score,
        ...(result.metadata &&
          Object.keys(result.metadata).length > 0 && { metadata: result.metadata }),
        ...(result.error && { error: result.error }),
      };
    }

    evalSpan.setAttributes({
      [Attr.Eval.Case.Scores]: JSON.stringify(scoresSummary),
      'axiom.eval.online.scorers.total': normalizedScorers.length,
      'axiom.eval.online.scorers.ran': ranCount,
      'axiom.eval.online.scorers.sampled_out': sampledOutCount,
      'axiom.eval.online.scorers.failed': failedCount,
    });

    if (failedCount > 0) {
      evalSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'One or more scorers failed',
      });
    } else {
      evalSpan.setStatus({ code: SpanStatusCode.OK });
    }

    return results as InferOnlineEvalResultRecord<TScorers>;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    evalSpan.recordException(error);
    evalSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    return {};
  } finally {
    evalSpan.end();
  }
}
