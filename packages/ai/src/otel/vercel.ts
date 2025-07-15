import { type LanguageModelV1 } from '@ai-sdk/providerv1';
import { type LanguageModelV2 } from '@ai-sdk/providerv2';

import { AxiomWrappedLanguageModelV1, isLanguageModelV1 } from './AxiomWrappedLanguageModelV1';
import { AxiomWrappedLanguageModelV2, isLanguageModelV2 } from './AxiomWrappedLanguageModelV2';

/**
 * Wraps an AI SDK model to provide OpenTelemetry instrumentation.
 *
 * Supports both AI SDK v4 (LanguageModelV1) and v5 (LanguageModelV2) models.
 *
 * Features:
 * - OpenTelemetry span creation with semantic conventions
 * - Request/response attribute tracking
 * - Token usage monitoring (v1: promptTokens/completionTokens, v2: inputTokens/outputTokens)
 * - Streaming response instrumentation
 * - Tool call tracking and formatting
 * - Compatible with withSpan for nested instrumentation
 *
 * @param model - Language model implementing LanguageModelV1 or LanguageModelV2 interface
 * @returns Wrapped model with identical interface but added instrumentation
 */
export function wrapAISDKModel<T extends LanguageModelV1 | LanguageModelV2>(model: T): T {
  if (isLanguageModelV2(model)) {
    return new AxiomWrappedLanguageModelV2(model) as never as T;
  } else if (isLanguageModelV1(model)) {
    return new AxiomWrappedLanguageModelV1(model) as never as T;
  } else {
    console.warn('Unsupported AI SDK model. Not wrapping.');
    return model;
  }
}
