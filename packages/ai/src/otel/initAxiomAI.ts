import type { Tracer } from '@opentelemetry/api';
import { AxiomAIResources } from './shared';

/**
 * Register this in your `instrumentation.ts` to set up @axiomhq/ai.
 * This function registers the tracer to enable Context Propagation and Instrumentation Scope.
 * If you do not register a tracer, some spans may not be linked properly.
 *
 * @param config
 * @param config.tracer - The tracer that you are using in your application.
 */
export function initAxiomAI(config: { tracer: Tracer }) {
  AxiomAIResources.getInstance().init(config);
}

/**
 * Reset AxiomAI configuration (useful for testing)
 */
export function resetAxiomAI() {
  AxiomAIResources.getInstance().reset();
}
