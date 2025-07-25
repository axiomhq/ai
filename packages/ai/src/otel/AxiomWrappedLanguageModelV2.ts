import { type LanguageModelV2, type LanguageModelV2CallOptions } from '@ai-sdk/providerv2';
import { createAxiomTelemetryV2 } from './middleware';

export function isLanguageModelV2(model: any): model is LanguageModelV2 {
  return (
    model?.specificationVersion === 'v2' &&
    typeof model?.provider === 'string' &&
    typeof model?.modelId === 'string'
  );
}

/**
 * Wraps a LanguageModelV2 to provide OpenTelemetry instrumentation.
 *
 * Internally uses Axiom's telemetry middleware while maintaining a simple class-based API.
 *
 * @example
 * ```typescript
 * import { AxiomWrappedLanguageModelV2 } from '@axiom/ai';
 * import { anthropic } from '@ai-sdk/anthropic';
 *
 * const model = new AxiomWrappedLanguageModelV2(anthropic('claude-3-haiku-20240307'));
 * ```
 *
 * For advanced use cases, you can also use the middleware directly:
 * ```typescript
 * import { wrapLanguageModel } from 'ai';
 * import { createAxiomTelemetryV2 } from '@axiom/ai';
 *
 * const model = wrapLanguageModel({
 *   model: yourV2Model,
 *   middleware: createAxiomTelemetryV2(),
 * });
 * ```
 */
export class AxiomWrappedLanguageModelV2 {
  constructor(model: LanguageModelV2) {
    const middleware = createAxiomTelemetryV2();

    // Return the wrapped model directly from constructor
    return {
      specificationVersion: model.specificationVersion,
      provider: model.provider,
      modelId: model.modelId,
      supportedUrls: model.supportedUrls,

      doGenerate: async (params: LanguageModelV2CallOptions) => {
        return middleware.wrapGenerate!({
          doGenerate: () => model.doGenerate(params),
          doStream: () => model.doStream(params),
          params,
          model,
        });
      },

      doStream: async (params: LanguageModelV2CallOptions) => {
        return middleware.wrapStream!({
          doGenerate: () => model.doGenerate(params),
          doStream: () => model.doStream(params),
          params,
          model,
        });
      },
    } as LanguageModelV2;
  }
}
