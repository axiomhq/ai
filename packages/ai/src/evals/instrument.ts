import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, type Context, type SpanOptions } from '@opentelemetry/api';
import { initAxiomAI } from '../../src/otel/initAxiomAI';
import type { AxiomConfig } from '../config';
import { resolveAxiomConnection } from '../config/resolver';

// Lazily initialized tracer provider and exporter
let provider: NodeTracerProvider | undefined;
let initialized = false;
let globalConfig: AxiomConfig | undefined;

// Create a shared tracer instance (no-op if no provider registered)
export const tracer = trace.getTracer('axiom', __SDK_VERSION__);

export function initInstrumentation(config: { enabled: boolean; config?: AxiomConfig }): void {
  // Store config globally for use in startSpan
  globalConfig = config.config;

  if (!config.enabled) {
    initialized = true; // Mark initialized to avoid later accidental enablement
    return;
  }

  // Resolve Axiom connection settings from config and env vars
  const connection = resolveAxiomConnection(config.config);

  const collectorOptions = {
    url: `${connection.url}/v1/traces`,
    headers: {
      Authorization: `Bearer ${connection.token}`,
      'X-Axiom-Dataset': connection.dataset,
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
    initInstrumentation({ enabled: true, config: globalConfig });
  }
  return tracer.startSpan(name, opts, context);
};
