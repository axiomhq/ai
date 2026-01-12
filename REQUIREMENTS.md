# AI SDK v6 Telemetry Support Requirements

This document tracks the new telemetry features needed to support AI SDK v6.

## Background

- AI SDK v6 introduces Language Model Specification v3 (`specificationVersion: 'v3'`)
- Current support: v4 (LanguageModelV1) and v5 (LanguageModelV2)
- Release notes: https://vercel.com/blog/ai-sdk-6
- Migration guide: https://v6.ai-sdk.dev/docs/migration-guides/migration-guide-6-0

## OpenTelemetry Semantic Conventions Reference

**Upgrade to: `@opentelemetry/semantic-conventions@1.38.0`** (from 1.37.0)

### New in 1.38.0 (vs 1.37.0)

| Attribute | Description |
|-----------|-------------|
| `gen_ai.tool.call.arguments` | ✅ NEW - Tool call arguments (JSON) |
| `gen_ai.tool.call.result` | ✅ NEW - Tool call result (JSON) |
| `gen_ai.tool.definitions` | ✅ NEW - Array of tool definitions |
| `gen_ai.evaluation.name` | ✅ NEW - Evaluation metric name |
| `gen_ai.evaluation.score.value` | ✅ NEW - Evaluation score |
| `gen_ai.evaluation.score.label` | ✅ NEW - Human-readable score label |
| `gen_ai.evaluation.explanation` | ✅ NEW - Explanation for score |
| `gen_ai.embeddings.dimension.count` | ✅ NEW - Embedding dimensions |

### Available GenAI Attributes (from OTel 1.38.0)

| Attribute | Status | Notes |
|-----------|--------|-------|
| `gen_ai.agent.name` | ✅ OTel | Human-readable agent name |
| `gen_ai.agent.id` | ✅ OTel | Unique agent identifier |
| `gen_ai.agent.description` | ✅ OTel | Agent description |
| `gen_ai.conversation.id` | ✅ OTel | Session/thread ID |
| `gen_ai.data_source.id` | ✅ OTel | For RAG/data sources |
| `gen_ai.input.messages` | ✅ OTel | Input chat history |
| `gen_ai.output.messages` | ✅ OTel | Output messages |
| `gen_ai.output.type` | ✅ OTel | text, json, image, speech |
| `gen_ai.system_instructions` | ✅ OTel | System prompt |
| `gen_ai.operation.name` | ✅ OTel | chat, embeddings, execute_tool, invoke_agent, create_agent |
| `gen_ai.provider.name` | ✅ OTel | Provider identifier |
| `gen_ai.request.*` | ✅ OTel | model, temperature, max_tokens, top_p, etc. |
| `gen_ai.response.*` | ✅ OTel | id, model, finish_reasons |
| `gen_ai.tool.call.id` | ✅ OTel | Tool call identifier |
| `gen_ai.tool.call.arguments` | ✅ OTel 1.38+ | Tool call arguments (JSON) |
| `gen_ai.tool.call.result` | ✅ OTel 1.38+ | Tool call result (JSON) |
| `gen_ai.tool.definitions` | ✅ OTel 1.38+ | Array of tool definitions |
| `gen_ai.tool.name` | ✅ OTel | Tool name |
| `gen_ai.tool.description` | ✅ OTel | Tool description |
| `gen_ai.tool.type` | ✅ OTel | function, extension, datastore |
| `gen_ai.usage.input_tokens` | ✅ OTel | Input token count |
| `gen_ai.usage.output_tokens` | ✅ OTel | Output token count |
| `gen_ai.token.type` | ✅ OTel | input, output (for metrics) |
| `gen_ai.evaluation.*` | ✅ OTel 1.38+ | Evaluation metrics (name, score, explanation) |

### NOT in OTel (would need custom `axiom.*` attributes)

| Need | OTel Status | Recommendation |
|------|-------------|----------------|
| Cache read tokens | ❌ Not in OTel | `axiom.gen_ai.usage.cache_read_tokens` |
| Cache write tokens | ❌ Not in OTel | `axiom.gen_ai.usage.cache_write_tokens` |
| Reasoning tokens | ❌ Not in OTel | `axiom.gen_ai.usage.reasoning_tokens` |
| Tool approval flow | ❌ Not in OTel | `axiom.gen_ai.tool.approval.*` |
| Dynamic/MCP tools | ❌ Not in OTel | `axiom.gen_ai.tool.dynamic` |
| Provider executed | ❌ Not in OTel | `axiom.gen_ai.tool.provider_executed` |
| Source tracking | ~OK~ `gen_ai.data_source.id` exists | Could use for RAG sources |
| File generation | ❌ Not in OTel | `axiom.gen_ai.output.files.*` |

## Requirements

### 1. LanguageModelV3 Core Support

**Priority: Must Have**

Add core V3 middleware and wrapper support.

- [ ] Create `AxiomWrappedLanguageModelV3` class
- [ ] Create `axiomAIMiddlewareV3()` function
- [ ] Create V3-specific streaming aggregators (`ToolCallAggregatorV3`, `TextAggregatorV3`, `StreamStatsV3`)
- [ ] Update `axiomAIMiddleware()` to detect `specificationVersion: 'v3'`
- [ ] Add `@ai-sdk/provider` v3 types dependency

### 2. Enhanced Token Usage Tracking

**Priority: High**

V3 provides structured token breakdown instead of flat numbers:

```typescript
// V2
inputTokens: number | undefined;
outputTokens: number | undefined;

// V3
inputTokens: {
  total: number | undefined;
  noCache: number | undefined;      // non-cached tokens
  cacheRead: number | undefined;    // tokens read from cache
  cacheWrite: number | undefined;   // tokens written to cache
};
outputTokens: {
  total: number | undefined;
  text: number | undefined;         // text-specific tokens
  reasoning: number | undefined;    // reasoning tokens
};
```

**OTel Mapping:**

| V3 Field | OTel Attribute | Status |
|----------|----------------|--------|
| `inputTokens.total` | `gen_ai.usage.input_tokens` | ✅ Use existing |
| `outputTokens.total` | `gen_ai.usage.output_tokens` | ✅ Use existing |
| `inputTokens.cacheRead` | None | ❌ Custom: `axiom.gen_ai.usage.cache_read_tokens` |
| `inputTokens.cacheWrite` | None | ❌ Custom: `axiom.gen_ai.usage.cache_write_tokens` |
| `inputTokens.noCache` | None | ❌ Custom: `axiom.gen_ai.usage.no_cache_tokens` |
| `outputTokens.reasoning` | None | ❌ Custom: `axiom.gen_ai.usage.reasoning_tokens` |
| `outputTokens.text` | None | ❌ Custom: `axiom.gen_ai.usage.text_tokens` |

### 3. Tool Approval Flow (Human-in-the-Loop)

**Priority: Medium**

V3 adds new stream parts for agent tool approval workflows:

```typescript
// New stream parts
{ type: 'tool-approval-request'; approvalId: string; toolCallId: string; }
{ type: 'tool-approval-response'; approvalId: string; approved: boolean; reason?: string; }
```

**OTel Mapping:**

| Need | OTel Attribute | Status |
|------|----------------|--------|
| Tool call ID | `gen_ai.tool.call.id` | ✅ Use existing |
| Approval ID | None | ❌ Custom: `axiom.gen_ai.tool.approval_id` |
| Approval requested | None | ❌ Custom: `axiom.gen_ai.tool.approval_requested` |
| Approved | None | ❌ Custom: `axiom.gen_ai.tool.approved` |

Aggregator updates:

- [ ] Track tool approval requests in `ToolCallAggregatorV3`
- [ ] Correlate approval responses with tool calls

### 4. Dynamic/MCP Tool Support

**Priority: Medium**

V3 adds flags for MCP (Model Context Protocol) tools:

```typescript
// New properties on tool calls
{
  dynamic?: boolean;           // indicates MCP/dynamic tool
  providerExecuted?: boolean;  // provider ran the tool (not client)
}
```

**OTel Mapping:**

| Need | OTel Attribute | Status |
|------|----------------|--------|
| Tool type | `gen_ai.tool.type` | ~OK~ Has "extension" value, could map dynamic tools |
| Dynamic flag | None | ❌ Custom: `axiom.gen_ai.tool.dynamic` |
| Provider executed | None | ❌ Custom: `axiom.gen_ai.tool.provider_executed` |

### 5. Source Tracking

**Priority: Low**

V3 adds `LanguageModelV3Source` content type for tracking document sources:

```typescript
{
  type: 'source';
  sourceType: 'url' | 'document';
  id: string;
  url?: string;
  title?: string;
  filename?: string;
  mediaType?: string;
}
```

**OTel Mapping:**

| Need | OTel Attribute | Status |
|------|----------------|--------|
| Source ID | `gen_ai.data_source.id` | ✅ Use existing (designed for RAG) |
| Source count | None | ❌ Custom: `axiom.gen_ai.sources.count` |
| Source types | None | ❌ Custom: `axiom.gen_ai.sources.types` |

### 6. File Generation

**Priority: Low**

V3 adds `LanguageModelV3File` content type for generated files:

```typescript
{
  type: 'file';
  mediaType: string;
  data: string | Uint8Array;
}
```

**OTel Mapping:**

| Need | OTel Attribute | Status |
|------|----------------|--------|
| Output type | `gen_ai.output.type` | ~OK~ Has "image" value |
| File count | None | ❌ Custom: `axiom.gen_ai.output.files.count` |
| Media types | None | ❌ Custom: `axiom.gen_ai.output.files.media_types` |

### 7. Reasoning Content Tracking

**Priority: Medium**

V3 provides better granularity for reasoning/thinking content with dedicated stream parts:

- `reasoning-start`
- `reasoning-delta`
- `reasoning-end`

**OTel Mapping:** No specific OTel attributes for reasoning content.

Updates needed:

- [ ] Create `ReasoningAggregatorV3` to track reasoning content separately
- [ ] Add `axiom.gen_ai.output.reasoning_content` attribute (redacted by default)
- [ ] Track reasoning tokens via `axiom.gen_ai.usage.reasoning_tokens`

### 8. Agent Telemetry (ToolLoopAgent)

**Priority: Low**

V3 introduces `ToolLoopAgent` class for building reusable agents.

**OTel Mapping:**

| Need | OTel Attribute | Status |
|------|----------------|--------|
| Agent name | `gen_ai.agent.name` | ✅ Use existing |
| Agent ID | `gen_ai.agent.id` | ✅ Use existing |
| Agent description | `gen_ai.agent.description` | ✅ Use existing |
| Operation | `gen_ai.operation.name` | ✅ Use "invoke_agent" |
| Max steps | None | ❌ Custom: `axiom.gen_ai.agent.max_steps` |
| Step count | None | ❌ Custom: `axiom.gen_ai.agent.step_count` |
| Stop reason | None | ❌ Custom: `axiom.gen_ai.agent.stop_reason` |

## Implementation Order

1. **Phase 1 - Core V3 Support**
   - LanguageModelV3 middleware and wrapper
   - Basic streaming aggregators
   - Ensure parity with V2 features

2. **Phase 2 - Enhanced Metrics**
   - Structured token usage (cache read/write, reasoning)
   - Reasoning content aggregation

3. **Phase 3 - Agent Features**
   - Tool approval flow tracking
   - Dynamic/MCP tool support
   - Agent telemetry

4. **Phase 4 - Content Types**
   - Source tracking
   - File generation tracking

## Package Version Requirements

```json
{
  "@ai-sdk/provider": "^3.0.0",
  "@ai-sdk/provider-utils": "^4.0.0",
  "ai": "^6.0.0"
}
```

## Breaking Changes to Note

- `unknown` finish reason merged into `other`
- `cachedInputTokens` deprecated → use `inputTokenDetails.cacheReadTokens`
- `reasoningTokens` deprecated → use `outputTokenDetails.reasoningTokens`
- Mock classes renamed: `MockLanguageModelV2` → `MockLanguageModelV3`

## References

- [AI SDK v6 Blog Post](https://vercel.com/blog/ai-sdk-6)
- [Migration Guide](https://v6.ai-sdk.dev/docs/migration-guides/migration-guide-6-0)
- [Tool Execution Approval Docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [DevTools Docs](https://ai-sdk.dev/docs/ai-sdk-core/devtools)
