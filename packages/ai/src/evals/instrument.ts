import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, type Context, type SpanOptions } from '@opentelemetry/api';
import type { AxiomConfig } from 'src/config';

// Create a shared tracer instance
const tracer = trace.getTracer('axiom-ai', __SDK_VERSION__);
let provider: NodeTracerProvider;

export const instrument = (config: AxiomConfig) => {
  const collectorOptions = {
    url: `${config.url}/v1/traces`, // Axiom API endpoint for trace data
    headers: {
      Authorization: `Bearer ${config.ai.evals.token}`,
      'X-Axiom-Dataset': config.ai.evals.dataset,
    },
    concurrencyLimit: 10, // an optional limit on pending requests
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
      ['service.name']: 'axiom-ai',
      ['service.version']: __SDK_VERSION__,
    }),
    spanProcessors: [processor],
  });

  provider.register();
};

// const collectorOptions = {
//   url: process.env.AXIOM_URL
//     ? `${process.env.AXIOM_URL}/v1/traces`
//     : 'https://api.axiom.co/v1/traces', // Axiom API endpoint for trace data
//   headers: {
//     Authorization: `Bearer ${process.env.AXIOM_TOKEN}`, // Replace API_TOKEN with your actual API token
//     'X-Axiom-Dataset': process.env.AXIOM_DATASET || '', // Replace DATASET_NAME with your dataset
//   },
//   concurrencyLimit: 10, // an optional limit on pending requests
// };

// const exporter = new OTLPTraceExporter(collectorOptions);

// const processor = new BatchSpanProcessor(exporter, {
//   maxQueueSize: 2048,
//   maxExportBatchSize: 512,
//   scheduledDelayMillis: 5000,
//   exportTimeoutMillis: 30000,
// });

// const provider = new NodeTracerProvider({
//   resource: resourceFromAttributes({
//     ['service.name']: 'axiom-ai',
//     ['service.version']: __SDK_VERSION__,
//   }),
//   spanProcessors: [processor],
// });

// provider.register();

export const flush = async () => {
  await provider?.forceFlush();
};

export const startSpan = (name: string, opts: SpanOptions, context?: Context) => {
  return tracer.startSpan(name, opts, context);
};
