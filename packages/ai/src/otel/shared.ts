import type { Tracer } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';

import type {
  GEN_AI_OPERATION_NAME_VALUE_CHAT,
  GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT,
  GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS,
  GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL,
  GEN_AI_OPERATION_NAME_VALUE_TEXT_COMPLETION,
} from './semconv/semconv_incubating';

import { hasActiveOtelInstrumentation } from './detection';
import { LocalTracer } from './localSpan';

// Configuration for debug logging
interface DebugConfig {
  enabled: boolean;
  logger?: (message: string, ...args: any[]) => void;
}

const debugConfig: DebugConfig = {
  enabled: process.env.AXIOM_AI_DEBUG === 'true',
  logger: console.debug,
};

function debugLog(message: string, ...args: any[]): void {
  if (debugConfig.enabled && debugConfig.logger) {
    debugConfig.logger(`[AxiomAI] ${message}`, ...args);
  }
}

// Axiom AI Resources singleton for configuration management
export class AxiomAIResources {
  private static instance: AxiomAIResources;
  private tracer: Tracer | undefined;
  private initialized = false;

  private constructor() {}

  static getInstance(): AxiomAIResources {
    if (!AxiomAIResources.instance) {
      AxiomAIResources.instance = new AxiomAIResources();
    }
    return AxiomAIResources.instance;
  }

  init(config: { tracer?: Tracer }): void {
    this.tracer = config.tracer;
    this.initialized = true;
  }

  getTracer(): Tracer | undefined {
    return this.tracer;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Gets tracer with three-mode detection logic:
   * - Mode 1: initAxiomAI was called with tracer - use provided tracer
   * - Mode 2: initAxiomAI was called without tracer - use fallback tracer
   * - Mode 3a: initAxiomAI not called + OTel active - throw error
   * - Mode 3b: initAxiomAI not called + no OTel - use local spans
   */
  getTracerWithModeDetection(): { tracer: Tracer | LocalTracer, mode: 'configured' | 'fallback' | 'local' } {
    if (this.initialized) {
      // Mode 1: initAxiomAI was called
      const tracer = this.getTracer();
      if (tracer) {
        debugLog('Using configured tracer (Mode 1)');
        return { tracer, mode: 'configured' };
      } else {
        debugLog('Using fallback tracer (Mode 2)');
        return { tracer: trace.getTracer('@axiomhq/ai'), mode: 'fallback' };
      }
    } else {
      // Mode 3: initAxiomAI was NOT called
      try {
        if (hasActiveOtelInstrumentation()) {
          debugLog('OpenTelemetry instrumentation detected but initAxiomAI was not called - throwing error');
          throw new Error(
            'OpenTelemetry instrumentation detected but initAxiomAI was not called. ' +
            'Please call initAxiomAI(config) before using AI SDK wrappers.\n\n' +
            'Quick fix:\n' +
            '  import { initAxiomAI } from \'@axiomhq/ai\';\n' +
            '  initAxiomAI(); // Call this before using AI SDK wrappers\n\n' +
            'For more information:\n' +
            '  - Documentation: https://github.com/axiomhq/ai\n' +
            '  - Configuration guide: https://github.com/axiomhq/ai#configuration\n' +
            '  - OpenTelemetry setup: https://github.com/axiomhq/ai#opentelemetry-integration'
          );
        } else {
          debugLog('No OpenTelemetry instrumentation detected - using local spans (Mode 3b)');
          return { tracer: new LocalTracer(), mode: 'local' };
        }
      } catch (error) {
        // If detection itself fails, fall back to local mode
        if (error instanceof Error && error.message.includes('OpenTelemetry instrumentation detected')) {
          // Re-throw our own error
          throw error;
        } else {
          debugLog('Error during OTel detection - falling back to local spans');
          return { tracer: new LocalTracer(), mode: 'local' };
        }
      }
    }
  }
}

export function initAxiomAI(config?: { tracer?: Tracer }) {
  const resources = AxiomAIResources.getInstance();
  resources.init(config || {});
  
  if (config?.tracer) {
    debugLog('initAxiomAI called with custom tracer');
  } else {
    debugLog('initAxiomAI called with default configuration');
  }
}

/**
 * Configure debug logging for AxiomAI
 * @param enabled Whether to enable debug logging
 * @param logger Optional custom logger function
 */
export function setDebugLogging(enabled: boolean, logger?: (message: string, ...args: any[]) => void) {
  debugConfig.enabled = enabled;
  if (logger) {
    debugConfig.logger = logger;
  }
}

export type GenAIOperation =
  | typeof GEN_AI_OPERATION_NAME_VALUE_CHAT
  | typeof GEN_AI_OPERATION_NAME_VALUE_CREATE_AGENT
  | typeof GEN_AI_OPERATION_NAME_VALUE_EMBEDDINGS
  | typeof GEN_AI_OPERATION_NAME_VALUE_EXECUTE_TOOL
  | typeof GEN_AI_OPERATION_NAME_VALUE_TEXT_COMPLETION;

export function createGenAISpanName(operation: GenAIOperation, suffix?: string): string {
  return suffix ? `${operation} ${suffix}` : operation;
}
