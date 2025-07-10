# Axiom AI

Axiom AI SDK is a TypeScript toolkit designed to help you build an observability setup around your GenAI-powered apps based on the OpenTelemetry spec. 


## Installation

```bash
npm install @axiomhq/ai
```

## Usage

Before diving in, a good practice is to make sure your app is instrumented using the OpenTelemetry SDK and has Axiom as a destination. The [Next.js OTel Example](./examples/nextjs-otel-example) is a good starting point.

### Configure OpenTelemetry with Axiom

Through the [Axiom Console](https://app.axiom.co), create a new dataset and token with ingest permissions. Your OTLPTraceExporter should have the correct configuration similar to the following example: 

```ts
import { initAxiomAI } from '@axiomhq/ai';
import { tracer } from './tracer';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'nextjs-otel-example',
  }) as Resource,
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: `https://api.axiom.co/v1/traces`,
      headers: {
        Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
        'X-Axiom-Dataset': process.env.AXIOM_DATASET!,
      },
    }),
  ),
});

sdk.start();

// Initialize Axiom resources & config
initAxiomAI({ tracer });
```

### Instrument AI Models with Observability

Axiom AI SDK provides a simple API to wrap your AI models with observability instrumentation.

```ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { wrapAISDKModel } from '@axiomhq/ai';

const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const geminiFlash = wrapAISDKModel(geminiProvider('gemini-2.5-flash-preview-04-17'));

```


### Tracing AI Operations with withSpan

Axiom's `withSpan()` creates OpenTelemetry spans for AI model calls with workflow context. It propagates workflow and task metadata through your AI operations, allowing you to add custom attributes and trace the complete AI request lifecycle. The function integrates seamlessly with wrapped AI SDK models to provide comprehensive observability following OTel semantic conventions.


@/app/page.tsx (Next.js App Router)
```ts
import { generateText } from 'ai';
import { withSpan } from '@axiomhq/ai';

export default async function Page() {
  const userId = 123;
  const res = await withSpan({ workflow: 'help_user', task: 'get_capital' }, (span) => {
    // you have access to the span in this callback
    span.setAttribute('user_id', userId);

    return generateText({
      model: geminiFlash,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI that answers questions.',
        },
        {
          role: 'user',
          content: 'What is the capital of Spain?',
        },
      ],
    });
  });

  return <p>{res.text}</p>;
}
```

## Contributing

Contributions to Axiom AI SDK are welcome and highly appreciated! This project follows semantic commit conventions and maintains high code quality standards.

### Prerequisites

- Node.js 20.x, 22.x, or 24.x
- pnpm package manager
- knowledge of OpenTelemetry and TypeScript

### Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

4. Run tests to ensure everything works:
   ```bash
   pnpm test
   ```

### Making Changes

1. Create a feature branch from `main`
2. Make your changes following the existing code patterns
3. Ensure your code follows the project standards:
   ```bash
   pnpm format      # Format code
   pnpm lint        # Check linting
   pnpm typecheck   # Type checking
   pnpm test        # Run tests
   ```

4. Write tests for new features or bug fixes
5. Use semantic commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `test:` for tests
   - `refactor:` for code refactoring

### Pull Request Process

1. Push your changes to your fork
2. Create a pull request with a semantic title
3. Fill out the pull request description
4. Ensure all CI checks pass
5. Wait for review and address any feedback

## Authors

The SDK is created by [Axiom](https://axiom.co) team members.
