import 'dotenv/config';
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
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

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: config.serviceName || 'telemetry-minimal',
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  provider.register();
  const tracer = trace.getTracer(config.serviceName || 'telemetry-minimal');

  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });

  return provider;
}

export function initializeTelemetry() {
  // Initialize telemetry
  setupTelemetry({
    url: process.env['AXIOM_URL'] || 'https://api.axiom.co',
    token: process.env['AXIOM_TOKEN']!,
    dataset: process.env['AXIOM_DATASET']!,
    serviceName: 'middleware-example',
  });
}
