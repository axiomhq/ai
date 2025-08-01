import { AxiomAIResources, type AxiomAIConfig } from './shared';

/**
 * Register this in your `instrumentation.ts` to set up @axiomhq/ai.
 * This function registers the tracer to enable Context Propagation and Instrumentation Scope.
 * If you do not register a tracer, some spans may not be linked properly.
 *
 * @param config
 * @param config.tracer - The tracer that you are using in your application.
 * @param config.redact - Defaults for which inputs/outputs to redact
 */
export function initAxiomAI(config: AxiomAIConfig) {
  AxiomAIResources.getInstance().init(config);
}

/**
 * Reset AxiomAI configuration (useful for testing)
 */
export function resetAxiomAI() {
  AxiomAIResources.getInstance().reset();
}
