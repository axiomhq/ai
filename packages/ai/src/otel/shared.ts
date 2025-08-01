import type { Tracer } from '@opentelemetry/api';

// Axiom AI Resources singleton for configuration management
export class AxiomAIResources {
  private static instance: AxiomAIResources;
  private tracer: Tracer | undefined;

  private constructor() {}

  static getInstance(): AxiomAIResources {
    if (!AxiomAIResources.instance) {
      AxiomAIResources.instance = new AxiomAIResources();
    }
    return AxiomAIResources.instance;
  }

  init(config: { tracer: Tracer }): void {
    this.tracer = config.tracer;
  }

  getTracer(): Tracer | undefined {
    return this.tracer;
  }

  /**
   * Reset the tracer (useful for testing)
   */
  reset(): void {
    this.tracer = undefined;
  }
}
