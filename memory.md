# Trials Feature Implementation

## Status: Complete ✅

All phases (1-9) in spec.md are complete. All checks pass:
- `pnpm build` ✅
- `pnpm test` ✅  
- `pnpm format:check` ✅
- `pnpm lint` ✅
- `pnpm typecheck` ✅

## Summary

The trials feature enables running evaluations multiple times with different aggregation strategies per scorer. See [trials-api-options.md](docs/design/trials-api-options.md) for the full design.

### Key Files
- `packages/ai/src/evals/aggregations.ts` - Mean, Median, PassAtK, PassHatK + aliases
- `packages/ai/src/evals/scorer.factory.ts` - Scorer with aggregation option
- `packages/ai/src/evals/eval.ts` - Trial loop implementation
- `packages/ai/src/evals/builder.ts` - `.withTrials()` method
- `examples/evals-minimal/src/example.eval.ts` - Usage example

### Usage

```typescript
import { Eval, Scorer, Mean, PassAtK } from '@axiomhq/ai/evals';

Eval('my-eval', {
  trials: 3,
  data: [...],
  task: async ({ input }) => { ... },
  scorers: [
    Scorer('accuracy', fn, { aggregation: Mean() }),
    Scorer('tool-used', fn, { aggregation: PassAtK({ threshold: 0.8 }) }),
  ]
});
```
