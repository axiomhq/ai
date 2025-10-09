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
    return { provider, tracer };
  }

  const dataset = options.dataset ?? process.env.AXIOM_DATASET;
  const url = options.url ?? process.env.AXIOM_URL ?? 'https://api.axiom.co';
  const token = options.token ?? process.env.AXIOM_TOKEN;

  if (!dataset) {
    throw new Error('AXIOM_DATASET is required to initialize tracing');
  }

  const exporter = new OTLPTraceExporter({
    url: `${url}/v1/traces`,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Axiom-Dataset': dataset,
    },
  });

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'nextjs-otel-example',
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();
  initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });

  return { provider };
};
