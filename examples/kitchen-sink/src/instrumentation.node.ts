import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';
import type { AxiomEvalInstrumentationHook } from 'axiom/ai/config';
import { trace } from '@opentelemetry/api';

export const tracer = trace.getTracer('axiom-ai-kitchen-sink-tracer');

let provider: NodeTracerProvider | undefined;

export const setupAppInstrumentation: AxiomEvalInstrumentationHook = async (options) => {
  if (provider) {
    return { provider };
  }

  const dataset = options.dataset;
  const url = options.url;
  const token = options.token;
  const orgId = options.orgId;

  if (!dataset) {
    throw new Error('Dataset is required to initialize tracing');
  }

  if (!options.url) {
    throw new Error('URL is required to initialize tracing');
  }

  if (!options.token) {
    throw new Error('Token is required to initialize tracing');
  }

  const exporter = new OTLPTraceExporter({
    url: `${url}/v1/traces`,
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Axiom-Dataset': dataset,
      ...(orgId ? { 'X-AXIOM-ORG-ID': orgId } : {}),
    },
  });

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'axiom-ai-kitchen-sink',
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();
  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });

  return { provider };
};
