# Plan: Bring AxiomWrappedLanguageModelV2 to Parity with V1

Based on Oracle analysis of both V1 and V2 implementations, here's the plan to achieve feature parity while respecting the inherent differences between AI SDK v1 and v2.

## Structural Differences (Do NOT Change)

These differences are inherent to AI SDK v1 vs v2 architecture and must remain:

- **Call options**: V1 uses `maxTokens`, V2 uses `maxOutputTokens`
- **Prompt model**: V1 uses `LanguageModelV1Prompt`, V2 uses `LanguageModelV2Content` array
- **Stream parts**: V1 emits delta types (`text-delta`, `tool-call-delta`), V2 emits complete items
- **Raw call exposure**: V1 exposes `rawCall`, V2 does not
- **Metadata types**: Different field names for usage/finish reason metadata

## Feature Gaps to Port from V1 to V2

### 1. Fix Prompt Enrichment with Tool Results
**Priority: High**

V1 properly enriches prompts with tool calls and results using `appendToolCalls()` and `extractToolResultsFromRawPrompt()`.

V2 only has synthetic tool results and test-specific heuristics.

**Action:**
- Remove hard-coded "complete conversational flow" branch in `setPostCallAttributesStatic()`
- Implement V2-compatible tool result extraction (since no `rawCall` available)
- Reuse `promptUtils.appendToolCalls()` for consistency

### 2. Standardize Completion Generation
**Priority: High**

V1 consistently uses `createSimpleCompletion()` for assistant text only (tool calls in prompt).

V2 has inconsistent paths and puts tool calls in completion.

**Action:**
- Remove test-specific branches
- Mirror V1 semantics: tool calls in prompt, completion for assistant text only
- Use `createSimpleCompletion()` or V2-equivalent

### 3. Add Time-to-First-Token to V1
**Priority: Medium**

V2 sets `gen_ai.response.time_to_first_token` attribute, V1 collects metric but doesn't set attribute.

**Action:**
- Add `span.setAttribute()` in V1's `StreamStats.flush()`

### 4. Decide on Tool Call Child Spans
**Priority: Low**

V2 has disabled child span code, V1 never had them.

**Action:**
- Either remove disabled code from V2 until ready, or implement in both versions
- Recommend: remove for now, implement together later

### 5. Standardize Context Handling
**Priority: Medium**

V1 uses helper "context" object for original prompt, V2 uses span private property.

**Action:**
- Standardize on V1's helper object approach (cleaner, testable)

### 6. Align Utility Functions and Imports
**Priority: Low**

**Action:**
- Fix import path inconsistencies (`../util/currentUnixTime` vs `src/util/currentUnixTime`)
- Reuse shared helpers from `promptUtils.ts` and `completionUtils.ts` where possible

### 7. Ensure Attribute Parity
**Priority: Medium**

**Action:**
- Verify V1's newly-added attributes are copied to V2
- Factor common attribute-setting code into shared helpers
- Ensure both wrappers emit identical OTEL attributes where concepts overlap

### 8. Achieve Test Suite Parity
**Priority: High**

**Action:**
- Audit existing V1 and V2 test suites
- Ensure every V1 test has a V2 equivalent (accounting for SDK differences)
- Remove V2-specific tests that have no V1 equivalent and aren't needed
- Add missing V2 tests for features that exist in V1

## Implementation Order

1. **Phase 0: Test Parity**
   - Audit and align test suites between V1 and V2
   - Ensure proper test coverage before making changes
   - It is expected that some tests will fail at this point

2. **Phase 1: Critical Fixes**
   - Remove test-specific branches from V2
   - Fix prompt enrichment with real tool results
   - Standardize completion generation

3. **Phase 2: Parity Features**
   - Remove time to first token from V2
   - Standardize context handling
   - Align attribute setting

4. **Phase 3: Maintenance**
   - Factor shared utilities
   - Fix import inconsistencies
   - Build automated parity tests

## Success Criteria

- V2 handles tool calls and results the same way as V1 (modulo SDK differences)
- Both versions emit equivalent OTEL attributes for the same scenarios
- No test-specific heuristics remain in production code
- Automated tests prevent future divergence between versions
