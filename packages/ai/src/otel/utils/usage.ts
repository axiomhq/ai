import type { Span } from '@opentelemetry/api';
import type { LanguageModelV2Usage } from '@ai-sdk/providerv2';
import type { LanguageModelV3Usage } from '@ai-sdk/providerv3';
import { Attr } from '../semconv/attributes';
import { ensureNumber } from './wrapperUtils';

/**
 * Token usage in OTel GenAI semantics: `inputTokens` includes cache read and cache creation
 * tokens, and `outputTokens` includes reasoning tokens. `undefined` means the provider did not
 * report the count, so the attribute is omitted.
 */
export interface GenAiUsage {
  readonly inputTokens: number | undefined;
  readonly outputTokens: number | undefined;
  readonly cacheReadInputTokens: number | undefined;
  readonly cacheCreationInputTokens: number | undefined;
  readonly reasoningOutputTokens: number | undefined;
}

function getProviderMetadata(
  providerMetadata: unknown,
  provider: string,
): Record<string, unknown> | undefined {
  if (typeof providerMetadata !== 'object' || providerMetadata === null) return undefined;
  const entry = (providerMetadata as Record<string, unknown>)[provider];
  if (typeof entry !== 'object' || entry === null) return undefined;
  return entry as Record<string, unknown>;
}

/**
 * Anthropic reports `input_tokens` without cached tokens. Adds them back so the input count is
 * the total prompt size.
 */
function withCachedInputTokens(
  uncachedInputTokens: number | undefined,
  cacheReadInputTokens: number | undefined,
  cacheCreationInputTokens: number | undefined,
): number | undefined {
  if (uncachedInputTokens === undefined) return undefined;
  return uncachedInputTokens + (cacheReadInputTokens ?? 0) + (cacheCreationInputTokens ?? 0);
}

/**
 * AI SDK v4 (LanguageModelV1). The standard usage has only prompt and completion tokens, so
 * cache and reasoning counts come from Anthropic and OpenAI provider metadata.
 */
export function usageFromV1(
  usage: { promptTokens?: unknown; completionTokens?: unknown } | undefined,
  providerMetadata: unknown,
): GenAiUsage {
  const promptTokens = ensureNumber(usage?.promptTokens);
  const outputTokens = ensureNumber(usage?.completionTokens);

  const anthropic = getProviderMetadata(providerMetadata, 'anthropic');
  if (anthropic) {
    const cacheReadInputTokens = ensureNumber(anthropic.cacheReadInputTokens);
    const cacheCreationInputTokens = ensureNumber(anthropic.cacheCreationInputTokens);
    return {
      inputTokens: withCachedInputTokens(
        promptTokens,
        cacheReadInputTokens,
        cacheCreationInputTokens,
      ),
      outputTokens,
      cacheReadInputTokens,
      cacheCreationInputTokens,
      reasoningOutputTokens: undefined,
    };
  }

  // OpenAI's prompt tokens already include cached tokens.
  const openai = getProviderMetadata(providerMetadata, 'openai');
  return {
    inputTokens: promptTokens,
    outputTokens,
    cacheReadInputTokens: ensureNumber(openai?.cachedPromptTokens),
    cacheCreationInputTokens: undefined,
    reasoningOutputTokens: ensureNumber(openai?.reasoningTokens),
  };
}

/**
 * AI SDK v5 (LanguageModelV2). `cachedInputTokens` and `reasoningTokens` are standard fields.
 * Cache creation is only in Anthropic provider metadata, and Anthropic's `inputTokens` excludes
 * cached tokens.
 */
export function usageFromV2(
  usage: LanguageModelV2Usage | undefined,
  providerMetadata: unknown,
): GenAiUsage {
  const inputTokens = ensureNumber(usage?.inputTokens);
  const outputTokens = ensureNumber(usage?.outputTokens);
  const cacheReadInputTokens = ensureNumber(usage?.cachedInputTokens);
  const reasoningOutputTokens = ensureNumber(usage?.reasoningTokens);

  const anthropic = getProviderMetadata(providerMetadata, 'anthropic');
  if (anthropic) {
    const cacheCreationInputTokens = ensureNumber(anthropic.cacheCreationInputTokens);
    return {
      inputTokens: withCachedInputTokens(
        inputTokens,
        cacheReadInputTokens,
        cacheCreationInputTokens,
      ),
      outputTokens,
      cacheReadInputTokens,
      cacheCreationInputTokens,
      reasoningOutputTokens,
    };
  }

  return {
    inputTokens,
    outputTokens,
    cacheReadInputTokens,
    cacheCreationInputTokens: undefined,
    reasoningOutputTokens,
  };
}

/**
 * AI SDK v6 (LanguageModelV3). Usage is structured, and `inputTokens.total` already includes
 * cached tokens.
 */
export function usageFromV3(usage: LanguageModelV3Usage | undefined): GenAiUsage {
  return {
    inputTokens: ensureNumber(usage?.inputTokens?.total),
    outputTokens: ensureNumber(usage?.outputTokens?.total),
    cacheReadInputTokens: ensureNumber(usage?.inputTokens?.cacheRead),
    cacheCreationInputTokens: ensureNumber(usage?.inputTokens?.cacheWrite),
    reasoningOutputTokens: ensureNumber(usage?.outputTokens?.reasoning),
  };
}

function addCount(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a + b;
}

/** Sums usage across the steps that share one span. */
export function accumulateUsage(previous: GenAiUsage | undefined, next: GenAiUsage): GenAiUsage {
  if (!previous) return next;
  return {
    inputTokens: addCount(previous.inputTokens, next.inputTokens),
    outputTokens: addCount(previous.outputTokens, next.outputTokens),
    cacheReadInputTokens: addCount(previous.cacheReadInputTokens, next.cacheReadInputTokens),
    cacheCreationInputTokens: addCount(
      previous.cacheCreationInputTokens,
      next.cacheCreationInputTokens,
    ),
    reasoningOutputTokens: addCount(previous.reasoningOutputTokens, next.reasoningOutputTokens),
  };
}

const usageAttributes = [
  ['inputTokens', Attr.GenAI.Usage.InputTokens],
  ['outputTokens', Attr.GenAI.Usage.OutputTokens],
  ['cacheReadInputTokens', Attr.GenAI.Usage.CacheReadInputTokens],
  ['cacheCreationInputTokens', Attr.GenAI.Usage.CacheCreationInputTokens],
  ['reasoningOutputTokens', Attr.GenAI.Usage.ReasoningOutputTokens],
] as const satisfies ReadonlyArray<readonly [keyof GenAiUsage, string]>;

/** Sets the usage attributes whose counts are known. */
export function setUsageAttributes(span: Span, usage: GenAiUsage): void {
  for (const [key, attribute] of usageAttributes) {
    const value = usage[key];
    if (value !== undefined) {
      span.setAttribute(attribute, value);
    }
  }
}
