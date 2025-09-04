import type { z } from 'zod';

export type CapabilityDefinition = {
  name: string;
  description?: string;
};

export type StepConfig = Record<string, any>;

export type StepDefinition = {
  name: string;
  capability: string;
  description?: string;
  config: z.Schema;
  run: ({
    input,
  }: {
    input: string | Record<string, any>;
    config: StepConfig;
  }) => string | Record<string, any>;
};

export const defineCapability = (def: CapabilityDefinition) => {
  // Register in global registry when executed
  if (typeof globalThis !== 'undefined' && globalThis.__axiom_registry) {
    globalThis.__axiom_registry.capabilites.push(def);
  }
  return def;
};

export const defineConfig = (def: StepConfig) => {
  return def;
};

export const defineStep = (def: StepDefinition) => {
  // Register in global registry when executed
  if (typeof globalThis !== 'undefined' && globalThis.__axiom_registry) {
    globalThis.__axiom_registry.steps.push(def);
  }
  return def;
};
