# Trials Feature Implementation Status

## Completed

All core phases (1-9) are complete. See spec.md for full checklist.

Key completed items:
- Aggregation functions: Mean, Median, PassAtK, PassHatK + aliases
- Trials support in Eval() with configurable count
- Scorer aggregation options
- Trial spans in OTel output
- Builder API `.withTrials()`
- Exports from both `axiom/ai/evals` and `axiom/ai/evals/aggregations`
- Example in evals-minimal with trials demo

## Remaining Tasks

### Phase 4.3: runTask helper (optional)
- Add trialIndex parameter to runTask (not critical since trial span is parent)

### Phase 8.2-8.3: Integration Tests
- Need real eval execution tests to verify span hierarchy
- Requires mocking OTel exporter and running actual evals

## Usage Example

```typescript
import { Eval, Scorer, Mean, PassAtK } from 'axiom/ai/evals';

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
