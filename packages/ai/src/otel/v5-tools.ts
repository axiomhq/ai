/**
 * Enhanced strongly-typed tool calls and results handling for AI SDK v5.
 * 
 * This module provides type-safe tool call processing, validation, and telemetry
 * for AI SDK v5's enhanced tool system with generic types and improved metadata.
 */

import type { Span } from '@opentelemetry/api';
import type {
  LanguageModelV2ToolCall,
  LanguageModelV2ToolChoice,
  LanguageModelV2StreamPart,
} from './vercel-v5';

/**
 * Generic tool call type for v5 strongly-typed tools
 */
export interface V5ToolCall<TName extends string = string, TArgs = unknown> {
  type: 'function';
  toolCallId: string;
  toolName: TName;
  args: TArgs;
  schema?: ToolSchema;
  metadata?: ToolCallMetadata;
}

/**
 * Generic tool result type for v5 strongly-typed tools
 */
export interface V5ToolResult<TName extends string = string, TArgs = unknown, TResult = unknown> {
  type: 'tool-result';
  toolCallId: string;
  toolName: TName;
  args: TArgs;
  result: TResult;
  isError?: boolean;
  executionTime?: number;
  metadata?: ToolResultMetadata;
}

/**
 * Enhanced tool schema information
 */
export interface ToolSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
}

/**
 * Tool call metadata for enhanced telemetry
 */
export interface ToolCallMetadata {
  source?: 'streaming' | 'complete';
  validated?: boolean;
  validationErrors?: string[];
  parseErrors?: string[];
  argsSize?: number;
  timestamp?: number;
}

/**
 * Tool result metadata for enhanced telemetry
 */
export interface ToolResultMetadata {
  executionSuccess?: boolean;
  executionErrors?: string[];
  resultSize?: number;
  processingTime?: number;
  timestamp?: number;
}

/**
 * Enhanced tool choice configuration
 */
export interface V5ToolChoice extends LanguageModelV2ToolChoice {
  schema?: ToolSchema;
  strictMode?: boolean;
  fallbackBehavior?: 'error' | 'skip' | 'auto';
}

/**
 * Tool validation result
 */
export interface ToolValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  parsedArgs?: unknown;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  toolCallId: string;
  toolName: string;
  args: unknown;
  schema?: ToolSchema;
  strictMode?: boolean;
  startTime: number;
}

/**
 * Enhanced tool call processing with strong typing
 */
export function processV5ToolCalls<T extends readonly V5ToolCall[]>(
  toolCalls: T,
  options: {
    validate?: boolean;
    includeMetadata?: boolean;
    strictMode?: boolean;
  } = {},
): ProcessedToolCalls<T> {
  const { validate = true, includeMetadata = true, strictMode = false } = options;
  
  const processedCalls: ProcessedToolCall[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const toolCall of toolCalls) {
    try {
      const processed = processIndividualToolCall(toolCall, {
        validate,
        includeMetadata,
        strictMode,
      });
      
      processedCalls.push(processed);
      
      if (processed.metadata?.validationErrors) {
        errors.push(...processed.metadata.validationErrors);
      }
    } catch (error) {
      const errorMsg = `Failed to process tool call ${toolCall.toolCallId}: ${error}`;
      errors.push(errorMsg);
      
      // Create a fallback processed call
      processedCalls.push({
        ...toolCall,
        metadata: {
          source: 'complete',
          validated: false,
          validationErrors: [errorMsg],
          parseErrors: [],
          argsSize: 0,
          timestamp: Date.now(),
          ...toolCall.metadata,
        },
      });
    }
  }

  return {
    toolCalls: processedCalls as unknown as ProcessedToolCalls<T>['toolCalls'],
    summary: {
      total: toolCalls.length,
      validated: processedCalls.filter(tc => tc.metadata?.validated).length,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
  };
}

/**
 * Enhanced tool result processing with strong typing
 */
export function processV5ToolResults<T extends readonly V5ToolResult[]>(
  toolResults: T,
  options: {
    validate?: boolean;
    includeMetadata?: boolean;
    trackTiming?: boolean;
  } = {},
): ProcessedToolResults<T> {
  const { validate = true, includeMetadata = true, trackTiming = true } = options;
  
  const processedResults: ProcessedToolResult[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const toolResult of toolResults) {
    try {
      const processed = processIndividualToolResult(toolResult, {
        validate,
        includeMetadata,
        trackTiming,
      });
      
      processedResults.push(processed);
      
      if (processed.metadata?.executionErrors) {
        errors.push(...processed.metadata.executionErrors);
      }
    } catch (error) {
      const errorMsg = `Failed to process tool result ${toolResult.toolCallId}: ${error}`;
      errors.push(errorMsg);
      
      // Create a fallback processed result
      processedResults.push({
        ...toolResult,
        metadata: {
          executionSuccess: false,
          executionErrors: [errorMsg],
          resultSize: 0,
          processingTime: 0,
          timestamp: Date.now(),
          ...toolResult.metadata,
        },
      });
    }
  }

  return {
    toolResults: processedResults as unknown as ProcessedToolResults<T>['toolResults'],
    summary: {
      total: toolResults.length,
      successful: processedResults.filter(tr => tr.metadata?.executionSuccess !== false).length,
      errors: errors.length,
      warnings: warnings.length,
    },
    errors,
    warnings,
  };
}

/**
 * Extract tool metadata from tool calls for telemetry
 */
export function extractToolMetadata(
  toolCalls: V5ToolCall[],
  toolResults?: V5ToolResult[],
): ToolMetadata {
  const metadata: ToolMetadata = {
    toolCallsCount: toolCalls.length,
    toolResultsCount: toolResults?.length || 0,
    uniqueTools: new Set(toolCalls.map(tc => tc.toolName)).size,
    totalArgsSize: 0,
    totalResultsSize: 0,
    validationErrors: [],
    executionErrors: [],
  };

  // Process tool calls
  for (const toolCall of toolCalls) {
    const argsString = typeof toolCall.args === 'string' 
      ? toolCall.args 
      : JSON.stringify(toolCall.args);
    metadata.totalArgsSize += argsString.length;
    
    if (toolCall.metadata?.validationErrors) {
      metadata.validationErrors.push(...toolCall.metadata.validationErrors);
    }
  }

  // Process tool results
  if (toolResults) {
    for (const toolResult of toolResults) {
      const resultString = typeof toolResult.result === 'string' 
        ? toolResult.result 
        : JSON.stringify(toolResult.result);
      metadata.totalResultsSize += resultString.length;
      
      if (toolResult.metadata?.executionErrors) {
        metadata.executionErrors.push(...toolResult.metadata.executionErrors);
      }
    }
  }

  return metadata;
}

/**
 * Validate tool call arguments against schema
 */
export function validateToolCallTypes(
  toolCall: V5ToolCall,
  options: {
    strictMode?: boolean;
    allowExtraProperties?: boolean;
  } = {},
): ToolValidationResult {
  const { strictMode = false, allowExtraProperties = true } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Basic type validation
    if (typeof toolCall.args !== 'object' || toolCall.args === null) {
      errors.push('Tool arguments must be an object');
      return { isValid: false, errors, warnings };
    }

    // Schema validation if available
    if (toolCall.schema) {
      const schemaValidation = validateAgainstSchema(toolCall.args, toolCall.schema, {
        strictMode,
        allowExtraProperties,
      });
      
      errors.push(...schemaValidation.errors);
      warnings.push(...schemaValidation.warnings);
    }

    // Parse validation - try to serialize/deserialize
    try {
      const serialized = JSON.stringify(toolCall.args);
      const parsed = JSON.parse(serialized);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        parsedArgs: parsed,
      };
    } catch (parseError) {
      errors.push(`Failed to parse tool arguments: ${parseError}`);
    }

  } catch (error) {
    errors.push(`Validation failed: ${error}`);
  }

  return { isValid: false, errors, warnings };
}

/**
 * Convert v5 typed tool call to v4 format for compatibility
 */
export function convertTypedToolCall(
  toolCall: V5ToolCall,
  options: {
    preserveTypes?: boolean;
    includeMetadata?: boolean;
  } = {},
): LanguageModelV2ToolCall {
  const { preserveTypes = true, includeMetadata = false } = options;

  let convertedArgs = toolCall.args;
  
  // Preserve type information if requested
  if (preserveTypes && toolCall.schema && typeof toolCall.args === 'object' && toolCall.args !== null) {
    convertedArgs = {
      ...toolCall.args,
      __schema: toolCall.schema,
    };
  }

  const converted: LanguageModelV2ToolCall = {
    type: toolCall.type,
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: convertedArgs,
  };

  // Include metadata if requested
  if (includeMetadata && toolCall.metadata) {
    (converted as any).__metadata = toolCall.metadata;
  }

  return converted;
}

/**
 * Set tool call attributes for telemetry
 */
export function setV5ToolCallAttributes(
  span: Span,
  toolCalls: V5ToolCall[],
  prefix: string = 'gen_ai.tools',
): void {
  if (!toolCalls.length) return;

  const metadata = extractToolMetadata(toolCalls);
  
  // Set basic tool call attributes
  span.setAttributes({
    [`${prefix}.count`]: metadata.toolCallsCount,
    [`${prefix}.unique_count`]: metadata.uniqueTools,
    [`${prefix}.total_args_size`]: metadata.totalArgsSize,
    [`${prefix}.validation_errors_count`]: metadata.validationErrors.length,
  });

  // Set tool-specific attributes
  const toolDetails = toolCalls.map(tc => ({
    name: tc.toolName,
    id: tc.toolCallId,
    args_size: getObjectSize(tc.args),
    has_schema: !!tc.schema,
    validated: tc.metadata?.validated,
    validation_errors: tc.metadata?.validationErrors?.length || 0,
  }));

  span.setAttribute(`${prefix}.details`, JSON.stringify(toolDetails));

  // Set validation errors if any
  if (metadata.validationErrors.length > 0) {
    span.setAttribute(`${prefix}.validation_errors`, JSON.stringify(metadata.validationErrors));
  }

  // Set tool schemas if available
  const schemas = toolCalls
    .filter(tc => tc.schema)
    .map(tc => ({
      tool: tc.toolName,
      schema: tc.schema,
    }));

  if (schemas.length > 0) {
    span.setAttribute(`${prefix}.schemas`, JSON.stringify(schemas));
  }
}

/**
 * Set tool result attributes for telemetry
 */
export function setV5ToolResultAttributes(
  span: Span,
  toolResults: V5ToolResult[],
  prefix: string = 'gen_ai.tool_results',
): void {
  if (!toolResults.length) return;

  const metadata = extractToolMetadata([], toolResults);
  
  // Set basic tool result attributes
  span.setAttributes({
    [`${prefix}.count`]: metadata.toolResultsCount,
    [`${prefix}.total_size`]: metadata.totalResultsSize,
    [`${prefix}.execution_errors_count`]: metadata.executionErrors.length,
  });

  // Set result-specific attributes
  const resultDetails = toolResults.map(tr => ({
    name: tr.toolName,
    id: tr.toolCallId,
    result_size: getObjectSize(tr.result),
    is_error: tr.isError,
    execution_time: tr.executionTime,
    success: tr.metadata?.executionSuccess,
  }));

  span.setAttribute(`${prefix}.details`, JSON.stringify(resultDetails));

  // Set execution errors if any
  if (metadata.executionErrors.length > 0) {
    span.setAttribute(`${prefix}.execution_errors`, JSON.stringify(metadata.executionErrors));
  }

  // Set timing information
  const executionTimes = toolResults
    .filter(tr => tr.executionTime)
    .map(tr => tr.executionTime!);

  if (executionTimes.length > 0) {
    span.setAttributes({
      [`${prefix}.avg_execution_time`]: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      [`${prefix}.max_execution_time`]: Math.max(...executionTimes),
      [`${prefix}.min_execution_time`]: Math.min(...executionTimes),
    });
  }
}

/**
 * Process streaming tool calls with enhanced metadata
 */
export function processStreamingToolCalls(
  chunks: LanguageModelV2StreamPart[],
  options: {
    validateIncremental?: boolean;
    trackDeltas?: boolean;
  } = {},
): StreamingToolCallsResult {
  const { validateIncremental = true, trackDeltas = true } = options;
  
  const toolCalls = new Map<string, V5ToolCall>();
  const deltas: ToolCallDelta[] = [];
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      if (chunk.type === 'tool-call') {
        // Complete tool call
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: chunk.toolCallId!,
          toolName: chunk.toolName!,
          args: chunk.args,
          metadata: {
            source: 'streaming',
            validated: false,
            timestamp: Date.now(),
          },
        };

        if (validateIncremental) {
          const validation = validateToolCallTypes(toolCall);
          toolCall.metadata!.validated = validation.isValid;
          toolCall.metadata!.validationErrors = validation.errors;
          
          if (!validation.isValid) {
            errors.push(...validation.errors);
          }
        }

        toolCalls.set(chunk.toolCallId!, toolCall);
      } else if (chunk.type === 'tool-call-delta') {
        // Incremental tool call
        const existingCall = toolCalls.get(chunk.toolCallId!);
        
        if (trackDeltas) {
          deltas.push({
            toolCallId: chunk.toolCallId!,
            toolName: chunk.toolName,
            argsTextDelta: chunk.argsTextDelta,
            timestamp: Date.now(),
          });
        }

        if (existingCall) {
          // Update existing call
          if (chunk.toolName && !existingCall.toolName) {
            existingCall.toolName = chunk.toolName;
          }
          
          if (chunk.argsTextDelta) {
            const currentArgs = typeof existingCall.args === 'string' 
              ? existingCall.args 
              : JSON.stringify(existingCall.args);
            existingCall.args = currentArgs + chunk.argsTextDelta;
          }
          
          if (chunk.args !== undefined) {
            existingCall.args = chunk.args;
          }
        } else {
          // Create new call from delta
          const toolCall: V5ToolCall = {
            type: 'function',
            toolCallId: chunk.toolCallId!,
            toolName: chunk.toolName || '',
            args: chunk.argsTextDelta || chunk.args || '',
            metadata: {
              source: 'streaming',
              validated: false,
              timestamp: Date.now(),
            },
          };
          
          toolCalls.set(chunk.toolCallId!, toolCall);
        }
      }
    } catch (error) {
      errors.push(`Failed to process streaming chunk: ${error}`);
    }
  }

  return {
    toolCalls: Array.from(toolCalls.values()),
    deltas: trackDeltas ? deltas : [],
    errors,
    summary: {
      totalCalls: toolCalls.size,
      totalDeltas: deltas.length,
      errors: errors.length,
    },
  };
}

// Helper types and interfaces

type ProcessedToolCall = V5ToolCall & {
  metadata: Required<ToolCallMetadata>;
};

type ProcessedToolResult = V5ToolResult & {
  metadata: Required<ToolResultMetadata>;
};

interface ProcessedToolCalls<T> {
  toolCalls: T;
  summary: {
    total: number;
    validated: number;
    errors: number;
    warnings: number;
  };
  errors: string[];
  warnings: string[];
}

interface ProcessedToolResults<T> {
  toolResults: T;
  summary: {
    total: number;
    successful: number;
    errors: number;
    warnings: number;
  };
  errors: string[];
  warnings: string[];
}

interface ToolMetadata {
  toolCallsCount: number;
  toolResultsCount: number;
  uniqueTools: number;
  totalArgsSize: number;
  totalResultsSize: number;
  validationErrors: string[];
  executionErrors: string[];
}

interface ToolCallDelta {
  toolCallId: string;
  toolName?: string;
  argsTextDelta?: string;
  timestamp: number;
}

interface StreamingToolCallsResult {
  toolCalls: V5ToolCall[];
  deltas: ToolCallDelta[];
  errors: string[];
  summary: {
    totalCalls: number;
    totalDeltas: number;
    errors: number;
  };
}

// Helper functions

function processIndividualToolCall(
  toolCall: V5ToolCall,
  options: {
    validate: boolean;
    includeMetadata: boolean;
    strictMode: boolean;
  },
): ProcessedToolCall {
  const metadata: Required<ToolCallMetadata> = {
    source: 'complete',
    validated: false,
    validationErrors: [],
    parseErrors: [],
    argsSize: getObjectSize(toolCall.args),
    timestamp: Date.now(),
    ...toolCall.metadata,
  };

  if (options.validate) {
    const validation = validateToolCallTypes(toolCall, { strictMode: options.strictMode });
    metadata.validated = validation.isValid;
    metadata.validationErrors = validation.errors;
  }

  return {
    ...toolCall,
    metadata,
  };
}

function processIndividualToolResult(
  toolResult: V5ToolResult,
  _options: {
    validate: boolean;
    includeMetadata: boolean;
    trackTiming: boolean;
  },
): ProcessedToolResult {
  const metadata: Required<ToolResultMetadata> = {
    executionSuccess: !toolResult.isError,
    executionErrors: [],
    resultSize: getObjectSize(toolResult.result),
    processingTime: 0,
    timestamp: Date.now(),
    ...toolResult.metadata,
  };

  if (toolResult.isError) {
    metadata.executionErrors.push('Tool execution failed');
  }

  return {
    ...toolResult,
    metadata,
  };
}

function validateAgainstSchema(
  args: unknown,
  schema: ToolSchema,
  options: {
    strictMode: boolean;
    allowExtraProperties: boolean;
  },
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic schema validation (simplified)
  if (schema.type === 'object' && (typeof args !== 'object' || args === null)) {
    errors.push('Expected object type');
    return { errors, warnings };
  }

  if (schema.properties && typeof args === 'object' && args !== null) {
    const argsObj = args as Record<string, unknown>;
    
    // Check required properties
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in argsObj)) {
          errors.push(`Missing required property: ${required}`);
        }
      }
    }

    // Check extra properties
    if (!options.allowExtraProperties && schema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      for (const prop of Object.keys(argsObj)) {
        if (!allowedProps.has(prop)) {
          if (options.strictMode) {
            errors.push(`Extra property not allowed: ${prop}`);
          } else {
            warnings.push(`Extra property found: ${prop}`);
          }
        }
      }
    }
  }

  return { errors, warnings };
}

function getObjectSize(obj: unknown): number {
  if (typeof obj === 'string') {
    return obj.length;
  }
  
  try {
    return JSON.stringify(obj).length;
  } catch {
    return 0;
  }
}

/**
 * Utility function to create tool execution context
 */
export function createToolExecutionContext(
  toolCall: V5ToolCall,
  options: {
    strictMode?: boolean;
    startTime?: number;
  } = {},
): ToolExecutionContext {
  return {
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: toolCall.args,
    schema: toolCall.schema,
    strictMode: options.strictMode || false,
    startTime: options.startTime || Date.now(),
  };
}

/**
 * Utility function to finalize tool execution
 */
export function finalizeToolExecution(
  context: ToolExecutionContext,
  result: unknown,
  options: {
    isError?: boolean;
    endTime?: number;
  } = {},
): V5ToolResult {
  const endTime = options.endTime || Date.now();
  const executionTime = endTime - context.startTime;

  return {
    type: 'tool-result',
    toolCallId: context.toolCallId,
    toolName: context.toolName,
    args: context.args,
    result,
    isError: options.isError || false,
    executionTime,
    metadata: {
      executionSuccess: !options.isError,
      executionErrors: options.isError ? ['Tool execution failed'] : [],
      resultSize: getObjectSize(result),
      processingTime: executionTime,
      timestamp: endTime,
    },
  };
}
