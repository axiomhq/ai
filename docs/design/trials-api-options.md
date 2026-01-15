# Trials API Design Options

## Decision

**Option C (Hybrid)** with the following refinements:

- **Eval owns trials** - execution concern
- **Scorer owns aggregation** - interpretation concern
- **Raw scores are always stored** so UI can switch aggregation strategies without re-running
- **Naming**: `trials` (not "runs" or "attempts")
- **Default aggregation**: `mean`
- **Trials always emitted** - even when `trials: 1`, we emit a trial span for consistency

```typescript
import { Mean, AtLeastOneTrialPasses, AllTrialsPass } from '@axiomhq/ai/evals/aggregations'

Eval('my-eval', {
  trials: 3,
  scorers: [
    Scorer('correctness', fn, { aggregation: Mean() }),
    Scorer('tool-called', fn, { aggregation: AtLeastOneTrialPasses({ threshold: 0.8 }) }),
    Scorer('consistency', fn, { aggregation: AllTrialsPass({ threshold: 0.9 }) }),
  ]
})
```

### Aggregation Functions

Aggregators are functions that return a serializable config + an `aggregate` function:

```typescript
// @axiomhq/ai/evals/aggregations

export const PassAtK = (opts: { threshold: number }) => ({
  type: 'pass@k' as const,
  threshold: opts.threshold,
  aggregate: (scores: number[]) => scores.some(s => s >= opts.threshold) ? 1 : 0,
})

export const PassHatK = (opts: { threshold: number }) => ({
  type: 'pass^k' as const,
  threshold: opts.threshold,
  aggregate: (scores: number[]) => scores.every(s => s >= opts.threshold) ? 1 : 0,
})

// Friendly aliases
export const AtLeastOneTrialPasses = PassAtK
export const AllTrialsPass = PassHatK

export const Mean = () => ({
  type: 'mean' as const,
  aggregate: (scores: number[]) => scores.reduce((a, b) => a + b, 0) / scores.length,
})

export const Median = () => ({
  type: 'median' as const,
  aggregate: (scores: number[]) => {
    const sorted = [...scores].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  },
})
```

**Note**: User-friendly names (`AtLeastOneTrialPasses`, `AllTrialsPass`) are aliases. The span uses technical notation (`pass@k`, `pass^k`).

---

## Problem

LLM outputs are non-deterministic. To get reliable eval signals, users may need to run evaluations multiple times ("trials") and aggregate results using metrics like:

- **pass@k**: Did at least one of k trials pass?
- **pass^k**: Did all k trials pass?
- **mean**: Average score across trials
- **median**: Median score across trials

You can see more information in this article from Anthropic: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

We want to implement this premise of "trials" in our SDK and UI.

There are two questions:
1. **where should trials and aggregation be configured?**
2. **bikeshedding about syntax**

Below I will explore the options I see for question 1. I will not elaborate on question 2, but please consider it implicit that you are kindly invited to bikeshed any of the naming in this document, or of any other alternative you come up with.

---

## Option A: Scorer-Centric

```typescript
Scorer('correctness', fn, { agg: PassAtK({ trials: 5 }) })
```

The scorer declares both how many trials it needs and how to aggregate them. Then the eval runs as many trials as it needs to satisfy all of its scorers. If Scorer 1 needs 3 trials and Scorer 2 needs 5 trials, we run 5, and Scorer 1 only uses the first 3.

The downside as I see it is now the scorer is telling the Eval what to do. Additionally, having some scorers only use some trials will make looking at a trace a bit confusing. I run 5 trials, but the scorer only uses 3...

---

## Option B: Eval-Centric

```typescript
Eval('my-eval', { trials: 5, agg: PassAtK(), scorers: [...] })
```

The pro here is that the eval determines what it does, and the scorers just provide the metrics.

The downside is you might want different behavior on different scorers, and this now requires running a separate eval.

---

## Option C: Hybrid 

```typescript
Eval('my-eval', {
  trials: 5,
  scorers: [
    Scorer('llm-judge', fn, { agg: Mean() }),
    Scorer('tool-called', fn, { agg: PassAtK() }),
    Scorer('consistency', fn, { agg: PassHatK() }),
  ]
})
```

The eval owns trial count (execution). Each scorer owns its aggregation strategy (interpretation).

Con is it still has part of the downside of B: If you want to add a PassHatK(7), you need to either write a separate eval, or change the trials for all the existing scorers (which changes their difficulty!)

## Option D: Hybrid 2

```typescript
Eval('my-eval', {
  trials: 5,
  scorers: [
    Scorer('llm-judge', fn, { agg: Mean() }),
    Scorer('tool-called', fn, { agg: PassAtK(), trials: 3 }),
    Scorer('consistency', fn, { agg: PassHatK() }),
  ]
})
```

This is a combination of everything else - scorers can override trials. Pro is power and extensibility. Con is it's more confusing.

---

# Naming

All naming decisions resolved:

- ✅ Feature naming: `trials`
- ✅ Default aggregation: `mean`
- ✅ Pass threshold: `PassAtK({ threshold: 0.8 })`
- ✅ Aggregation naming: Both! User-friendly aliases (`AtLeastOneTrialPasses`, `AllTrialsPass`) for the API, technical notation (`pass@k`, `pass^k`) on spans
- ✅ Per-trial scores: Stored in `eval.case.scores[name].trials` array, aggregated value in `eval.case.scores[name].value`

# UI

The big UI questions here:
1. if we run 3 trials, which each end up with a different generation, what do the input/output columns look like?
2. for something like Pass@K, what do we put in the score column? I guess 

# Final question

Do you have any thoughts related to trials that are not covered at all by this document?

---

# Trace Shape

## Current Shape (No Trials)

```
eval {evalName}-{evalVersion}
├── case {index}: {caseInput}
│   ├── task
│   ├── scorer {scorerName}
│   ├── scorer {scorerName}
│   └── scorer {scorerName}
```

## Proposed Shape: Trials Inside Cases

```
eval {evalName}
├── case 0
│   ├── trial 0
│   │   ├── task
│   │   ├── scorer "correctness"    → eval.score.value: 0.8
│   │   └── scorer "tool-called"    → eval.score.value: 1.0
│   ├── trial 1
│   │   ├── task
│   │   ├── scorer "correctness"    → eval.score.value: 0.6
│   │   └── scorer "tool-called"    → eval.score.value: 1.0
│   └── trial 2
│       ├── task
│       └── scorer ...
│   (case span has aggregated scores)
```

### Why This Shape

1. Trials are conceptually repetitions *of a case*, not separate cases
2. Aggregated scores naturally belong on the case span
3. Works cleanly for all API options (A/B/C/D)—trace shape doesn't care where trials/agg are configured
4. Easy to query "show me all trials for case 3"

### Alternative Considered: Flat Trials

```
eval {evalName}
├── case 0, trial 0
│   ├── task
│   └── scorer ...
├── case 0, trial 1
│   ├── task
│   └── scorer ...
├── case 1, trial 0
│   ...
```

**Rejected because:**
- Harder to group by case visually
- Aggregation must happen at eval level instead of case level
- `eval.case.scores` attribute becomes unclear—where do aggregates live?

## New/Modified Span Attributes

**Trial Span** (`gen_ai.operation.name: "eval.trial"`):
| Attribute | Example |
|-----------|---------|
| `eval.trial.index` | `0, 1, 2...` |

**Case Span** (modified):
| Attribute | Example |
|-----------|---------|
| `eval.case.trials` | `5` |
| `eval.case.scores` | Enhanced to include aggregation info (see below) |

**Scorer Span** (modified):
| Attribute | Example |
|-----------|---------|
| `eval.score.aggregation` | `"pass@k"` / `"pass^k"` / `"mean"` / `"median"` |
| `eval.score.threshold` | `0.8` (for pass-based aggregations) |

### Enhanced `eval.case.scores` Format

```json
{
  "correctness": {
    "name": "correctness",
    "value": 0.7,
    "aggregation": "mean",
    "trials": [0.8, 0.6, 0.7, 0.8, 0.6],
    "metadata": {}
  },
  "tool-called": {
    "name": "tool-called", 
    "value": 1.0,
    "aggregation": "pass@k",
    "threshold": 0.8,
    "trials": [1.0, 0.0, 1.0, 1.0, 0.0],
    "metadata": {}
  }
}
```

## API Option Impact on Trace Attributes

The trace shape stays the same across all options—only the source of attribute values differs:

| Option | `eval.trials` | `scorer.trials` | `scorer.agg` |
|--------|---------------|-----------------|--------------|
| A (Scorer-centric) | computed max | per-scorer | per-scorer |
| B (Eval-centric) | explicit | — | single global |
| C (Hybrid) | explicit | — | per-scorer |
| D (Hybrid 2) | explicit | per-scorer override | per-scorer |

---

# App Compatibility (SDK + Console UI)

The console app has two main screens:
1. **Eval list** - shows all evals with summary stats
2. **Eval detail** - shows cases/scores for a single eval

Evals are represented by both a **database model** and an **OpenTelemetry trace model**.

## Current State

**Database Model** (`evaluationsTable`):
- Stores aggregate stats: `totalCases`, `successCases`, `erroredCases`
- `summary` JSON with `averages.scores` (just scores, no trial info)
- No concept of trials

**OTel Trace Model**:
- `eval` → `case` → `task` + `scorer` hierarchy
- `eval.case.scores` is `Record<string, { score: number }>` - single value per scorer
- No trial spans

## Changes Needed

| Layer | Change | Backward Compatible? |
|-------|--------|---------------------|
| **Database** | None! Use existing `config` JSON for trial settings | ✅ No migration needed |
| **Trace Parsing** | Detect trial spans by looking for `eval.trial.index` attribute | ✅ Yes - old traces just won't have them |
| **Trace Parsing** | `parseCaseScores()` needs to handle enhanced format with `trials[]` array | ✅ Yes - check if `trials` exists |
| **UI - Eval List** | No change needed - still shows aggregate scores from `summary` | ✅ Already aggregated |
| **UI - Eval Detail** | Add trial grouping under cases when `eval.case.trials` > 1 | ✅ Falls back to current behavior |
| **UI - Scores Column** | Show aggregated value with optional hover to see per-trial scores | ✅ Single-trial = current behavior |

## Database Schema Changes

**No schema changes required.** The DB stores summaries; traces store detail.

| Data | DB Location | Trace Location |
|------|-------------|----------------|
| Trial count | `config.trials` (existing JSON column) | `eval.trials` attribute |
| Scorer aggregation config | `config.scorerAggregations` (existing JSON column) | `eval.score.aggregation` + `eval.score.threshold` |
| Per-trial scores | ❌ Not stored | `eval.case.scores[name].trials` |
| Aggregated score | `summary.averages.scores[name]` (number) | `eval.case.scores[name].value` |

```typescript
// Existing schema stays the same:
config: { trials: 3, scorerAggregations: { 'tool-use': { type: 'pass@k', threshold: 0.8 } } }
summary.averages.scores: { 'tool-use': 0.8 }  // final aggregated value only
```

This works because:
- **Eval list view**: Only needs aggregate scores → existing `Record<string, number>` is sufficient
- **Eval detail view**: Reads from traces anyway → has full trial data with per-trial breakdown

## Trace Schema Changes

```typescript
// Extend TraceSpanAttributesSchema to recognize trial spans
eval: {
  trials: z.number().optional(),              // NEW - on eval span
  trial: { index: z.number().optional() },    // NEW - on trial span
  case: {
    trials: z.number().optional(),            // NEW
    scores: z.record(z.string(), z.object({
      value: z.number(),
      aggregation: z.string().optional(),     // NEW
      threshold: z.number().optional(),       // NEW
      trials: z.array(z.number()).optional()  // NEW
    }))
  },
  score: {
    aggregation: z.string().optional(),       // NEW
    threshold: z.number().optional(),         // NEW
  }
}
```

## Key Function Changes

### `parseCaseScores()`

```typescript
// Current: returns { scorerName: 0.8 }
// New: returns { scorerName: { value: 0.8, aggregation?: 'mean', threshold?: 0.8, trials?: [0.7, 0.9] } }
// Backward compat: if no trials[], normalize to { value }
```

### `groupSpansByCase()`

```typescript
// Current: case → [task, scorer, scorer]
// New: case → [trial, trial] where trial → [task, scorer, scorer]
// Always emits trial spans, even when trials=1
```

### Scorer function signature

```typescript
// Trial index is passed to scorer
fn({ input, output, expected, trialIndex })
```

## Detection Logic

```typescript
const hasMultipleTrials = (caseSpan: TraceSpan): boolean => {
  const trials = getCustomOrRegularNumber(caseSpan.attributes, 'eval.case.trials');
  return typeof trials === 'number' && trials > 1;
};
```

- Old evals (no trial spans) → render current single-row-per-case view
- New evals with `trials: 1` → single trial span, but same UI as before
- New evals with `trials > 1` → render expandable trial rows under each case

---

# Implementation Notes

## Implementation Plan

### SDK (`@axiomhq/ai`)

1. Add `trials` option to `Eval()`
2. Add `aggregation` option to `Scorer()`
3. Create `@axiomhq/ai/evals/aggregations` with `Mean`, `Median`, `PassAtK`, `PassHatK` + aliases
4. Update trace emission to include trial spans and new attributes
5. Pass `trialIndex` to scorer function
6. Store `trials` and `scorerAggregations` in `config` JSON when upserting eval

### App (Console UI)

1. **Extend trace schema** for `eval.trial.index`, `eval.case.trials`, `eval.score.aggregation`, `eval.score.threshold`
2. **Update `parseCaseScores()`** to return enriched format from traces (backward-compatible)
3. **Add detection logic** for multiple trials in case spans
4. **UI**: Show trial count badge on cases, expandable trial rows when `trials > 1`

No database schema changes required — existing `config` JSON column stores trial configuration.

---

# Open Questions

1. **UI: How to display multiple outputs?**
   - 3 trials = 3 different task outputs. What shows in the "Output" column?
   - Options: first trial only, expandable list, "3 outputs" badge with hover/click to expand

2. **UI: Aggregation switcher** (future)
   - Since raw scores are stored, UI could let users switch aggregation without re-running
   - Not in scope for initial implementation