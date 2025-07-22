import type { Tracer } from '@opentelemetry/api';
import { AxiomAIResources } from './shared';

export function initAxiomAI(config: { tracer: Tracer }) {
  AxiomAIResources.getInstance().init(config);
}
