import 'dotenv/config';
import type { Tracer } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';

registerInstrumentations({
  instrumentations: [new HttpInstrumentation()],
});

export const setupTracing = (config: {
  url: string;
  token: string;
  dataset: string;
  serviceName: string;
}): Tracer => {
  const exporter = new OTLPTraceExporter({
    url: `${config.url}/v1/traces`,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'X-Axiom-Dataset': config.dataset,
    },
  });
  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [],
  });

  provider.register();

  const tracer = trace.getTracer(config.serviceName);

  // Initialize Axiom AI with the tracer
  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });

  return tracer;
};
