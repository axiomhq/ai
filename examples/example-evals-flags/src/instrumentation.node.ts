import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';
import type { AxiomEvalInstrumentationHook } from 'axiom/ai/config';
import { tracer } from './tracer';

let provider: NodeTracerProvider | undefined;

export const setupAppInstrumentation: AxiomEvalInstrumentationHook = async (options) => {
  if (provider) {
    return { provider };
  }

  const dataset = options.dataset;
  const url = options.url;
  const token = options.token;

  if (!dataset) {
    throw new Error('Dataset is required to initialize tracing');
  }

  if (!url) {
    throw new Error('URL is required to initialize tracing');
  }

  if (!token) {
    throw new Error('Token is required to initialize tracing');
  }

  const exporter = new OTLPTraceExporter({
    url: `${url}/v1/traces`,
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Axiom-Dataset': dataset,
    },
  });

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'example-evals-flags',
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();
  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });

  return { provider };
};
