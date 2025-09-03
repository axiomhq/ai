import { trace } from '@opentelemetry/api';
import { createAsyncHook } from './manager';

// Mini-context for in-process access
const EVAL_CONTEXT = createAsyncHook<{
  flags: Record<string, any>;
  facts: Record<string, any>;
}>('eval-context');

export interface EvalContextData<Flags = any, Facts = any> {
  flags: Partial<Flags>;
  facts: Partial<Facts>;
}

export function getEvalContext<
  Flags extends Record<string, unknown> = any,
  Facts extends Record<string, unknown> = any,
>(): EvalContextData<Flags, Facts> {
  const ctx = EVAL_CONTEXT.get();
  if (!ctx) {
    // Return empty context if none exists
    return { flags: {} as Partial<Flags>, facts: {} as Partial<Facts> };
  }
  return {
    flags: ctx.flags as Partial<Flags>,
    facts: ctx.facts as Partial<Facts>,
  };
}

// Internal helper - not exported
// function setEvalContext(flags: Record<string, any>, facts: Record<string, any>) {
//   // This would require adding 'set' method to createAsyncHook interface
//   EVAL_CONTEXT.set({ flags: { ...flags }, facts: { ...facts } });
// }

export function updateEvalContext(flags?: Record<string, any>, facts?: Record<string, any>) {
  const current = EVAL_CONTEXT.get();
  if (!current) {
    console.warn('updateEvalContext called outside of evaluation context');
    return;
  }

  // Mutate the existing context (safe within the same async context)
  if (flags) {
    Object.assign(current.flags, flags);
  }
  if (facts) {
    Object.assign(current.facts, facts);
  }
}

// Helper: write to current span + context
export function putOnSpan(kind: 'flag' | 'fact', key: string, value: any) {
  const span = trace.getActiveSpan();
  if (span?.isRecording()) {
    span.setAttributes({ [`${kind}.${key}`]: value });
  }
}

export function withEvalContext<T>(
  initialFlags: Record<string, any> = {},
  initialFacts: Record<string, any> = {},
  fn: () => T,
): T {
  return EVAL_CONTEXT.run({ flags: { ...initialFlags }, facts: { ...initialFacts } }, fn);
}
