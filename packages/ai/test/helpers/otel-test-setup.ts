import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace } from '@opentelemetry/api';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';

interface OtelTestSetup {
  setup: () => void;
  reset: () => void;
  cleanup: () => Promise<void>;
  getSpans: () => ReadableSpan[];
}

export function createOtelTestSetup(): OtelTestSetup {
  let memoryExporter: InMemorySpanExporter;
  let tracerProvider: NodeTracerProvider;

  const setup = () => {
    memoryExporter = new InMemorySpanExporter();
    const spanProcessor = new SimpleSpanProcessor(memoryExporter);
    tracerProvider = new NodeTracerProvider({
      spanProcessors: [spanProcessor],
    });
    tracerProvider.register();

    // Initialize AxiomAI with the tracer to prevent "No tracer found" warnings
    const tracer = trace.getTracer('axiom-ai-test');
    initAxiomAI({ tracer });
  };

  const reset = () => {
    if (memoryExporter) {
      memoryExporter.reset();
    }
  };

  const cleanup = async () => {
    // Reset AxiomAI configuration before shutting down
    resetAxiomAI();

    if (tracerProvider) {
      await tracerProvider.shutdown();
    }
    if (memoryExporter) {
      await memoryExporter.shutdown();
    }
  };

  const getSpans = (): ReadableSpan[] => {
    if (!memoryExporter) {
      return [];
    }
    return memoryExporter.getFinishedSpans();
  };

  return {
    setup,
    reset,
    cleanup,
    getSpans,
  };
}
