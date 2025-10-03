import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, type Context, type SpanOptions } from '@opentelemetry/api';
import { initAxiomAI } from 'src/otel/initAxiomAI';

// Lazily initialized tracer provider and exporter
let provider: NodeTracerProvider | undefined;
let initialized = false;

// Create a shared tracer instance (no-op if no provider registered)
export const tracer = trace.getTracer('axiom', __SDK_VERSION__);

export function initInstrumentation(config: { enabled: boolean }): void {
  if (!config.enabled) {
    initialized = true; // Mark initialized to avoid later accidental enablement
    return;
  }

  const collectorOptions = {
    url: process.env.AXIOM_URL
      ? `${process.env.AXIOM_URL}/v1/traces`
      : 'https://api.axiom.co/v1/traces', // Axiom API endpoint for trace data
    headers: {
      Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
      'X-Axiom-Dataset': process.env.AXIOM_DATASET || '',
    },
    concurrencyLimit: 10,
  };

  const exporter = new OTLPTraceExporter(collectorOptions);

  const processor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  });

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      ['service.name']: 'axiom',
      ['service.version']: __SDK_VERSION__,
    }),
    spanProcessors: [processor],
  });

  provider.register();

  // Initialize Axiom AI SDK bindings (safe when provider is registered)
  initAxiomAI({ tracer });

  initialized = true;
}

export const flush = async () => {
  await provider?.forceFlush();
};

export const startSpan = (name: string, opts: SpanOptions, context?: Context) => {
  // need to re-init instrumentation in vitest worker processes
  if (!initialized) {
    initInstrumentation({ enabled: true });
  }
  return tracer.startSpan(name, opts, context);
};
