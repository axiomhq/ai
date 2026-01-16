export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = await import('@opentelemetry/resources');
    const { BatchSpanProcessor, NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');
    const { ATTR_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');
    const { trace } = await import('@opentelemetry/api');
    const { initAxiomAI, RedactionPolicy } = await import('axiom/ai');

    const tracer = trace.getTracer('ai-feedback-demo');

    const exporter = new OTLPTraceExporter({
      url: `${process.env.AXIOM_URL}/v1/traces`,
      headers: {
        Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
        'X-Axiom-Dataset': process.env.AXIOM_DATASET!,
      },
    });

    const provider = new NodeTracerProvider({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: 'ai-feedback-demo',
      }),
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });

    provider.register();

    initAxiomAI({ tracer, redactionPolicy: RedactionPolicy.AxiomDefault });
  }
}
