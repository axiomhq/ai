# Vercel AI SDK v4 to v5 Migration Plan

## Overview
The Vercel AI SDK has released v5 with significant breaking changes. Our current wrapper in `packages/ai/src/otel/vercel.ts` was built for v4 and needs to be updated to support both v4 and v5.

## Key Differences Between v4 and v5

### Major Changes
1. **Interface Names**: `LanguageModelV1` → `LanguageModelV2`
2. **Message Structure**: Complete overhaul of message types and content structure
3. **Provider Options**: `providerMetadata` → `providerOptions`
4. **Streaming**: Different streaming chunk structure
5. **Tool Calls**: Updated tool call and tool result interfaces
6. **New Content Types**: Added `FilePart`, `ReasoningPart` support
7. **Deprecations**: Many v4 types are deprecated but still available

### V4 vs V5 Type Mapping

#### Package Structure
- V4: All types from `@ai-sdk/provider`
- V5: Split across `@ai-sdk/provider` and `@ai-sdk/provider-utils`

#### Core Model Interface
- V4: `LanguageModelV1` 
- V5: `LanguageModelV2` (aliased as `LanguageModel`)

#### Specification Version
- V4: `specificationVersion: 'v1'`
- V5: `specificationVersion: 'v2'`

#### Message Types
- V4: `LanguageModelV1Prompt` (array of messages)
- V5: `ModelMessage` (union of `SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage`)

#### Content Parts
- V4: `LanguageModelV1TextPart`, `LanguageModelV1ToolCallPart`
- V5: `TextPart`, `ImagePart`, `FilePart`, `ReasoningPart`, `ToolCallPart`, `ToolResultPart`

#### Tool Calls
- V4: `LanguageModelV1FunctionToolCall` (untyped)
- V5: `ToolCall<NAME extends string, ARGS>` (strongly typed with generics)

#### Tool Results
- V4: Handled in message content
- V5: `ToolResult<NAME extends string, ARGS, RESULT>` (strongly typed)

#### Metadata/Options
- V4: `providerMetadata` property
- V5: `providerOptions` property

#### Usage Information
- V4: `{ promptTokens: number; completionTokens: number }`
- V5: `LanguageModelV2Usage` (same structure but different type name)

#### Streaming
- V4: `LanguageModelV1StreamPart`
- V5: Similar structure but different type names and some new chunk types

#### Call Options
- V4: `LanguageModelV1CallOptions`
- V5: `LanguageModelV2CallOptions` (similar structure)

#### Warnings
- V4: `LanguageModelV1CallWarning`
- V5: `LanguageModelV2CallWarning` (aliased as `CallWarning`)

#### Finish Reasons
- V4: `LanguageModelV1FinishReason`
- V5: `LanguageModelV2FinishReason` (aliased as `FinishReason`)

## Technical Challenges

### 1. Type Detection
- Need to distinguish between v4 and v5 models at runtime
- V4 uses `specificationVersion: 'v1'`
- V5 uses `specificationVersion: 'v2'`

### 2. Message Format Conversion
- V4 and V5 have completely different message structures
- Need separate conversion functions for each version
- Tool calls and results have different formats

### 3. Streaming Differences
- Different chunk types and structures
- Need version-specific stream handling

### 4. Provider Metadata vs Options
- V4: `providerMetadata` 
- V5: `providerOptions`
- Different semantics and usage patterns

### 5. Backwards Compatibility
- Need to maintain support for existing v4 integrations
- Some v4 types might be deprecated but still functional

### 6. Package Dependencies
- V5 splits functionality across multiple packages
- Need to ensure proper imports from both `@ai-sdk/provider` and `@ai-sdk/provider-utils`
- May need to handle version compatibility between packages

### 7. Strong Typing in V5
- V5 tool calls are strongly typed with generics
- Need to handle the transition from untyped to typed tool calls
- Type inference may be more complex in v5

## Proposed Solution

### Option 1: Generic Wrapper (Recommended)
Create a single `wrapAISDKModel` function that uses generics and runtime type checking:

```typescript
import { LanguageModelV1 } from '@ai-sdk/provider'; // v4 types
import { LanguageModelV2 } from '@ai-sdk/provider'; // v5 types

export function wrapAISDKModel<T extends LanguageModelV1 | LanguageModelV2>(model: T): T {
  if (model.specificationVersion === 'v1') {
    return new AxiomWrappedLanguageModelV1(model as LanguageModelV1) as T;
  } else if (model.specificationVersion === 'v2') {
    return new AxiomWrappedLanguageModelV2(model as LanguageModelV2) as T;
  }
  throw new Error(`Unsupported AI SDK model version: ${model.specificationVersion}`);
}
```

### Option 2: Separate Functions
Create separate wrapper functions for each version:

```typescript
export function wrapAISDKModelV1(model: LanguageModelV1): LanguageModelV1
export function wrapAISDKModelV2(model: LanguageModelV2): LanguageModelV2
```

## Implementation Plan

### Phase 1: Infrastructure
1. Create version detection utilities
2. Set up shared interfaces for common functionality
3. Create base wrapper class with common telemetry logic

### Phase 2: V5 Support
1. Create `AxiomWrappedLanguageModelV2` class
2. Implement v5-specific message conversion (handle new content types)
3. Handle v5 streaming format and new chunk types
4. Add v5-specific attribute mapping
5. Handle strongly-typed tool calls and results
6. Support new `providerOptions` vs `providerMetadata`

### Phase 3: Unified Interface
1. Update `wrapAISDKModel` to handle both versions
2. Add comprehensive tests for both versions
3. Ensure backwards compatibility

### Phase 4: Migration Guide
1. Document migration path for users
2. Provide examples for both versions
3. Update README and examples

## File Structure

```
packages/ai/src/otel/
├── vercel.ts              # Current v4 implementation 
├── vercel-v5.ts           # New v5 implementation
├── vercel-shared.ts       # Shared utilities and base classes
├── vercel-types.ts        # Type definitions and guards
├── message-conversion.ts  # V4/V5 message format conversion
└── __tests__/
    ├── vercel-v4.test.ts
    ├── vercel-v5.test.ts
    └── message-conversion.test.ts
```

## Risks and Mitigation

### Risk: Breaking Changes
- **Mitigation**: Maintain backwards compatibility, use feature detection

### Risk: Type Complexity
- **Mitigation**: Use union types and type guards, comprehensive testing

### Risk: Performance Impact
- **Mitigation**: Minimize runtime type checking, optimize hot paths

### Risk: Maintenance Burden
- **Mitigation**: Share common code, use consistent patterns

### Risk: Package Compatibility
- **Mitigation**: Pin specific versions, test with multiple version combinations

### Risk: Type Complexity with Generics
- **Mitigation**: Use type guards, provide clear type assertions, comprehensive TypeScript testing

## Success Criteria

1. ✅ Support both v4 and v5 models seamlessly
2. ✅ Maintain backwards compatibility
3. ✅ Preserve all existing telemetry functionality
4. ✅ No performance regression
5. ✅ Comprehensive test coverage
6. ✅ Clear migration documentation

## Next Steps

1. Start with Phase 1 (Infrastructure)
2. Implement v5 wrapper class
3. Update main wrapper function
4. Add comprehensive tests
5. Update documentation
