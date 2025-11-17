# Eval examples

This app provides an example for a [classify-ticket](./src/capabilities/classify-ticket/evaluations/ticket-classification.eval.ts) capability.

To run all evals:

- `pnpm eval`

To run one eval file:

- `npx axiom eval src/capabilities/classify-ticket/evaluations/ticket-classification.eval.ts`

To override flags from CLI:

- `npx axiom eval feature.eval.ts --flag.behavior.strategy=smart `

To override flags from JSON:

- `npx axiom eval feature.eval.ts --flags-config=experiment-example.json`
