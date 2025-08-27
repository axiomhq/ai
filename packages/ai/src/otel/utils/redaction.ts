import { context, propagation, type Baggage, type Span } from '@opentelemetry/api';
import { WITHSPAN_REDACTION_POLICY_KEY } from '../withSpanBaggageKey';

type CaptureMessageContent = 'full' | 'off';

export type AxiomAIRedactionPolicy = {
  captureMessageContent?: CaptureMessageContent;
  mirrorToolPayloadOnToolSpan?: boolean;
};

export const RedactionPolicy: Record<string, AxiomAIRedactionPolicy> = {
  /**
   * Includes message content on chat spans, and mirrors tool
   * payload on tool spans for more convenient querying.
   */
  AxiomDefault: {
    captureMessageContent: 'full',
    mirrorToolPayloadOnToolSpan: true,
  },
  /**
   * Redacts message content on chat spans, and does not put
   * tool payload on tool spans.
   */
  OpenTelemetryDefault: {
    captureMessageContent: 'off',
    mirrorToolPayloadOnToolSpan: false,
  },
};

// Global key to store redaction policy across all execution contexts
export const AXIOM_AI_REDACTION_KEY = Symbol.for('__axiom_ai_redaction__');

/**
 * Get the globally stored redaction policy
 * @returns The global redaction policy or undefined if not set
 */
function getGlobalRedactionPolicy(): AxiomAIRedactionPolicy | undefined {
  return (globalThis as any)[AXIOM_AI_REDACTION_KEY];
}

/**
 * Resolves the effective redaction policy by merging global and per-call policies.
 * Per-call policies take precedence over global policies.
 *
 * @param globalPolicy - The global redaction policy from initAxiomAI
 * @param localPolicy - The per-call redaction policy from withSpan or middleware
 * @returns The effective redaction policy with all fields resolved
 */
function getEffectiveRedactionPolicy(
  globalPolicy?: AxiomAIRedactionPolicy,
  localPolicy?: AxiomAIRedactionPolicy,
): AxiomAIRedactionPolicy {
  // Per-call policy overrides global policy, with defaults
  return {
    captureMessageContent:
      localPolicy?.captureMessageContent ?? globalPolicy?.captureMessageContent ?? 'full',
    mirrorToolPayloadOnToolSpan:
      localPolicy?.mirrorToolPayloadOnToolSpan ?? globalPolicy?.mirrorToolPayloadOnToolSpan ?? true,
  };
}

/**
 * Get the active redaction policy
 */
export function getRedactionPolicy() {
  return getEffectiveRedactionPolicy(getGlobalRedactionPolicy(), getPerCallRedactionPolicy());
}

/**
 * Conditionally sets a span attribute based on the capture message content policy.
 * When policy is 'off', the attribute is not set at all.
 *
 * @param span - The OpenTelemetry span to set the attribute on
 * @param attribute - The attribute name/key
 * @param value - The attribute value
 * @param captureMessageContent - The capture policy ('full' sets attribute, 'off' skips it)
 */
export function handleMaybeRedactedAttribute(
  span: Span,
  attribute: string,
  value: any,
  captureMessageContent?: CaptureMessageContent,
): void {
  if (captureMessageContent === 'full') {
    span.setAttribute(attribute, value);
  }

  // For 'off', don't set the attribute at all
  // Future: Could add callback-based redaction here
}

/**
 * Extracts the per-call redaction policy from OpenTelemetry baggage context.
 * This allows middleware and tools to access redaction policies passed via withSpan.
 *
 * @returns The per-call redaction policy or undefined if not set
 */
function getPerCallRedactionPolicy(): AxiomAIRedactionPolicy | undefined {
  const baggage: Baggage = propagation.getBaggage(context.active()) || propagation.createBaggage();
  const serializedPolicy = baggage.getEntry(WITHSPAN_REDACTION_POLICY_KEY)?.value;

  if (!serializedPolicy) {
    return undefined;
  }

  try {
    return JSON.parse(serializedPolicy) as AxiomAIRedactionPolicy;
  } catch (error) {
    console.warn('[AxiomAI] Failed to parse redaction policy from baggage:', error);
    return undefined;
  }
}
