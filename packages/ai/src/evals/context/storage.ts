import { trace } from '@opentelemetry/api';
import { createAsyncHook } from './manager';
import { type createAppScope } from '../../app-scope';
import type { ResolvedAxiomConfig } from '../../config/index';
import type { OutOfScopeFlagAccess } from '../eval.types';

// Global fallback for config scope when called outside of eval context (e.g., module import time)
const CONFIG_SCOPE_SYMBOL = Symbol.for('axiom.eval.configScope');
function getGlobalConfigScope(): ReturnType<typeof createAppScope> | undefined {
  return (globalThis as any)[CONFIG_SCOPE_SYMBOL];
}
function setGlobalConfigScope(scope: ReturnType<typeof createAppScope>) {
  (globalThis as any)[CONFIG_SCOPE_SYMBOL] = scope;
}

const CONSOLE_URL_SYMBOL = Symbol.for('axiom.eval.consoleUrl');
export function getConsoleUrl(): string | undefined {
  return (globalThis as any)[CONSOLE_URL_SYMBOL];
}
export function setConsoleUrl(consoleUrl?: string) {
  (globalThis as any)[CONSOLE_URL_SYMBOL] = consoleUrl;
}

// Global storage for axiom config (accessible from reporters)
const AXIOM_CONFIG_SYMBOL = Symbol.for('axiom.eval.config');
export function getAxiomConfig(): ResolvedAxiomConfig | undefined {
  return (globalThis as any)[AXIOM_CONFIG_SYMBOL];
}
export function setAxiomConfig(config: ResolvedAxiomConfig & { consoleUrl?: string }) {
  (globalThis as any)[AXIOM_CONFIG_SYMBOL] = config;
}

// Mini-context for in-process access
export const EVAL_CONTEXT = createAsyncHook<{
  flags: Record<string, any>;
  facts: Record<string, any>;
  configScope?: ReturnType<typeof createAppScope>;
  pickedFlags?: string[];
  outOfScopeFlags?: OutOfScopeFlagAccess[];
  parent?: EvalContextData<any, any>;
  overrides?: Record<string, any>;
  accessedFlagKeys?: string[];
}>('eval-context');

export interface EvalContextData<Flags = any, Facts = any> {
  flags: Partial<Flags>;
  facts: Partial<Facts>;
  configScope?: ReturnType<typeof createAppScope>;
  pickedFlags?: string[];
  outOfScopeFlags?: OutOfScopeFlagAccess[];
  parent?: EvalContextData<Flags, Facts>;
  overrides?: Record<string, any>;
  accessedFlagKeys?: string[];
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
    parent: ctx.parent,
    overrides: ctx.overrides,
    accessedFlagKeys: ctx.accessedFlagKeys,
  };
}

export function updateEvalContext(flags?: Record<string, any>, facts?: Record<string, any>) {
  const current = EVAL_CONTEXT.get();
  if (!current) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('updateEvalContext called outside of evaluation context');
    }
    return;
  }

  // Mutate the existing context (safe within the same async context)
  if (flags) {
    Object.assign(current.flags, flags);
    // Track accessed flag keys for runtime reporting
    if (!current.accessedFlagKeys) current.accessedFlagKeys = [];
    for (const key of Object.keys(flags)) {
      if (!current.accessedFlagKeys.includes(key)) {
        current.accessedFlagKeys.push(key);
      }
    }
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

    if (!trimmed || !trimmed.startsWith('at ')) {
      continue;
    }

    // filter out frames that users likely don't care about
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

  if (!current.outOfScopeFlags) {
    current.outOfScopeFlags = [];
  }

  const stack = new Error().stack || '';
  const stackTrace = parseStackTrace(stack);

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

/**
 * Resolve a flag value by walking the parent chain, checking overrides first
 */
export function resolveFlagValue<V>(ctx: EvalContextData<any, any>, key: string): V {
  // First check current context overrides
  if (ctx.overrides && key in ctx.overrides) {
    return ctx.overrides[key] as V;
  }

  // Then check current context flags
  if (key in ctx.flags) {
    return ctx.flags[key] as V;
  }

  // Walk up the parent chain
  if (ctx.parent) {
    return resolveFlagValue(ctx.parent, key);
  }

  // This should not happen
  // Return undefined as a fallback
  console.error(`[AxiomAI] Flag "${key}" not found in context, returning undefined`);
  return undefined as V;
}

/**
 * Create an overlay context that inherits from the current context
 * but isolates overrides to this specific execution context.
 */
function createOverlayContext(overrides: Record<string, any>): any {
  const current = EVAL_CONTEXT.get();
  if (!current) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('createOverlayContext called outside of evaluation context');
    }
    return {
      flags: { ...overrides },
      facts: {},
      pickedFlags: [],
      outOfScopeFlags: [],
      overrides: { ...overrides },
    };
  }

  // Create merged flags for backwards compatibility
  const mergedFlags = { ...current.flags, ...overrides };

  return {
    ...current,
    flags: mergedFlags,
    parent: current,
    overrides: { ...overrides },
  };
}

/**
 * Execute a function with flag overrides that are isolated to the execution context.
 * This creates an overlay context that inherits from the current context but isolates
 * the overrides to prevent them from leaking to sibling operations.
 */
export function withFlagOverrides<T>(overrides: Record<string, any>, fn: () => T): T {
  const overlayContext = createOverlayContext(overrides);

  // Write overridden flags to span for observability
  for (const [key, value] of Object.entries(overrides)) {
    putOnSpan('flag', key, value);
  }

  return EVAL_CONTEXT.run(overlayContext, fn);
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
    {
      flags: { ...initialFlags },
      facts: {},
      pickedFlags,
      outOfScopeFlags: [],
      accessedFlagKeys: [],
    },
    fn,
  );
}

/**
 * Set the config scope for the current evaluation context.
 * This makes the scope available for global flag/fact access.
 *
 * Also stores a global fallback so suite-end summary can access schema defaults
 * even if createAppScope ran outside the active async context.
 */
export function setConfigScope(scope: ReturnType<typeof createAppScope>) {
  const current = EVAL_CONTEXT.get();
  if (current) {
    current.configScope = scope;
  }
  // Always set global fallback
  setGlobalConfigScope(scope);
}

/**
 * Get the config scope from the current evaluation context.
 * Falls back to global scope when no context is active.
 */
export function getConfigScope(): ReturnType<typeof createAppScope> | undefined {
  const current = EVAL_CONTEXT.get();
  return current?.configScope ?? getGlobalConfigScope();
}

/**
 * Get the picked flags from the current evaluation context.
 * Returns undefined if no picked flags are set or if called outside eval context.
 */
export function getPickedFlags(): string[] | undefined {
  return EVAL_CONTEXT.get()?.pickedFlags;
}
