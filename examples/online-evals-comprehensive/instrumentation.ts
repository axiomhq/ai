import 'dotenv/config';
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';

export function setupTelemetry(config: {
  url: string;
  token: string;
  dataset: string;
  serviceName?: string;
}) {
  const exporter = new OTLPTraceExporter({
    url: `${config.url}/v1/traces`,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'X-Axiom-Dataset': config.dataset,
    },
  });

  const processor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  });

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName || 'online-evals-comprehensive',
    }),
    spanProcessors: [processor],
  });

  provider.register();
  const tracer = trace.getTracer(config.serviceName || 'online-evals-comprehensive');

  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });

  return provider;
}

let provider: NodeTracerProvider | undefined;

export function initializeTelemetry() {
  provider = setupTelemetry({
    url: process.env['AXIOM_URL'] || 'https://api.axiom.co',
    token: process.env['AXIOM_TOKEN']!,
    dataset: process.env['AXIOM_DATASET']!,
    serviceName: 'online-evals-comprehensive',
  });
}

export async function flushTelemetry() {
  if (provider) {
    await provider.forceFlush();
    await provider.shutdown();
  }
}
