import { type LanguageModelV1, type LanguageModelV1CallOptions } from '@ai-sdk/providerv1';
import { createAxiomTelemetryV1 } from './middleware';

export function isLanguageModelV1(model: unknown): model is LanguageModelV1 {
  return (
    model != null &&
    typeof model === 'object' &&
    'specificationVersion' in model &&
    'provider' in model &&
    'modelId' in model &&
    (model as any).specificationVersion === 'v1' &&
    typeof (model as any).provider === 'string' &&
    typeof (model as any).modelId === 'string'
  );
}

/**
 * Wraps a LanguageModelV1 to provide OpenTelemetry instrumentation.
 * 
 * Internally uses Axiom's telemetry middleware while maintaining a simple class-based API.
 * 
 * @example
 * ```typescript
 * import { AxiomWrappedLanguageModelV1 } from '@axiom/ai';
 * import { openai } from '@ai-sdk/openai';
 * 
 * const model = new AxiomWrappedLanguageModelV1(openai('gpt-3.5-turbo'));
 * ```
 * 
 * For advanced use cases, you can also use the middleware directly:
 * ```typescript
 * import { wrapLanguageModel } from 'ai';
 * import { createAxiomTelemetryV1 } from '@axiom/ai';
 * 
 * const model = wrapLanguageModel({
 *   model: yourV1Model,
 *   middleware: createAxiomTelemetryV1(),
 * });
 * ```
 */
export class AxiomWrappedLanguageModelV1 {
  constructor(model: LanguageModelV1) {
    const middleware = createAxiomTelemetryV1();
    
    // Return the wrapped model directly from constructor
    return {
      specificationVersion: model.specificationVersion,
      provider: model.provider,
      modelId: model.modelId,
      defaultObjectGenerationMode: model.defaultObjectGenerationMode,
      supportsImageUrls: model.supportsImageUrls,
      supportsStructuredOutputs: model.supportsStructuredOutputs,
      supportsUrl: model.supportsUrl?.bind(model),
      
      doGenerate: async (params: LanguageModelV1CallOptions) => {
        return middleware.wrapGenerate!({
          doGenerate: () => model.doGenerate(params),
          doStream: () => model.doStream(params),
          params,
          model,
        });
      },
      
      doStream: async (params: LanguageModelV1CallOptions) => {
        return middleware.wrapStream!({
          doGenerate: () => model.doGenerate(params),
          doStream: () => model.doStream(params),
          params,
          model,
        });
      },
    } as LanguageModelV1;
  }
}
