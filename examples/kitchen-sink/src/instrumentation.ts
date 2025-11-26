export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupAppInstrumentation } = await import('./instrumentation.node');

    await setupAppInstrumentation({
      // In Next.js, environment variables are available when `instrumentation.ts` runs.
      // In other frameworks, you might need `dotenv` or similar.
      dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!,
      url: process.env.NEXT_PUBLIC_AXIOM_URL ?? 'https://api.axiom.co',
    });
  }
}
