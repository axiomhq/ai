import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { Resource } from '@opentelemetry/resources';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI, RedactionPolicy } from 'axiom/ai';
import { tracer } from './tracer';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'nextjs-otel-example',
  }) as Resource,
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: `${process.env.AXIOM_URL}/v1/traces`,
      headers: {
        Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
        'X-Axiom-Dataset': process.env.AXIOM_DATASET!,
      },
    }),
  ),
});

sdk.start();

initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });
