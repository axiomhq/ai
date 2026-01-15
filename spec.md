Now I have a comprehensive understanding of the codebase. Let me create a thorough implementation plan:

# SDK Implementation Plan for Trials Feature

Based on the design document and codebase analysis, here's the implementation checklist:

---

## Phase 1: Core Types & Aggregation Functions

### 1.1 Create aggregation module
- [x] Create new file `packages/ai/src/evals/aggregations.ts`
- [x] Implement `Aggregation` type definition with `type`, `threshold?`, and `aggregate` function
- [x] Implement `Mean()` aggregation function
- [x] Implement `Median()` aggregation function
- [x] Implement `PassAtK({ threshold })` aggregation function (returns 1 if any score >= threshold)
- [x] Implement `PassHatK({ threshold })` aggregation function (returns 1 if all scores >= threshold)
- [x] Export user-friendly aliases: `AtLeastOneTrialPasses = PassAtK`, `AllTrialsPass = PassHatK`
- [x] Write tests for all aggregation functions in `packages/ai/test/evals/aggregations.test.ts`

### 1.2 Extend type definitions
- [x] Add `trials?: number` option to `EvalParams` in [eval.types.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals/eval.types.ts#L58-L78)
- [x] Add `aggregation?: Aggregation` option to scorer configuration in `createScorer`
- [x] Create `ScorerOptions` type with `aggregation` field
- [x] Update `Scorer` type to support options parameter
- [x] Add `trialIndex: number` to scorer function arguments type
- [x] Update `ScoreWithName` to support trial scores array: `trials?: number[]`
- [x] Add `aggregation?: string` and `threshold?: number` to score types
- [ ] Add `TrialResult` type for per-trial execution results
- [x] Write type tests in `packages/ai/test/evals/scorer.types.test.ts`

---

## Phase 2: Scorer Factory Updates

### 2.1 Extend `createScorer` to accept options
- [x] Update `createScorer` signature in [scorer.factory.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals/scorer.factory.ts#L21-L73) to accept optional third parameter `options?: ScorerOptions`
- [x] Attach `aggregation` config to scorer function object (similar to how `name` is attached)
- [ ] Default aggregation to `Mean()` when not specified
- [x] Ensure backward compatibility: existing scorers without options still work
- [x] Write tests for scorer with aggregation options in `packages/ai/test/evals/scorer.test.ts`

---

## Phase 3: Span Attributes for Trials

### 3.1 Add new OTel attributes
- [x] Add `ATTR_EVAL_TRIALS` (`eval.trials`) in [eval_proposal.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/otel/semconv/eval_proposal.ts)
- [x] Add `ATTR_EVAL_TRIAL_INDEX` (`eval.trial.index`)
- [x] Add `ATTR_EVAL_CASE_TRIALS` (`eval.case.trials`)
- [x] Add `ATTR_EVAL_SCORE_AGGREGATION` (`eval.score.aggregation`)
- [x] Add `ATTR_EVAL_SCORE_TRIALS` (`eval.score.trials`) for raw trial scores array
- [x] Export new attributes in [attributes.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/otel/semconv/attributes.ts) under `Attr.Eval`

---

## Phase 4: Eval Execution Loop with Trials

### 4.1 Implement trial loop in `registerEval`
- [x] Extract `trials` count from `EvalParams` (default to `1`)
- [x] Refactor case execution in [eval.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals/eval.ts#L410-L660) to loop over trials
- [x] Create trial span wrapper with `gen_ai.operation.name: "eval.trial"` and `eval.trial.index`
- [x] Always emit trial spans, even when `trials: 1` (per design doc)
- [x] Move task execution inside trial loop
- [x] Move scorer execution inside trial loop
- [x] Pass `trialIndex` to scorer function
- [x] Collect per-trial scores for each scorer
- [x] Set `eval.case.trials` attribute on case span

### 4.2 Implement score aggregation
- [x] After all trials complete, aggregate scores per scorer using configured aggregation
- [x] Store raw trial scores in `eval.case.scores[name].trials` array
- [x] Store aggregated value in `eval.case.scores[name].value`
- [x] Store aggregation type in `eval.case.scores[name].aggregation`
- [x] Store threshold (if applicable) in `eval.case.scores[name].threshold`
- [x] Set `eval.score.aggregation` and `eval.score.threshold` on scorer spans

### 4.3 Update `runTask` helper
- [ ] Add `trialIndex` parameter to `runTask` in [eval.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals/eval.ts#L710-L786)
- [ ] Set trial-specific attributes on task span

---

## Phase 5: Update Builder API

### 5.1 Extend `defineEval` builder
- [x] Add `withTrials(count: number)` method to `EvalBuilder` interface in [builder.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals/builder.ts)
- [x] Implement builder method in `EvalBuilderImpl`
- [x] Pass trials to underlying `Eval()` call
- [ ] Write tests for builder with trials

---

## Phase 6: Case Report Updates

### 6.1 Update `EvalCaseReport` type
- [ ] Update `scores` field type in [eval.types.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals/eval.types.ts#L173-L200) to include `trials`, `aggregation`, `threshold`
- [ ] Update `task.meta.case` assignment to include new score format
- [ ] Update `Case` type to include trial information

---

## Phase 7: Exports & Public API

### 7.1 Update public exports
- [ ] Export aggregation functions from `@axiomhq/ai/evals/aggregations` (new entry point)
- [x] Alternatively, export from `@axiomhq/ai/evals` main entry
- [x] Update [evals.ts](file:///Users/cje/dev/axiom/ai/packages/ai/src/evals.ts) exports
- [x] Export `ScorerOptions` type
- [ ] Update package.json exports map if adding new subpath

---

## Phase 8: Tests

### 8.1 Unit tests
- [x] Test `Mean` aggregation with various score arrays
- [x] Test `Median` aggregation with odd/even length arrays
- [x] Test `PassAtK` with threshold edge cases (exactly at threshold, below, above)
- [x] Test `PassHatK` with all pass, partial fail, all fail scenarios
- [x] Test scorer with aggregation option attached correctly
- [x] Test backward compatibility: scorer without options

### 8.2 Integration tests
- [ ] Test eval with `trials: 1` emits single trial span
- [ ] Test eval with `trials: 3` emits 3 trial spans per case
- [ ] Test scorer receives correct `trialIndex` on each call
- [ ] Test aggregated scores appear correctly on case span
- [ ] Test raw trial scores stored in `trials` array
- [ ] Test different aggregations on different scorers in same eval
- [ ] Test span hierarchy: eval → case → trial → task + scorers
- [ ] Test trace attributes include new fields

### 8.3 End-to-end test
- [ ] Create example eval with trials in `examples/evals-minimal/`
- [ ] Verify trace shape matches design doc

---

## Phase 9: Documentation & Examples

### 9.1 Update examples
- [ ] Update [example.eval.ts](file:///Users/cje/dev/axiom/ai/packages/ai/examples/evals-minimal/src/example.eval.ts) to demonstrate trials
- [ ] Add example with multiple scorers using different aggregations

### 9.2 JSDoc comments
- [ ] Document `trials` option on `EvalParams`
- [ ] Document aggregation option on `Scorer`
- [ ] Document each aggregation function with examples

---

## Implementation Order

Recommended sequence:
1. Phase 1 (aggregations) - standalone, no dependencies
2. Phase 3 (span attributes) - enables Phase 4
3. Phase 2 (scorer factory) - needs Phase 1
4. Phase 6 (case report types) - needs Phase 1
5. Phase 4 (eval execution) - core implementation, needs 1-3
6. Phase 5 (builder API) - depends on Phase 4
7. Phase 7 (exports) - after all code complete
8. Phase 8 (tests) - parallel with implementation
9. Phase 9 (docs) - after tests pass