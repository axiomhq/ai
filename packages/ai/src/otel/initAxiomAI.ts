import type { Tracer } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';
import packageJson from '../../package.json';
import { AXIOM_AI_REDACTION_KEY, type AxiomAIRedactionPolicy } from './utils/redaction';

// Global key to store tracer scope information across all execution contexts
const AXIOM_AI_SCOPE_KEY = Symbol.for('__axiom_ai_scope__');

interface TracerScope {
  name: string;
  version?: string;
}

/**
 * Extract scope information from a tracer, with fallback to package.json
 */
function extractTracerScope(tracer: Tracer): TracerScope {
  const tracerAny = tracer as any;

  // Guard access to private fields with optional chaining
  // Note: These are internal OTEL fields that may change in future versions
  // _instrumentationScope is modern, instrumentationLibrary is legacy (<1.16)
  const name =
    tracerAny._instrumentationScope?.name ||
    tracerAny.instrumentationLibrary?.name ||
    packageJson.name;

  const version =
    tracerAny._instrumentationScope?.version ||
    tracerAny.instrumentationLibrary?.version ||
    packageJson.version;

  return { name, version };
}

/**
 * Register this in your `instrumentation.ts` to set up axiom.
 * This function stores the tracer's scope information globally to enable Context Propagation
 * and Instrumentation Scope. The tracer will be available across all execution contexts including Next.js.
 *
 * This function is idempotent - calling it multiple times with the same scope has no additional cost.
 *
 * @param config
 * @param config.tracer - The tracer that you are using in your application.
 * @param config.redactionPolicy - Optional redaction policy to control what data is captured in spans.
 */
export function initAxiomAI(config: { tracer: Tracer; redactionPolicy?: AxiomAIRedactionPolicy }) {
  const newScope = extractTracerScope(config.tracer);
  const existingScope = (globalThis as any)[AXIOM_AI_SCOPE_KEY] as TracerScope | undefined;

  // Check if already initialized with same scope (idempotent behavior)
  if (
    existingScope &&
    existingScope.name === newScope.name &&
    existingScope.version === newScope.version
  ) {
    return;
  }

  // Warn about double initialization with different scopes
  if (existingScope) {
    console.warn(
      '[AxiomAI] initAxiomAI() called multiple times with different scopes. ' +
        `Previous: ${existingScope.name}@${existingScope.version}, ` +
        `New: ${newScope.name}@${newScope.version}`,
    );
  }

  // Store scope information globally (works across Next.js contexts)
  (globalThis as any)[AXIOM_AI_SCOPE_KEY] = newScope;

  // Store redaction policy globally if provided
  if (config.redactionPolicy) {
    (globalThis as any)[AXIOM_AI_REDACTION_KEY] = config.redactionPolicy;
  }
}

/**
 * Get a tracer using the globally stored scope information
 * Fall back to package.json defaults if not set
 */
export function getGlobalTracer(): Tracer {
  // Get stored scope information or fall back to package defaults
  const scope = (globalThis as any)[AXIOM_AI_SCOPE_KEY] as TracerScope | undefined;

  // Warn if initAxiomAI was never called
  if (!scope) {
    const isDebug = process.env.AXIOM_DEBUG === 'true';
    if (!isDebug) {
      console.warn(
        '[AxiomAI] AXIOM_AI_SCOPE_KEY is undefined. This probably means that ' +
          'initAxiomAI() was never called. ' +
          'Make sure to call initAxiomAI({ tracer }) in your instrumentation setup.',
      );
    }
  }

  let { name, version } = scope || { name: packageJson.name, version: packageJson.version };

  if (!name || !version) {
    name = packageJson.name;
    version = packageJson.version;
    if (!name || !version) {
      name = 'axiom';
      version = 'unknown';
    }
  }

  // Use OpenTelemetry's standard global provider mechanism
  return trace.getTracer(name, version);
}

/**
 * Reset AxiomAI configuration (useful for testing)
 */
export function resetAxiomAI() {
  (globalThis as any)[AXIOM_AI_SCOPE_KEY] = undefined;
  (globalThis as any)[AXIOM_AI_REDACTION_KEY] = undefined;
}
