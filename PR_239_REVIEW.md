# PR #239 Review - Eval UI Bug Fixes

**Status:** ✅ **APPROVE WITH MINOR CONCERNS**

**Reviewer:** Cursor AI Agent  
**Date:** 2026-02-13  
**Tests:** ✅ All 655 tests passing

---

## Executive Summary

This PR addresses three legitimate bugs preventing eval results from appearing in the Axiom UI. The fixes are technically sound and all tests pass. However, there are architectural concerns about the two-phase PATCH workaround that merit discussion.

---

## Changes Overview

### 1. ✅ Dataset CLI Override Fix (APPROVED)

**File:** `packages/ai/src/cli/commands/eval.command.ts`

**Change:** Removed `process.env.AXIOM_DATASET` as Commander option default

```diff
- .option('-d, --dataset <DATASET>', 'axiom dataset name', process.env.AXIOM_DATASET)
+ .option('-d, --dataset <DATASET>', 'axiom dataset name')
```

**Analysis:**
- **Root cause correctly identified:** `createPartialDefaults()` already reads `process.env.AXIOM_DATASET` (config/index.ts:283)
- **Problem:** Commander default caused double-application, preventing config file from being respected
- **Fix is correct:** Config loader uses `defu` to merge env vars → config file → CLI options in proper precedence

**Verification:**
```typescript
// Config precedence (correct order):
1. createPartialDefaults() reads AXIOM_DATASET env var
2. loadConfig() merges with axiom.config.ts (config file wins via defu)
3. CLI options override ONLY if explicitly provided
```

**Verdict:** ✅ Clean fix, no side effects

---

### 2. ⚠️ Two-Phase PATCH Workaround (APPROVED WITH CONCERNS)

**File:** `packages/ai/src/evals/eval.ts`

**Change:** Split evaluation update into two PATCH calls (before/after flush)

**Before:**
```typescript
await flush();
await updateEvaluation({
  id: evalId,
  status: 'completed',
  totalCases, successCases, erroredCases, durationMs
});
```

**After:**
```typescript
// Phase 1: Update status BEFORE flush
await updateEvaluation({
  id: patchId,
  status: 'completed',
  totalCases, successCases, erroredCases, durationMs, scorerAvgs
});

await flush();

// Phase 2: Update scores AFTER flush
await updateEvaluation({
  id: patchId,
  summary: { averages: { scores: namedScores } }
});
```

**Analysis:**

**Problems this solves:**
- Backend locks eval records after span ingestion
- PATCH after flush returns `200 OK` with `{"error":{"code":"BAD_REQUEST"}}` in body
- All evals stuck at `status: "running"`

**Concerns:**
1. **Architectural smell:** Workaround for backend behavior, not a fix
2. **Race condition potential:** If flush is slow, UI may show incorrect intermediate state
3. **Duplicate data:** `scorerAvgs` sent in phase 1, `namedScores` sent in phase 2 (same data, different format)
4. **Error handling:** Phase 2 failure is caught but silent (only console.error)

**Questions for team:**
- Is the backend locking intentional? Should the SDK work around it?
- Could backend support a "finalize" endpoint instead of PATCH-after-lock?
- What happens if phase 2 fails? Do we leave incomplete data in UI?

**Verdict:** ✅ **Approve** - Pragmatic fix for production issue, but should be tracked as tech debt

---

### 3. ✅ Named Scores for UI (APPROVED)

**File:** `packages/ai/src/evals/eval.ts`, `packages/ai/src/evals/eval.service.ts`

**Change:** Calculate and send named scorer averages

**Before:**
```typescript
scorerAvgs: [0.85, 0.90]  // Anonymous array
```

**After:**
```typescript
summary: {
  averages: {
    scores: { accuracy: 0.85, relevance: 0.90 }  // Named object
  }
}
```

**Analysis:**
- **Correct calculation:** Aggregates scores across successful cases only
- **Proper type safety:** Added `summary.averages.scores` to `EvaluationApiPayloadBase`
- **Boolean handling:** Correctly converts boolean scores to 1/0 for averaging
- **Error filtering:** Skips scores with `metadata.error` (correct)

**Code quality:**
```typescript
// Well-structured aggregation
const scorerTotals: Record<string, { sum: number; count: number }> = {};
for (const t of suite.tasks) {
  if (t.meta.case?.status !== 'success') continue;
  for (const [scorerName, scoreData] of Object.entries(t.meta.case.scores)) {
    if (scoreData.metadata?.error) continue;
    const v = typeof scoreData.score === 'boolean' 
      ? (scoreData.score ? 1 : 0) 
      : (scoreData.score ?? 0);
    scorerTotals[scorerName].sum += v;
    scorerTotals[scorerName].count += 1;
  }
}
```

**Verdict:** ✅ Clean implementation, no issues

---

### 4. ✅ Trial Span Hierarchy Support (APPROVED)

**File:** `packages/ai/src/evals/eval.service.ts`

**Change:** Support both `eval → case → task/score` and `eval → case → trial → task/score` hierarchies

**Analysis:**
- **Backward compatible:** Falls back to case-level if no trial spans found
- **Correct logic:** Finds trial spans, then searches for task/score as children
- **Future-proof:** Supports SDK 0.42.0+ trial spans while maintaining compatibility

**Code:**
```typescript
// Find trial spans for this case (added in SDK 0.42.0)
const trialSpans = spans.filter(
  (span) => span.data.name.startsWith('trial') && 
           span.data.parent_span_id === caseSpan.data.span_id
);

// Look for tasks/scores under trial spans, falling back to case
const trialSpanIds = trialSpans.map((s) => s.data.span_id);
const parentIds = trialSpanIds.length > 0 ? trialSpanIds : [caseSpan.data.span_id];
```

**Verdict:** ✅ Solid defensive programming

---

### 5. ✅ Error Handling Improvements (APPROVED)

**File:** `packages/ai/src/evals/eval.service.ts`

**Changes:**
1. Better error messages with response body text
2. Detection of HTTP 200 with error in body
3. Try-catch around update calls in eval.ts
4. Error handling for `forceFlush()` in instrument.ts

**Analysis:**
- Addresses the root cause from user report (silent 200 OK with error body)
- Proper error propagation with context
- Non-fatal handling for flush errors (correct - don't break eval on telemetry failure)

**Verdict:** ✅ Defensive improvements

---

### 6. ✅ Test Mock Updates (APPROVED)

**File:** `packages/ai/test/helpers/eval-test-setup.ts`

**Change:** Updated mock baseline to include trial spans

**Analysis:**
- Matches new span hierarchy
- Maintains test coverage
- All 655 tests passing

**Verdict:** ✅ Proper test maintenance

---

## Additional Observations

### 1. Server-Assigned ID Handling

```typescript
serverEvalId = createEvalResponse?.data?.id;
// ...later...
const patchId = serverEvalId || evalId;
```

**Good:** Respects server-assigned ID for PATCH calls  
**Question:** When would `serverEvalId` be undefined? Is the fallback necessary?

### 2. Duplicate Score Formats

Both `scorerAvgs` (array) and `summary.averages.scores` (object) are sent. Is this intentional for backward compatibility?

---

## Recommendations

### Immediate Actions
1. ✅ **Merge PR** - Fixes critical production issue
2. 📝 **Document backend locking behavior** in eval.service.ts comments
3. 🧪 **Add integration test** for two-phase PATCH scenario

### Follow-up Issues
1. **Backend API improvement:** Consider adding a "finalize" endpoint that accepts full eval results (status + scores) atomically
2. **Error visibility:** Phase 2 PATCH failures are only logged to console - consider surfacing to UI
3. **Redundant data:** Clean up `scorerAvgs` vs `summary.averages.scores` once backend confirms format

### Code Quality
- Consider extracting score calculation to a helper function (it's ~30 lines in afterAll)
- Add JSDoc to explain why two-phase PATCH is necessary

---

## Test Results

```bash
✓ 655 tests passed
✓ pnpm build succeeded
✓ No TypeScript errors
✓ No lint errors
```

---

## Final Verdict

**APPROVE ✅**

This PR correctly identifies and fixes three real bugs:
1. ✅ Dataset override precedence 
2. ✅ PATCH lockout workaround (pragmatic, needs follow-up)
3. ✅ Named scores for UI

The code quality is good, tests pass, and the changes solve the immediate production issue. The two-phase PATCH approach is a reasonable workaround for backend behavior, though it should be revisited architecturally.

**Recommended next steps:**
1. Merge this PR
2. Create follow-up issue for backend API improvements
3. Monitor for phase 2 PATCH failures in production

---

## Context from Slack Thread

User reported evals stuck with empty results due to:
- `OTEL_EXPORTER_OTLP_ENDPOINT` env var conflict (separate issue)
- Dataset override from env vars (fixed by this PR)
- Missing scores in UI overview (fixed by this PR)
- Silent PATCH failures (fixed by this PR)

All reported issues are addressed by this PR.
