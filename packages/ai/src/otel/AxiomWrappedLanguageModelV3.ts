import { type LanguageModelV3, type LanguageModelV3CallOptions } from '@ai-sdk/providerv3';
import { axiomAIMiddlewareV3 } from './middleware';

export function isLanguageModelV3(model: unknown): model is LanguageModelV3 {
  return (
    model != null &&
    typeof model === 'object' &&
    'specificationVersion' in model &&
    'provider' in model &&
    'modelId' in model &&
    (model as any).specificationVersion === 'v3' &&
    typeof (model as any).provider === 'string' &&
    typeof (model as any).modelId === 'string'
  );
}

/**
 * Wraps a LanguageModelV3 to provide OpenTelemetry instrumentation.
 *
 * Internally uses Axiom's telemetry middleware while maintaining a simple class-based API.
 *
 * @example
 * ```typescript
 * import { AxiomWrappedLanguageModelV3 } from '@axiom/ai';
 * import { anthropic } from '@ai-sdk/anthropic';
 *
 * const model = new AxiomWrappedLanguageModelV3(anthropic('claude-sonnet-4-20250514'));
 * ```
 *
 * For advanced use cases, you can also use the middleware directly:
 * ```typescript
 * import { wrapLanguageModel } from 'ai';
 * import { createAxiomTelemetryV3 } from '@axiom/ai';
 *
 * const model = wrapLanguageModel({
 *   model: yourV3Model,
 *   middleware: createAxiomTelemetryV3(),
 * });
 * ```
 */
export class AxiomWrappedLanguageModelV3 {
  constructor(model: LanguageModelV3) {
    const middleware = axiomAIMiddlewareV3();

    // Return the wrapped model directly from constructor
    return {
      specificationVersion: model.specificationVersion,
      provider: model.provider,
      modelId: model.modelId,
      supportedUrls: model.supportedUrls,

      doGenerate: async (params: LanguageModelV3CallOptions) => {
        return middleware.wrapGenerate!({
          doGenerate: () => model.doGenerate(params),
          doStream: () => model.doStream(params),
          params,
          model,
        });
      },

      doStream: async (params: LanguageModelV3CallOptions) => {
        return middleware.wrapStream!({
          doGenerate: () => model.doGenerate(params),
          doStream: () => model.doStream(params),
          params,
          model,
        });
      },
    } as LanguageModelV3;
  }
}
