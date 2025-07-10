/**
 * Tests for v5 tools enhanced functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processV5ToolCalls,
  processV5ToolResults,
  extractToolMetadata,
  validateToolCallTypes,
  convertTypedToolCall,
  processStreamingToolCalls,
  createToolExecutionContext,
  finalizeToolExecution,
  setV5ToolCallAttributes,
  setV5ToolResultAttributes,
  type V5ToolCall,
  type V5ToolResult,
  type ToolSchema,
} from '../../src/otel/v5-tools';
import type { LanguageModelV2StreamPart } from '../../src/otel/vercel-v5';

describe('v5-tools', () => {
  describe('processV5ToolCalls', () => {
    it('should process tool calls with validation', () => {
      const toolCalls: V5ToolCall[] = [
        {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          schema: {
            type: 'object',
            properties: { param1: { type: 'string' } },
            required: ['param1'],
          },
        },
      ];

      const result = processV5ToolCalls(toolCalls, {
        validate: true,
        includeMetadata: true,
        strictMode: false,
      });

      expect(result.summary.total).toBe(1);
      expect(result.summary.validated).toBe(1);
      expect(result.summary.errors).toBe(0);
      expect(result.toolCalls[0].metadata?.validated).toBe(true);
    });

    it('should handle invalid tool calls', () => {
      const toolCalls: V5ToolCall[] = [
        {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          schema: {
            type: 'object',
            properties: { param2: { type: 'string' } },
            required: ['param2'],
          },
        },
      ];

      const result = processV5ToolCalls(toolCalls, {
        validate: true,
        includeMetadata: true,
        strictMode: false,
      });

      expect(result.summary.total).toBe(1);
      expect(result.summary.validated).toBe(0);
      expect(result.summary.errors).toBe(1);
      expect(result.toolCalls[0].metadata?.validated).toBe(false);
      expect(result.toolCalls[0].metadata?.validationErrors).toContain('Missing required property: param2');
    });

    it('should process tool calls without validation', () => {
      const toolCalls: V5ToolCall[] = [
        {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
        },
      ];

      const result = processV5ToolCalls(toolCalls, {
        validate: false,
        includeMetadata: true,
        strictMode: false,
      });

      expect(result.summary.total).toBe(1);
      expect(result.summary.validated).toBe(0);
      expect(result.summary.errors).toBe(0);
      expect(result.toolCalls[0].metadata?.validated).toBe(false);
    });
  });

  describe('processV5ToolResults', () => {
    it('should process tool results with metadata', () => {
      const toolResults: V5ToolResult[] = [
        {
          type: 'tool-result',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          result: { output: 'success' },
          isError: false,
          executionTime: 100,
        },
      ];

      const result = processV5ToolResults(toolResults, {
        validate: true,
        includeMetadata: true,
        trackTiming: true,
      });

      expect(result.summary.total).toBe(1);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.errors).toBe(0);
      expect(result.toolResults[0].metadata?.executionSuccess).toBe(true);
    });

    it('should handle error tool results', () => {
      const toolResults: V5ToolResult[] = [
        {
          type: 'tool-result',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          result: { error: 'Tool execution failed' },
          isError: true,
          executionTime: 50,
        },
      ];

      const result = processV5ToolResults(toolResults, {
        validate: true,
        includeMetadata: true,
        trackTiming: true,
      });

      expect(result.summary.total).toBe(1);
      expect(result.summary.successful).toBe(0);
      expect(result.summary.errors).toBe(1);
      expect(result.toolResults[0].metadata?.executionSuccess).toBe(false);
    });
  });

  describe('extractToolMetadata', () => {
    it('should extract metadata from tool calls and results', () => {
      const toolCalls: V5ToolCall[] = [
        {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
        },
        {
          type: 'function',
          toolCallId: 'test-2',
          toolName: 'testTool2',
          args: { param2: 'value2' },
        },
      ];

      const toolResults: V5ToolResult[] = [
        {
          type: 'tool-result',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          result: { output: 'success' },
          isError: false,
        },
      ];

      const metadata = extractToolMetadata(toolCalls, toolResults);

      expect(metadata.toolCallsCount).toBe(2);
      expect(metadata.toolResultsCount).toBe(1);
      expect(metadata.uniqueTools).toBe(2);
      expect(metadata.totalArgsSize).toBeGreaterThan(0);
      expect(metadata.totalResultsSize).toBeGreaterThan(0);
    });
  });

  describe('validateToolCallTypes', () => {
    it('should validate tool call with schema', () => {
      const toolCall: V5ToolCall = {
        type: 'function',
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: { param1: 'value1', param2: 123 },
        schema: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
            param2: { type: 'number' },
          },
          required: ['param1'],
        },
      };

      const result = validateToolCallTypes(toolCall);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate tool call with missing required property', () => {
      const toolCall: V5ToolCall = {
        type: 'function',
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: { param2: 123 },
        schema: {
          type: 'object',
          properties: {
            param1: { type: 'string' },
            param2: { type: 'number' },
          },
          required: ['param1'],
        },
      };

      const result = validateToolCallTypes(toolCall);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required property: param1');
    });

    it('should validate tool call with invalid args type', () => {
      const toolCall: V5ToolCall = {
        type: 'function',
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: 'not an object',
        schema: {
          type: 'object',
          properties: { param1: { type: 'string' } },
        },
      };

      const result = validateToolCallTypes(toolCall);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tool arguments must be an object');
    });
  });

  describe('convertTypedToolCall', () => {
    it('should convert v5 tool call to v4 format', () => {
      const toolCall: V5ToolCall = {
        type: 'function',
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: { param1: 'value1' },
        schema: {
          type: 'object',
          properties: { param1: { type: 'string' } },
        },
        metadata: {
          source: 'complete',
          validated: true,
          validationErrors: [],
          parseErrors: [],
          argsSize: 20,
          timestamp: Date.now(),
        },
      };

      const result = convertTypedToolCall(toolCall, {
        preserveTypes: true,
        includeMetadata: true,
      });

      expect(result.type).toBe('function');
      expect(result.toolCallId).toBe('test-1');
      expect(result.toolName).toBe('testTool');
      expect((result.args as any).__schema).toEqual(toolCall.schema);
      expect((result as any).__metadata).toEqual(toolCall.metadata);
    });
  });

  describe('processStreamingToolCalls', () => {
    it('should process streaming tool calls', () => {
      const chunks: LanguageModelV2StreamPart[] = [
        {
          type: 'tool-call',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
        },
        {
          type: 'tool-call-delta',
          toolCallId: 'test-2',
          toolName: 'testTool2',
          argsTextDelta: '{"param2": "va',
        },
        {
          type: 'tool-call-delta',
          toolCallId: 'test-2',
          argsTextDelta: 'lue2"}',
        },
      ];

      const result = processStreamingToolCalls(chunks, {
        validateIncremental: true,
        trackDeltas: true,
      });

      expect(result.summary.totalCalls).toBe(2);
      expect(result.summary.totalDeltas).toBe(2);
      expect(result.toolCalls).toHaveLength(2);
      expect(result.deltas).toHaveLength(2);
    });
  });

  describe('createToolExecutionContext', () => {
    it('should create tool execution context', () => {
      const toolCall: V5ToolCall = {
        type: 'function',
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: { param1: 'value1' },
        schema: {
          type: 'object',
          properties: { param1: { type: 'string' } },
        },
      };

      const context = createToolExecutionContext(toolCall, {
        strictMode: true,
        startTime: 123456789,
      });

      expect(context.toolCallId).toBe('test-1');
      expect(context.toolName).toBe('testTool');
      expect(context.args).toEqual({ param1: 'value1' });
      expect(context.schema).toEqual(toolCall.schema);
      expect(context.strictMode).toBe(true);
      expect(context.startTime).toBe(123456789);
    });
  });

  describe('finalizeToolExecution', () => {
    it('should finalize tool execution', () => {
      const context = {
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: { param1: 'value1' },
        strictMode: false,
        startTime: 123456789,
      };

      const result = finalizeToolExecution(context, { output: 'success' }, {
        isError: false,
        endTime: 123456889,
      });

      expect(result.type).toBe('tool-result');
      expect(result.toolCallId).toBe('test-1');
      expect(result.toolName).toBe('testTool');
      expect(result.args).toEqual({ param1: 'value1' });
      expect(result.result).toEqual({ output: 'success' });
      expect(result.isError).toBe(false);
      expect(result.executionTime).toBe(100);
      expect(result.metadata?.executionSuccess).toBe(true);
    });

    it('should finalize tool execution with error', () => {
      const context = {
        toolCallId: 'test-1',
        toolName: 'testTool',
        args: { param1: 'value1' },
        strictMode: false,
        startTime: 123456789,
      };

      const result = finalizeToolExecution(context, { error: 'Failed' }, {
        isError: true,
        endTime: 123456839,
      });

      expect(result.type).toBe('tool-result');
      expect(result.isError).toBe(true);
      expect(result.executionTime).toBe(50);
      expect(result.metadata?.executionSuccess).toBe(false);
      expect(result.metadata?.executionErrors).toContain('Tool execution failed');
    });
  });

  describe('setV5ToolCallAttributes', () => {
    it('should set tool call attributes on span', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
        setAttribute: vi.fn(),
      };

      const toolCalls: V5ToolCall[] = [
        {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          schema: {
            type: 'object',
            properties: { param1: { type: 'string' } },
          },
          metadata: {
            source: 'complete',
            validated: true,
            validationErrors: [],
            parseErrors: [],
            argsSize: 20,
            timestamp: Date.now(),
          },
        },
      ];

      setV5ToolCallAttributes(mockSpan as any, toolCalls);

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        'gen_ai.tools.count': 1,
        'gen_ai.tools.unique_count': 1,
        'gen_ai.tools.total_args_size': expect.any(Number),
        'gen_ai.tools.validation_errors_count': 0,
      });
    });
  });

  describe('setV5ToolResultAttributes', () => {
    it('should set tool result attributes on span', () => {
      const mockSpan = {
        setAttributes: vi.fn(),
        setAttribute: vi.fn(),
      };

      const toolResults: V5ToolResult[] = [
        {
          type: 'tool-result',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          result: { output: 'success' },
          isError: false,
          executionTime: 100,
          metadata: {
            executionSuccess: true,
            executionErrors: [],
            resultSize: 20,
            processingTime: 100,
            timestamp: Date.now(),
          },
        },
      ];

      setV5ToolResultAttributes(mockSpan as any, toolResults);

      // First call sets basic attributes
      expect(mockSpan.setAttributes).toHaveBeenNthCalledWith(1, {
        'gen_ai.tool_results.count': 1,
        'gen_ai.tool_results.total_size': expect.any(Number),
        'gen_ai.tool_results.execution_errors_count': 0,
      });

      // Second call sets timing attributes
      expect(mockSpan.setAttributes).toHaveBeenNthCalledWith(2, {
        'gen_ai.tool_results.avg_execution_time': 100,
        'gen_ai.tool_results.max_execution_time': 100,
        'gen_ai.tool_results.min_execution_time': 100,
      });

      // setAttribute called for details
      expect(mockSpan.setAttribute).toHaveBeenCalledWith(
        'gen_ai.tool_results.details',
        expect.any(String),
      );
    });
  });

  describe('Advanced Tool Features', () => {
    describe('Complex schema validation', () => {
      it('should handle nested object schemas', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: {
            user: {
              name: 'John',
              age: 30,
              preferences: {
                theme: 'dark',
                notifications: true,
              },
            },
          },
          schema: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'number' },
                  preferences: {
                    type: 'object',
                    properties: {
                      theme: { type: 'string' },
                      notifications: { type: 'boolean' },
                    },
                    required: ['theme'],
                  },
                },
                required: ['name', 'age'],
              },
            },
            required: ['user'],
          },
        };

        const result = validateToolCallTypes(toolCall);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle array schemas', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: {
            items: ['item1', 'item2', 'item3'],
          },
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['items'],
          },
        };

        const result = validateToolCallTypes(toolCall);
        expect(result.isValid).toBe(true);
      });

      it('should handle strict mode with extra properties', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: {
            param1: 'value1',
            extraParam: 'not allowed',
          },
          schema: {
            type: 'object',
            properties: {
              param1: { type: 'string' },
            },
            required: ['param1'],
            additionalProperties: false,
          },
        };

        const result = validateToolCallTypes(toolCall, {
          strictMode: true,
          allowExtraProperties: false,
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Extra property not allowed: extraParam');
      });
    });

    describe('Error handling and edge cases', () => {
      it('should handle malformed JSON in args', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { circular: {} },
        };

        // Create circular reference
        (toolCall.args as any).circular.self = toolCall.args;

        const result = validateToolCallTypes(toolCall);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Failed to parse'))).toBe(true);
      });

      it('should handle empty tool calls array', () => {
        const result = processV5ToolCalls([]);
        expect(result.summary.total).toBe(0);
        expect(result.summary.validated).toBe(0);
        expect(result.summary.errors).toBe(0);
        expect(result.toolCalls).toHaveLength(0);
      });

      it('should handle processing errors gracefully', () => {
        const toolCalls: V5ToolCall[] = [
          {
            type: 'function',
            toolCallId: 'test-1',
            toolName: 'testTool',
            args: null, // Invalid args
          },
        ];

        const result = processV5ToolCalls(toolCalls, {
          validate: true,
          includeMetadata: true,
        });

        expect(result.summary.total).toBe(1);
        expect(result.summary.errors).toBe(1);
        expect(result.toolCalls[0].metadata?.validationErrors?.length).toBeGreaterThan(0);
      });
    });

    describe('Streaming tool processing', () => {
      it('should handle mixed streaming chunks', () => {
        const chunks: LanguageModelV2StreamPart[] = [
          {
            type: 'tool-call-delta',
            toolCallId: 'test-1',
            toolName: 'testTool',
            argsTextDelta: '{"param1": "',
          },
          {
            type: 'tool-call-delta',
            toolCallId: 'test-1',
            argsTextDelta: 'partial value',
          },
          {
            type: 'tool-call-delta',
            toolCallId: 'test-1',
            argsTextDelta: '"}',
          },
          {
            type: 'tool-call',
            toolCallId: 'test-2',
            toolName: 'testTool2',
            args: { param2: 'complete' },
          },
        ];

        const result = processStreamingToolCalls(chunks, {
          validateIncremental: true,
          trackDeltas: true,
        });

        expect(result.summary.totalCalls).toBe(2);
        expect(result.summary.totalDeltas).toBe(3);
        expect(result.toolCalls).toHaveLength(2);

        // Check that streaming deltas were accumulated
        const streamingTool = result.toolCalls.find(tc => tc.toolCallId === 'test-1');
        expect(streamingTool?.args).toBe('{"param1": "partial value"}');
      });

      it('should handle validation errors during streaming', () => {
        const chunks: LanguageModelV2StreamPart[] = [
          {
            type: 'tool-call',
            toolCallId: 'test-1',
            toolName: 'testTool',
            args: 'invalid args', // String instead of object
          },
        ];

        const result = processStreamingToolCalls(chunks, {
          validateIncremental: true,
          trackDeltas: false,
        });

        expect(result.summary.totalCalls).toBe(1);
        expect(result.summary.errors).toBe(1);
        expect(result.errors).toContain('Tool arguments must be an object');
      });

      it('should handle streaming without validation', () => {
        const chunks: LanguageModelV2StreamPart[] = [
          {
            type: 'tool-call-delta',
            toolCallId: 'test-1',
            toolName: 'testTool',
            argsTextDelta: '{"param',
          },
        ];

        const result = processStreamingToolCalls(chunks, {
          validateIncremental: false,
          trackDeltas: false,
        });

        expect(result.summary.totalCalls).toBe(1);
        expect(result.summary.errors).toBe(0);
        expect(result.deltas).toHaveLength(0);
      });
    });

    describe('Tool metadata extraction', () => {
      it('should handle large tool payloads', () => {
        const largeData = 'x'.repeat(10000);
        const toolCalls: V5ToolCall[] = [
          {
            type: 'function',
            toolCallId: 'test-1',
            toolName: 'testTool',
            args: { data: largeData },
          },
        ];

        const toolResults: V5ToolResult[] = [
          {
            type: 'tool-result',
            toolCallId: 'test-1',
            toolName: 'testTool',
            args: { data: largeData },
            result: { output: largeData },
            isError: false,
          },
        ];

        const metadata = extractToolMetadata(toolCalls, toolResults);
        expect(metadata.totalArgsSize).toBeGreaterThan(10000);
        expect(metadata.totalResultsSize).toBeGreaterThan(10000);
      });

      it('should handle tool calls with validation errors', () => {
        const toolCalls: V5ToolCall[] = [
          {
            type: 'function',
            toolCallId: 'test-1',
            toolName: 'testTool',
            args: { param1: 'value1' },
            metadata: {
              source: 'complete',
              validated: false,
              validationErrors: ['Missing required property: param2'],
              parseErrors: [],
              argsSize: 20,
              timestamp: Date.now(),
            },
          },
        ];

        const metadata = extractToolMetadata(toolCalls);
        expect(metadata.validationErrors).toContain('Missing required property: param2');
      });
    });

    describe('Tool execution lifecycle', () => {
      it('should handle tool execution with schema validation', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          schema: {
            type: 'object',
            properties: { param1: { type: 'string' } },
            required: ['param1'],
          },
        };

        const context = createToolExecutionContext(toolCall, {
          strictMode: true,
          startTime: 1000,
        });

        expect(context.schema).toEqual(toolCall.schema);
        expect(context.strictMode).toBe(true);

        const result = finalizeToolExecution(context, { success: true }, {
          endTime: 1500,
        });

        expect(result.executionTime).toBe(500);
        expect(result.metadata?.executionSuccess).toBe(true);
      });
    });

    describe('Type conversion and compatibility', () => {
      it('should convert v5 tool calls to v4 format with all options', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          schema: {
            type: 'object',
            properties: { param1: { type: 'string' } },
          },
          metadata: {
            source: 'complete',
            validated: true,
            validationErrors: [],
            parseErrors: [],
            argsSize: 20,
            timestamp: Date.now(),
          },
        };

        const result = convertTypedToolCall(toolCall, {
          preserveTypes: true,
          includeMetadata: true,
        });

        expect(result.type).toBe('function');
        expect(result.toolCallId).toBe('test-1');
        expect(result.toolName).toBe('testTool');
        expect((result.args as any).__schema).toEqual(toolCall.schema);
        expect((result as any).__metadata).toEqual(toolCall.metadata);
      });

      it('should convert v5 tool calls without type preservation', () => {
        const toolCall: V5ToolCall = {
          type: 'function',
          toolCallId: 'test-1',
          toolName: 'testTool',
          args: { param1: 'value1' },
          schema: {
            type: 'object',
            properties: { param1: { type: 'string' } },
          },
        };

        const result = convertTypedToolCall(toolCall, {
          preserveTypes: false,
          includeMetadata: false,
        });

        expect(result.type).toBe('function');
        expect(result.args).toEqual({ param1: 'value1' });
        expect((result.args as any).__schema).toBeUndefined();
        expect((result as any).__metadata).toBeUndefined();
      });
    });
  });
});
