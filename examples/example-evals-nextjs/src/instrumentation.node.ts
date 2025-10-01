import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';
import { tracer } from './tracer';

const exporter = new OTLPTraceExporter({
  url: `${process.env.AXIOM_URL}/v1/traces`,
  headers: {
    Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
    'X-Axiom-Dataset': process.env.AXIOM_DATASET!,
  },
});

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'nextjs-otel-example',
  }),
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

provider.register();

initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });
