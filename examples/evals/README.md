# Eval examples

This project demonstrates how to use Axiom Evals with a Next.js application.

## Structure

- `src/lib/capabilities/echo`: A minimal "echo" evaluation example.
- `src/lib/capabilities/classify-ticket`: A comprehensive "kitchen sink" example simulating a customer service bot, integrated with the Next.js app.

## Running Evals

To run all evals:
```bash
pnpm eval
```

To run the minimal example:
```bash
npx axiom eval src/lib/capabilities/echo/evaluations/echo.eval.ts
```

To run the kitchen sink example:
```bash
npx axiom eval src/lib/capabilities/classify-ticket/evaluations/ticket-classification.eval.ts
```

## Experiments

You can override flags from the CLI:
```bash
npx axiom eval src/lib/capabilities/classify-ticket/evaluations/ticket-classification.eval.ts --flag.ticketClassification.model=gpt-4o
```

Or using a config file:
```bash
npx axiom eval src/lib/capabilities/classify-ticket/evaluations/ticket-classification.eval.ts --flags-config=experiment-example.json
```
