import { trace } from '@opentelemetry/api';
import { createAsyncHook } from './manager';
import { type createAppScope } from '../../app-scope';

// Mini-context for in-process access
const EVAL_CONTEXT = createAsyncHook<{
  flags: Record<string, any>;
  facts: Record<string, any>;
  configScope?: ReturnType<typeof createAppScope>;
  pickedFlags?: string[];
  outOfScopeFlags?: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
}>('eval-context');

export interface EvalContextData<Flags = any, Facts = any> {
  flags: Partial<Flags>;
  facts: Partial<Facts>;
  configScope?: ReturnType<typeof createAppScope>;
  pickedFlags?: string[];
  outOfScopeFlags?: { flagPath: string; accessedAt: number; stackTrace: string[] }[];
}

export function getEvalContext<
  Flags extends Record<string, unknown> = any,
  Facts extends Record<string, unknown> = any,
>(): EvalContextData<Flags, Facts> {
  const ctx = EVAL_CONTEXT.get();
  if (!ctx) {
    // Return empty context if none exists
    return {
      flags: {} as Partial<Flags>,
      facts: {} as Partial<Facts>,
      pickedFlags: undefined,
      outOfScopeFlags: undefined,
    };
  }
  return {
    flags: ctx.flags as Partial<Flags>,
    facts: ctx.facts as Partial<Facts>,
    pickedFlags: ctx.pickedFlags,
    outOfScopeFlags: ctx.outOfScopeFlags,
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

/**
 * Parse stack trace to extract relevant frames, filtering out internal/framework frames
 */
function parseStackTrace(stack: string): string[] {
  const lines = stack.split('\n');
  const frames: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and the error message line
    if (!trimmed || !trimmed.startsWith('at ')) {
      continue;
    }

    // Filter out internal Node.js, framework, and this file's frames
    if (
      trimmed.includes('node_modules') ||
      trimmed.includes('node:internal') ||
      trimmed.includes('addOutOfScopeFlag') ||
      trimmed.includes('storage.ts') ||
      // Keep app-scope.ts frames that aren't the flag() function itself
      (trimmed.includes('app-scope.ts') &&
        (trimmed.includes('flag (') || trimmed.includes('flag2 (')))
    ) {
      continue;
    }

    // Extract the meaningful part of the frame
    frames.push(trimmed.replace('at ', ''));
  }

  return frames.slice(0, 5);
}

export function addOutOfScopeFlag(flagPath: string) {
  const current = EVAL_CONTEXT.get();
  if (!current) {
    console.warn('addOutOfScopeFlag called outside of evaluation context');
    return;
  }

  // Initialize outOfScopeFlags array if not exists
  if (!current.outOfScopeFlags) {
    current.outOfScopeFlags = [];
  }

  // Capture and parse stack trace
  const stack = new Error().stack || '';
  const stackTrace = parseStackTrace(stack);

  // Add the out-of-scope flag access
  current.outOfScopeFlags.push({
    flagPath,
    accessedAt: Date.now(),
    stackTrace,
  });
}

// Helper: write to current span + context
export function putOnSpan(kind: 'flag' | 'fact', key: string, value: any) {
  const span = trace.getActiveSpan();
  if (span?.isRecording()) {
    span.setAttributes({ [`${kind}.${key}`]: value });
  }
}

export function withEvalContext<T>(
  options: {
    initialFlags?: Record<string, any>;
    pickedFlags?: string[];
  } = {},
  fn: () => T,
): T {
  const { initialFlags = {}, pickedFlags = [] } = options;
  return EVAL_CONTEXT.run(
    { flags: { ...initialFlags }, facts: {}, pickedFlags, outOfScopeFlags: [] },
    fn,
  );
}

/**
 * Set the config scope for the current evaluation context.
 * This makes the scope available for global flag/fact access.
 */
export function setConfigScope(scope: ReturnType<typeof createAppScope>) {
  const current = EVAL_CONTEXT.get();
  if (!current) {
    console.warn('setConfigScope called outside of evaluation context');
    return;
  }
  current.configScope = scope;
}

/**
 * Get the config scope from the current evaluation context.
 * Returns undefined if no scope is set or if called outside eval context.
 */
export function getConfigScope(): ReturnType<typeof createAppScope> | undefined {
  const current = EVAL_CONTEXT.get();
  return current?.configScope;
}

/**
 * Get the picked flags from the current evaluation context.
 * Returns undefined if no picked flags are set or if called outside eval context.
 */
export function getPickedFlags(): string[] | undefined {
  return EVAL_CONTEXT.get()?.pickedFlags;
}
