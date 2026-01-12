# Handoff: LanguageModelV3 (AI SDK v6) Support Implementation

## Summary

This document provides context for continuing the implementation of LanguageModelV3 support for AI SDK v6.

## What Was Completed ✅

All core V3 support has been implemented:

1. **`src/otel/AxiomWrappedLanguageModelV3.ts`** - New wrapper class with `isLanguageModelV3()` helper
2. **`src/otel/streaming/aggregators.ts`** - Added `ToolCallAggregatorV3`, `TextAggregatorV3`, `StreamStatsV3`
3. **`src/otel/middleware.ts`** - Added `axiomAIMiddlewareV3()` and updated unified `axiomAIMiddleware()` to handle V3
4. **`src/otel/utils/normalized.ts`** - Added `normalizeV3ToolCalls()` and `promptV3ToOpenAI()`
5. **`src/util/promptUtils.ts`** - Added `extractToolResultsFromPromptV3()`
6. **`src/otel/utils/wrapperUtils.ts`** - Added `GenAiSpanContextV3`, `determineOutputTypeV3()`, updated `withSpanHandling()` for V3
7. **`src/otel/vercel.ts`** - Updated `wrapAISDKModel()` to support V3 models

## Tests Updated ✅

- `test/otel/middleware.test.ts` - Changed `v3` to `v99` in "unsupported version" tests
- `test/vercel/dual-version.test.ts` - Changed `v3` to `v99` in "unsupported version" tests

## Verification ✅

```bash
pnpm run typecheck  # ✅ Passes
pnpm run test       # ✅ All 577 tests pass
```

## What Remains (Optional) 📝

All V3 work has been completed, including tests.

## Key V3 Differences From V2

| Feature | V2 | V3 |
|---------|----|----|
| Token usage | `{ inputTokens: number, outputTokens: number }` | `{ inputTokens: { total, cacheRead, cacheWrite, noCache }, outputTokens: { total, text, reasoning } }` |
| Finish reason | `string` | `{ unified: string, raw?: string }` |
| Tool call args | `input: string \| object` | `input: string` (always string) |
| Stream parts | `tool-call`, `text-delta` | + `tool-input-start/delta/end`, `reasoning-start/delta/end` |
| Middleware type | From `@ai-sdk/providerv2` | From `@ai-sdk/providerv3` |

## TODOs Left in Code

The implementation includes TODO comments for future OTel semantic convention support:

1. **Cached tokens** (in `setPostCallAttributesV3`):
   - `result.usage?.inputTokens.cacheRead`
   - `result.usage?.inputTokens.cacheWrite`
   - `result.usage?.outputTokens.reasoning`

2. **Tool approval flow** (in `processToolCallsAndCreateSpansV3`):
   - `tool-approval-request` stream parts
   - `toolCall.dynamic` and `toolCall.providerExecuted` flags

3. **Raw finish reason** (in `setPostCallAttributesV3`):
   - `result.finishReason?.raw`

## Package Dependencies

Already configured in `package.json`:
```json
{
  "devDependencies": {
    "@ai-sdk/providerv3": "npm:@ai-sdk/provider@^3.0.2",
    "aiv6": "npm:ai@^6.0.6"
  }
}
```

## Files Modified

```
src/otel/AxiomWrappedLanguageModelV3.ts    (NEW)
src/otel/middleware.ts                      (MODIFIED - added V3 support)
src/otel/streaming/aggregators.ts           (MODIFIED - added V3 aggregators)
src/otel/utils/normalized.ts                (MODIFIED - added V3 conversions)
src/otel/utils/wrapperUtils.ts              (MODIFIED - added V3 context/helpers)
src/otel/vercel.ts                          (MODIFIED - added V3 to wrapAISDKModel)
src/util/promptUtils.ts                     (MODIFIED - added V3 extraction)
test/otel/middleware.test.ts                (MODIFIED - added V3 to middleware variants, V3-specific tests)
test/vercel/dual-version.test.ts            (MODIFIED - updated unsupported version tests)
test/vercel/mock-provider-v3/mock-provider-v3.ts (NEW - V3 mock provider for testing)
```

## Reference: REQUIREMENTS.md Decisions

Per user instructions:
1. **Token usage**: Only use `total` values for `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens`. Added TODOs for cached/reasoning tokens when OTel adds support.
2. **Finish reason**: Use `finishReason.unified` for `gen_ai.response.finish_reasons`
3. **Tool approval flow**: Skip tracking, added TODO
4. **Source/file tracking**: Skip tracking
5. **No custom attributes**: Only use existing OTel attributes
