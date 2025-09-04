import type { CapabilityDefinition, StepDefinition } from 'src/capabilities';
import type { EvalDefinition } from 'src/evals';

export type CollectorRegistry = {
  capabilities: CapabilityDefinition[];
  steps: StepDefinition[];
  evals: EvalDefinition[];
};

export function resetRegistry() {
  globalThis.__axiom_registry.capabilities = [];
  globalThis.__axiom_registry.steps = [];
  globalThis.__axiom_registry.evals = [];
}
