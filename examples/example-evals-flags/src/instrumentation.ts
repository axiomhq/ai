export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupAppInstrumentation } = await import('./instrumentation.node');
    await setupAppInstrumentation({
      url: process.env.AXIOM_URL,
      token: process.env.AXIOM_TOKEN,
      dataset: process.env.AXIOM_DATASET,
    });
  }
}
