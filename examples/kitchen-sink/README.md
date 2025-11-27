# Kitchen Sink Example

This example shows all components of the Axiom AI SDK working together: `axiom.config.ts`, instrumentation, app scope / flags, and evals.

## Getting Started

First, install the dependencies:

```bash
pnpm i
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Evals

To run the evaluations defined in the `src/lib/capabilities/support-agent/` directory:

```bash
pnpm eval
```

## Axiom Features Showcase

Here is a list of the `axiom` features demonstrated in this project and where you can find them:

### Tracing & Instrumentation
- **`wrapAISDKModel`**: Wraps the AI SDK model for tracing.
  - [src/lib/capabilities/support-agent/support-agent.ts](src/lib/capabilities/support-agent/support-agent.ts)
  - [src/lib/capabilities/support-agent/retrieve-from-knowledge-base.ts](src/lib/capabilities/support-agent/retrieve-from-knowledge-base.ts)
  - [src/lib/capabilities/support-agent/categorize-messages.ts](src/lib/capabilities/support-agent/categorize-messages.ts)
  - [src/lib/capabilities/support-agent/extract-ticket-info.ts](src/lib/capabilities/support-agent/extract-ticket-info.ts)
- **`wrapTools`**: Wraps tools for tracing.
  - [src/lib/capabilities/support-agent/support-agent.ts](src/lib/capabilities/support-agent/support-agent.ts)
- **`withSpan`**: Creates a custom span for manual tracing.
  - [src/lib/capabilities/support-agent/support-agent.ts](src/lib/capabilities/support-agent/support-agent.ts)
  - [src/lib/capabilities/support-agent/categorize-messages.ts](src/lib/capabilities/support-agent/categorize-messages.ts)
  - [src/lib/capabilities/support-agent/extract-ticket-info.ts](src/lib/capabilities/support-agent/extract-ticket-info.ts)

### Configuration & App Scope
- **`createAppScope`, `flag`, `pickFlags`**: Defines the application scope and configuration flags.
  - [src/lib/app-scope.ts](src/lib/app-scope.ts) defines the schema and flags.
  - Used throughout `src/lib/capabilities/support-agent/` to retrieve model names and configuration values.

### Evaluations
- **`Eval`, `Scorer`**: Defines evaluations and custom scoring logic.
  - [src/lib/capabilities/support-agent/categorize-messages.eval.ts](src/lib/capabilities/support-agent/categorize-messages.eval.ts)
  - [src/lib/capabilities/support-agent/extract-ticket-info.eval.ts](src/lib/capabilities/support-agent/extract-ticket-info.eval.ts)
  - [src/lib/capabilities/support-agent/retrieve-from-knowledge-base.eval.ts](src/lib/capabilities/support-agent/retrieve-from-knowledge-base.eval.ts)
  - [src/lib/capabilities/support-agent/support-agent-e2e-tool-use.eval.ts](src/lib/capabilities/support-agent/support-agent-e2e-tool-use.eval.ts)
