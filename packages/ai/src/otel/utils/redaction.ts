import { propagation, type Span, type Baggage } from '@opentelemetry/api';
import { AxiomAIResources, type RedactionSettings } from '../shared';

export const REDACT_BAGGAGE_PREFIX = 'axiom.redact';
export const BAGGAGE_KEYS = {
  prompts: `${REDACT_BAGGAGE_PREFIX}.prompts`,
  completions: `${REDACT_BAGGAGE_PREFIX}.completions`,
  toolArgs: `${REDACT_BAGGAGE_PREFIX}.tool_args`,
  toolMsgs: `${REDACT_BAGGAGE_PREFIX}.tool_msgs`,
} as const;

export const RedactionKind = {
  Prompts: 'prompts',
  Completions: 'completions',
  ToolArgs: 'toolArgs',
  ToolMsgs: 'toolMsgs',
} as const;

export type RedactionKind = (typeof RedactionKind)[keyof typeof RedactionKind];

type NormalizedRedactionSettings = {
  prompts: boolean;
  completions: boolean;
  toolArguments: boolean;
  toolMessages: boolean;
};

/**
 * Merge global and local redaction settings
 * Local settings override global defaults
 */
export function mergeRedactionSettings(
  globalCfg?: RedactionSettings,
  localCfg?: RedactionSettings,
): NormalizedRedactionSettings {
  const normalize = (settings?: RedactionSettings): Partial<NormalizedRedactionSettings> => {
    if (!settings) return {};
    if (settings === 'all') {
      return { prompts: true, completions: true, toolArguments: true, toolMessages: true };
    }
    if (settings === 'none') {
      return { prompts: false, completions: false, toolArguments: false, toolMessages: false };
    }
    return settings;
  };

  const normalizedGlobal = normalize(globalCfg);
  const normalizedLocal = normalize(localCfg);

  // Local overrides global, with false as default
  return {
    prompts: normalizedLocal.prompts ?? normalizedGlobal.prompts ?? false,
    completions: normalizedLocal.completions ?? normalizedGlobal.completions ?? false,
    toolArguments: normalizedLocal.toolArguments ?? normalizedGlobal.toolArguments ?? false,
    toolMessages: normalizedLocal.toolMessages ?? normalizedGlobal.toolMessages ?? false,
  };
}

/**
 * Add redaction settings to OpenTelemetry baggage
 */
export function applyRedactToBaggage(
  baggage: Baggage,
  redaction: NormalizedRedactionSettings,
): Baggage {
  const existingEntries: Record<string, { value: string }> = {};

  baggage.getAllEntries().forEach(([key, entry]) => {
    existingEntries[key] = { value: entry.value };
  });

  existingEntries[BAGGAGE_KEYS.prompts] = { value: redaction.prompts ? '1' : '0' };
  existingEntries[BAGGAGE_KEYS.completions] = { value: redaction.completions ? '1' : '0' };
  existingEntries[BAGGAGE_KEYS.toolArgs] = { value: redaction.toolArguments ? '1' : '0' };
  existingEntries[BAGGAGE_KEYS.toolMsgs] = { value: redaction.toolMessages ? '1' : '0' };

  return propagation.createBaggage(existingEntries);
}

/**
 * Get current redaction settings from active baggage context
 * Falls back to global singleton if no baggage context
 */
export function getCurrentRedactionSettings(): NormalizedRedactionSettings {
  const bag = propagation.getActiveBaggage();

  if (bag) {
    const prompts = bag.getEntry(BAGGAGE_KEYS.prompts)?.value === '1';
    const completions = bag.getEntry(BAGGAGE_KEYS.completions)?.value === '1';
    const toolArguments = bag.getEntry(BAGGAGE_KEYS.toolArgs)?.value === '1';
    const toolMessages = bag.getEntry(BAGGAGE_KEYS.toolMsgs)?.value === '1';

    if (
      bag.getEntry(BAGGAGE_KEYS.prompts) ||
      bag.getEntry(BAGGAGE_KEYS.completions) ||
      bag.getEntry(BAGGAGE_KEYS.toolArgs) ||
      bag.getEntry(BAGGAGE_KEYS.toolMsgs)
    ) {
      return { prompts, completions, toolArguments, toolMessages };
    }
  }

  const globalRedact = AxiomAIResources.getInstance().getRedact();
  return mergeRedactionSettings(globalRedact, undefined);
}

/**
 * Check if an attribute should be set based on redaction settings
 */
export function shouldSetAttribute(kind: RedactionKind): boolean {
  const settings = getCurrentRedactionSettings();

  switch (kind) {
    case RedactionKind.Prompts:
      return !settings.prompts;
    case RedactionKind.Completions:
      return !settings.completions;
    case RedactionKind.ToolArgs:
      return !settings.toolArguments;
    case RedactionKind.ToolMsgs:
      return !settings.toolMessages;
    default:
      return true;
  }
}

/**
 * Conditionally set span attribute only if not redacted
 */
export function setAttributeIfNotRedacted<T>(
  span: Span,
  attributeName: string,
  payload: T,
  kind: RedactionKind,
): void {
  if (shouldSetAttribute(kind)) {
    span.setAttribute(attributeName, payload as any);
  }
}
