import 'dotenv/config';
import type { Tracer } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { initAxiomAI } from '@axiomhq/ai';

// Register instrumentations immediately when module loads
registerInstrumentations({
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});

export const setupTracing = (serviceName: string): Tracer => {
  const exporter = new OTLPTraceExporter({
    url: `${process.env['AXIOM_URL']}/v1/traces`,
    headers: {
      Authorization: `Bearer ${process.env['AXIOM_TOKEN']}`,
      'X-Axiom-Dataset': process.env['AXIOM_DATASET']!,
    },
  });
  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  // Set the tracer provider for the already-registered instrumentations
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [],
  });

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();

  const tracer = trace.getTracer(serviceName);

  // Initialize Axiom AI with the tracer
  initAxiomAI({ tracer });

  return tracer;
};
