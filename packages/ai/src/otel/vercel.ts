import { type LanguageModelV1 } from '@ai-sdk/providerv1';
import { type LanguageModelV2 } from '@ai-sdk/providerv2';
import { type LanguageModelV3 } from '@ai-sdk/providerv3';

import { AxiomWrappedLanguageModelV1, isLanguageModelV1 } from './AxiomWrappedLanguageModelV1';
import { AxiomWrappedLanguageModelV2, isLanguageModelV2 } from './AxiomWrappedLanguageModelV2';
import { AxiomWrappedLanguageModelV3, isLanguageModelV3 } from './AxiomWrappedLanguageModelV3';

/**
 * Wraps an AI SDK model to provide OpenTelemetry instrumentation.
 *
 * Supports AI SDK v4 (LanguageModelV1), v5 (LanguageModelV2) and v6 (LanguageModelV3) models.
 *
 * @param model - Language model implementing LanguageModelV1, LanguageModelV2 or LanguageModelV3 interface
 * @returns Wrapped model with identical interface but added instrumentation
 */
export function wrapAISDKModel<T extends LanguageModelV1 | LanguageModelV2 | LanguageModelV3>(
  model: T,
): T {
  if (isLanguageModelV3(model)) {
    return new AxiomWrappedLanguageModelV3(model) as never as T;
  } else if (isLanguageModelV2(model)) {
    return new AxiomWrappedLanguageModelV2(model) as never as T;
  } else if (isLanguageModelV1(model)) {
    return new AxiomWrappedLanguageModelV1(model) as never as T;
  } else {
    console.warn('Unsupported AI SDK model. Not wrapping.');
    return model;
  }
}
