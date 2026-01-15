# Trials Feature Implementation Status

## Completed

### Phase 1: Core Types & Aggregation Functions ✅
- Created `packages/ai/src/evals/aggregations.ts` with Mean, Median, PassAtK, PassHatK
- User-friendly aliases: AtLeastOneTrialPasses, AllTrialsPass
- Tests in `packages/ai/test/evals/aggregations.test.ts`

### Phase 1.2: Extended Type Definitions ✅  
- Added `trials?: number` to EvalParams
- Added `ScorerOptions` type with aggregation field
- Updated `Scorer` type with aggregation property
- Added `trialIndex` to scorer function arguments
- Extended `ScoreWithName` with trials, aggregation, threshold

### Phase 2: Scorer Factory Updates ✅
- `createScorer` accepts optional `options?: ScorerOptions` parameter
- Aggregation config attached to scorer function object

### Phase 3: OTel Span Attributes ✅
- Added ATTR_EVAL_TRIALS, ATTR_EVAL_TRIAL_INDEX, ATTR_EVAL_CASE_TRIALS
- Added ATTR_EVAL_SCORE_AGGREGATION, ATTR_EVAL_SCORE_TRIALS
- Exported in Attr.Eval object

### Phase 4: Eval Execution Loop ✅
- Trial loop wraps task+scorer execution
- Always emits trial spans (even when trials=1)
- Collects per-trial scores and aggregates at case level
- Passes trialIndex to scorer functions
- Default aggregation is Mean()

### Phase 5: Builder API ✅
- Added `withTrials(count: number)` to EvalBuilder interface

### Phase 7: Exports ✅
- All aggregation functions exported from `@axiomhq/ai/evals`
- ScorerOptions type exported

## Remaining Tasks

### Phase 4.3: runTask helper (optional)
- Add trialIndex parameter to runTask (not critical since trial span is parent)

### Phase 6: Case Report Types
- Update EvalCaseReport scores field type (partially done through ScoreWithName)

### Phase 8.2: Integration Tests
- Need real eval execution tests to verify span hierarchy

### Phase 9: Documentation & Examples
- Update example.eval.ts with trials demo
- Add JSDoc examples

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
