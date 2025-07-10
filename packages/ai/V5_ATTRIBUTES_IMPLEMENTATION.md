# V5-Specific Attribute Mapping Implementation

This document summarizes the implementation of v5-specific attribute mapping for telemetry spans in the Axiom AI SDK.

## Overview

The V5 attributes implementation provides enhanced telemetry data for AI SDK v5 features while maintaining compatibility with existing telemetry consumers. It includes support for new content types, provider options, and enhanced metadata structures.

## Implementation Files

### 1. Core Implementation: `src/otel/v5-attributes.ts`

**New Interfaces:**
- `V5ModelInfo` - Extends `SharedModelInfo` with `providerOptions`
- `V5UsageInfo` - Extends `SharedUsageInfo` with `totalTokens`
- `V5ResultInfo` - Enhanced result information with warnings and timestamps
- `V5ContentAttributes` - Content composition analysis

**Key Functions:**

#### Content Analysis
- `analyzeV5Content()` - Analyzes content composition across all message types
- `processV5Messages()` - Converts V5 messages to OpenTelemetry-compatible format
- `setV5ContentAttributes()` - Sets content-specific attributes for individual parts

#### Attribute Setting
- `setV5PreCallAttributes()` - Enhanced pre-call attributes with V5 features
- `setV5PostCallAttributes()` - Enhanced post-call attributes with V5 metadata
- `setV5ProviderAttributes()` - Handles both model and request provider options

#### Utilities
- `formatV5Completion()` - Enhanced completion formatting with reasoning support
- `convertV5Usage()` - Converts V5 usage to shared format
- `convertV5Result()` - Converts V5 result to shared format

### 2. Integration: `src/otel/vercel-v5.ts`

**Enhanced Features:**
- Overrides base class attribute methods to use V5-specific implementations
- Maintains compatibility with base wrapper architecture
- Seamless integration with existing span lifecycle management

### 3. Base Class Updates: `src/otel/vercel-base.ts`

**New Overridable Methods:**
- `setPreCallAttributes()` - Can be overridden for version-specific handling
- `setPostCallAttributes()` - Can be overridden for enhanced post-call attributes

## Enhanced V5 Features

### 1. Provider Options Support
- **Model-level options**: Captured from `model.providerOptions`
- **Request-level options**: Captured from request `providerOptions`
- Both are preserved as separate span attributes

### 2. Enhanced Content Types

#### FilePart Support
- File MIME type extraction
- File size estimation (base64 and binary)
- Comprehensive file metadata in attributes

#### ReasoningPart Support
- Reasoning content length tracking
- Extraction and preservation of reasoning text
- Integration with completion formatting

#### Enhanced ImagePart
- MIME type preservation
- Support for various image formats
- Metadata extraction for telemetry

#### ToolResultPart Enhancement
- Enhanced tool result attributes
- Result content length tracking
- Improved tool call/result correlation

### 3. Content Composition Analysis

**Metrics Tracked:**
- Text parts count
- Image parts count
- File parts count
- Reasoning parts count
- Tool call parts count
- Tool result parts count
- Total content parts

**Enhanced Metadata:**
- File types array
- File sizes array
- Image types array
- Total reasoning length

### 4. Enhanced Tool Support
- Strongly-typed tool call attributes
- Tool configuration in span attributes
- Tool choice strategy tracking
- Enhanced tool result handling

### 5. Usage and Response Metadata
- Support for `totalTokens` in V5 usage
- Response timestamp preservation
- Enhanced provider metadata handling
- Warning messages and counts

## Attribute Naming Conventions

All attributes follow OpenTelemetry semantic conventions:

### Content Analysis Attributes
```
gen_ai.prompt.content.text_parts
gen_ai.prompt.content.image_parts
gen_ai.prompt.content.file_parts
gen_ai.prompt.content.reasoning_parts
gen_ai.prompt.content.tool_call_parts
gen_ai.prompt.content.tool_result_parts
gen_ai.prompt.content.total_parts
```

### File-Specific Attributes
```
gen_ai.prompt.content.file_types
gen_ai.prompt.content.file_sizes
gen_ai.prompt.content.image_types
gen_ai.prompt.content.reasoning_length
```

### Provider Options Attributes
```
gen_ai.model.provider_options
gen_ai.request.provider_options
```

### Enhanced Response Attributes
```
gen_ai.response.timestamp
gen_ai.response.warnings
gen_ai.response.warnings_count
gen_ai.response.tool_calls_count
gen_ai.response.tool_calls
gen_ai.response.duration
gen_ai.usage.total_tokens
```

## Testing

### Comprehensive Test Coverage: `__test__/vercel/v5-attributes.test.ts`

**Test Categories:**
1. **Content Analysis Tests** - Verify proper content type detection and metrics
2. **Message Processing Tests** - Test V5 to OpenTelemetry message conversion
3. **Completion Formatting Tests** - Test enhanced completion formatting
4. **Attribute Setting Tests** - Verify all attribute categories are set correctly
5. **Provider Options Tests** - Test model and request provider options handling
6. **Content-Specific Tests** - Test file, reasoning, and tool content attributes
7. **Conversion Tests** - Test V5 to shared format conversions

**Key Test Features:**
- Mock span verification
- Attribute validation
- Edge case handling
- Content composition validation
- Provider options verification

## Compatibility

### Backward Compatibility
- Does not break existing V4 attribute handling
- Maintains same telemetry data structure
- Preserves existing semantic conventions
- Attributes are valid OpenTelemetry format

### Forward Compatibility
- Extensible for future V5 features
- Modular attribute handling
- Flexible content type support
- Scalable provider options system

## Benefits

### 1. Richer Telemetry Data
- Detailed content composition analysis
- Enhanced provider configuration tracking
- Comprehensive tool usage metrics
- Improved debugging capabilities

### 2. Better Observability
- File and image handling insights
- Reasoning process tracking
- Provider option influence analysis
- Enhanced error diagnostics

### 3. Enhanced Analytics
- Content type distribution analysis
- Tool usage patterns
- Provider configuration impact
- Performance correlation with content types

### 4. Improved Debugging
- Detailed request composition
- Enhanced error context
- Provider option debugging
- Tool call/result correlation

## Performance Considerations

### Efficient Implementation
- Minimal overhead for attribute collection
- Lazy evaluation where possible
- Efficient content analysis algorithms
- Optimized JSON serialization

### Memory Usage
- Controlled attribute payload sizes
- Efficient string handling
- Minimal object allocations
- Smart content sampling for large files

## Future Enhancements

### Potential Extensions
1. **Content Sampling** - Sample large content for attributes
2. **Semantic Analysis** - Basic content classification
3. **Provider Metrics** - Provider-specific performance metrics
4. **Advanced Tool Analytics** - Tool success rates and patterns
5. **Reasoning Quality Metrics** - Reasoning length and complexity analysis

## Conclusion

The V5-specific attribute mapping provides a comprehensive enhancement to telemetry capabilities while maintaining full backward compatibility. It enables rich observability for modern AI applications using the latest SDK features and content types.
