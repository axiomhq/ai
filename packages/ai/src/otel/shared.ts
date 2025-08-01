import type { Tracer } from '@opentelemetry/api';

export type RedactionSettings =
  | 'all'
  | 'none'
  | {
      prompts?: boolean;
      completions?: boolean;
      toolArguments?: boolean;
      toolMessages?: boolean;
    };

export type AxiomAIConfig = {
  tracer: Tracer;
  redact?: RedactionSettings;
};

// Axiom AI Resources singleton for configuration management
export class AxiomAIResources {
  private static instance: AxiomAIResources;
  private tracer: Tracer | undefined;
  private redact: RedactionSettings | undefined;

  private constructor() {}

  static getInstance(): AxiomAIResources {
    if (!AxiomAIResources.instance) {
      AxiomAIResources.instance = new AxiomAIResources();
    }
    return AxiomAIResources.instance;
  }

  init(config: AxiomAIConfig): void {
    this.tracer = config.tracer;
    this.redact = config.redact;
  }

  getTracer(): Tracer | undefined {
    return this.tracer;
  }

  getRedact(): RedactionSettings | undefined {
    return this.redact;
  }

  /**
   * Reset the tracer (useful for testing)
   */
  reset(): void {
    this.tracer = undefined;
  }
}
