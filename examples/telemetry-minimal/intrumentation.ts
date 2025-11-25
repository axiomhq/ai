import 'dotenv/config';
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';

export function initializeTelemetry() {
  // Initialize telemetry
  const exporter = new OTLPTraceExporter({
    url: `${process.env['AXIOM_URL']}/v1/traces`,
    headers: {
      Authorization: `Bearer ${process.env['AXIOM_TOKEN']}`,
      'X-Axiom-Dataset': process.env['AXIOM_DATASET']!,
    },
  });

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'middleware-example',
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  provider.register();
  const tracer = trace.getTracer('middleware-example');

  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });
}
