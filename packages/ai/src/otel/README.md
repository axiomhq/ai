# Axiom AI Telemetry Middleware

This package provides comprehensive OpenTelemetry instrumentation for AI language models using Vercel's AI SDK middleware system.

## Quick Start

### Simple Class-Based API

```typescript
import { AxiomWrappedLanguageModelV1, AxiomWrappedLanguageModelV2 } from '@axiom/ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Simple and clean
const v1Model = new AxiomWrappedLanguageModelV1(openai('gpt-3.5-turbo'));
const v2Model = new AxiomWrappedLanguageModelV2(anthropic('claude-3-haiku-20240307'));

// Use with any AI SDK function
import { generateText } from 'ai';

const result = await generateText({
  model: v1Model,
  prompt: 'Hello, world!',
});
```

### Advanced Middleware API

```typescript
import { wrapLanguageModel } from 'ai';
import { createAxiomTelemetryV1, createAxiomTelemetryV2 } from '@axiom/ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// For AI SDK v4 (LanguageModelV1)
const v1Model = wrapLanguageModel({
  model: openai('gpt-4'),
  middleware: createAxiomTelemetryV1(),
});

// For AI SDK v5 (LanguageModelV2)  
const v2Model = wrapLanguageModel({
  model: anthropic('claude-3-haiku-20240307'),
  middleware: createAxiomTelemetryV2(),
});
```

## Two Equally Valid Approaches

Both the class-based API and middleware API provide the same functionality and performance. Choose based on your preferences:

### Class-Based API (Recommended for Simplicity)

```typescript
import { AxiomWrappedLanguageModelV1, AxiomWrappedLanguageModelV2 } from '@axiom/ai';

// Clean and simple
const model = new AxiomWrappedLanguageModelV1(someV1Model);
```

**Best for:**
- Simple use cases
- One-off model wrapping
- Developers who prefer class-based APIs

### Middleware API (Recommended for Advanced Use Cases)

```typescript
import { wrapLanguageModel } from 'ai';
import { createAxiomTelemetry } from '@axiom/ai';

const model = wrapLanguageModel({
  model: someV1Model,
  middleware: createAxiomTelemetry(),
});
```

**Best for:**
- Composing multiple middlewares
- Framework integration
- Advanced customization needs
- Official Vercel AI SDK ecosystem integration

## API Reference

### `createAxiomTelemetry(config?)`

Universal middleware factory that auto-detects model specification version (V1 or V2).

```typescript
const middleware = createAxiomTelemetry({
  // Future configuration options
});
```

### `createAxiomTelemetryV1(config?)`

Specific middleware for LanguageModelV1 models.

### `createAxiomTelemetryV2(config?)`

Specific middleware for LanguageModelV2 models.

## Features

### Comprehensive Telemetry

- **OpenTelemetry Semantic Conventions**: Full compliance with GenAI semantic conventions
- **Span Lifecycle Management**: Parent/child spans for streaming operations
- **Token Usage Tracking**: Input/output token counting and rate calculations
- **Error Classification**: Low-cardinality error type mapping
- **Content Sanitization**: PII protection for logged prompts/completions

### Streaming Support

- **Real-time Aggregation**: Token counting, tool call aggregation, text assembly
- **Child Span Management**: Separate spans for stream processing with error handling
- **Transform Streams**: Non-blocking telemetry collection

### Tool Call Handling

- **Cross-Provider Normalization**: Consistent tool call format across providers
- **Prompt Reconstruction**: Proper conversation history with tool results
- **Result Correlation**: Links tool calls with their responses

## Advanced Usage

### Multiple Middlewares

```typescript
const model = wrapLanguageModel({
  model: baseModel,
  middleware: [
    // Custom logging middleware
    {
      wrapGenerate: async ({ doGenerate, params }) => {
        console.log('Calling generate with:', params);
        const result = await doGenerate();
        console.log('Generate completed:', result);
        return result;
      },
    },
    // Axiom telemetry middleware
    createAxiomTelemetry(),
  ],
});
```

### Configuration Options

```typescript
const middleware = createAxiomTelemetry({
  // Future options may include:
  // - samplingRate: 0.1,
  // - customAttributes: { service: 'my-app' },
  // - enableContentLogging: false,
});
```

## Backwards Compatibility

The wrapper classes (`AxiomWrappedLanguageModelV1` and `AxiomWrappedLanguageModelV2`) are still available but deprecated. They now use the middleware internally, so existing code continues to work without changes.

## Implementation Details

### Code Reuse

The migration preserves 90-95% of the existing telemetry logic by moving it from wrapper class methods into middleware hook functions:

- **Pre-call logic**: Moved from `setPreCallAttributes()` to `wrapGenerate.before`
- **Post-call logic**: Moved from `setPostCallAttributes()` to `wrapGenerate.after`  
- **Streaming logic**: Moved from `TransformStream` in `doStream()` to `wrapStream` hooks
- **Utility functions**: All existing utilities (`wrapperUtils`, `aggregators`, etc.) reused as-is

### Technical Challenges Addressed

1. **rawCall Access**: Graceful degradation when `rawCall.rawPrompt` is unavailable
2. **Context Isolation**: Per-request aggregator and span isolation
3. **Version Detection**: Runtime dispatch between V1/V2 based on `specificationVersion`
4. **Error Handling**: Preserved existing error classification and span status management

## Migration Timeline

- **Phase 1**: Middleware implementation available alongside wrapper classes
- **Phase 2**: Wrapper classes marked as deprecated
- **Phase 3**: Future major version removes wrapper classes entirely

Start using the middleware approach in new code, and migrate existing code at your convenience.
