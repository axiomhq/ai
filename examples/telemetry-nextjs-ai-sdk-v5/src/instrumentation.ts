export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupTelemetry } = await import('./instrumentation.node');

    setupTelemetry({
      url: process.env.AXIOM_URL || 'https://api.axiom.co',
      token: process.env.AXIOM_TOKEN!,
      dataset: process.env.AXIOM_DATASET!,
      serviceName: 'nextjs-otel-example',
    });
  }
}
