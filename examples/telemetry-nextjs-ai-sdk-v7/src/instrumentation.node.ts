import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ConsoleSpanExporter, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OpenTelemetry } from '@ai-sdk/otel';
import { registerTelemetry } from 'ai';
import { tracer } from './tracer';

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
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName || 'nextjs-otel-example',
    }),
    spanProcessors: [
      new SimpleSpanProcessor(exporter),
      ...(process.env.AI_SDK_CONSOLE_SPANS === '1'
        ? [new SimpleSpanProcessor(new ConsoleSpanExporter())]
        : []),
    ],
  });

  provider.register();

  registerTelemetry(
    new OpenTelemetry({
      tracer,
      providerMetadata: true,
      runtimeContext: true,
      toolChoice: true,
      usage: true,
    }),
  );

  return provider;
}
