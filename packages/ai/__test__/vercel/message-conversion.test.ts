import { describe, it, expect } from 'vitest';
import {
  convertV5ToV4Prompt,
  convertV5ContentPart,
  convertV5ToolCalls,
  convertV5Usage,
  convertV5FinishReason,
  convertProviderOptions,
  isV5ContentPart,
  isV5TextPart,
  isV5FilePart,
  isV5ReasoningPart,
  type V5ModelMessage,
  type V5TextPart,
  type V5FilePart,
  type V5ReasoningPart,
} from '../../src/otel/message-conversion';

describe('Message Conversion', () => {
  it('should convert v5 text part to v4', () => {
    const v5TextPart: V5TextPart = {
      type: 'text',
      text: 'Hello world',
      providerOptions: { custom: 'value' },
    };

    const v4Part = convertV5ContentPart(v5TextPart);

    expect(v4Part).toEqual({
      type: 'text',
      text: 'Hello world',
      providerMetadata: { custom: 'value' },
    });
  });

  it('should convert v5 file part to v4', () => {
    const v5FilePart: V5FilePart = {
      type: 'file',
      data: 'base64data',
      filename: 'test.txt',
      mimeType: 'text/plain',
    };

    const v4Part = convertV5ContentPart(v5FilePart);

    expect(v4Part).toEqual({
      type: 'file',
      data: 'base64data',
      filename: 'test.txt',
      mimeType: 'text/plain',
      providerMetadata: undefined,
    });
  });

  it('should convert v5 reasoning part to v4', () => {
    const v5ReasoningPart: V5ReasoningPart = {
      type: 'reasoning',
      text: 'This is my reasoning',
    };

    const v4Part = convertV5ContentPart(v5ReasoningPart);

    expect(v4Part).toEqual({
      type: 'reasoning',
      text: 'This is my reasoning',
      providerMetadata: undefined,
    });
  });

  it('should convert v5 system message to v4', () => {
    const v5Messages: V5ModelMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant',
        providerOptions: { custom: 'value' },
      },
    ];

    const v4Prompt = convertV5ToV4Prompt(v5Messages);

    expect(v4Prompt).toEqual([
      {
        role: 'system',
        content: 'You are a helpful assistant',
        providerMetadata: { custom: 'value' },
      },
    ]);
  });

  it('should convert v5 user message with multiple content parts to v4', () => {
    const v5Messages: V5ModelMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'file', data: 'base64', mimeType: 'text/plain' },
        ],
      },
    ];

    const v4Prompt = convertV5ToV4Prompt(v5Messages);

    expect(v4Prompt).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello', providerMetadata: undefined },
          { type: 'file', data: 'base64', mimeType: 'text/plain', providerMetadata: undefined, filename: undefined },
        ],
        providerMetadata: undefined,
      },
    ]);
  });

  it('should convert v5 usage to v4', () => {
    const v5Usage = {
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    };

    const v4Usage = convertV5Usage(v5Usage);

    expect(v4Usage).toEqual({
      promptTokens: 100,
      completionTokens: 50,
    });
  });

  it('should convert v5 finish reason to v4', () => {
    expect(convertV5FinishReason('stop')).toBe('stop');
    expect(convertV5FinishReason('length')).toBe('length');
    expect(convertV5FinishReason('tool-calls')).toBe('tool-calls');
    expect(convertV5FinishReason('content-filter')).toBe('content-filter');
    expect(convertV5FinishReason('error')).toBe('error');
    expect(convertV5FinishReason('other')).toBe('other');
  });

  it('should convert v5 tool calls to v4', () => {
    const v5ToolCalls = [
      {
        type: 'function' as const,
        toolCallId: 'call-1',
        toolName: 'get_weather',
        args: { location: 'SF' },
      },
    ];

    const v4ToolCalls = convertV5ToolCalls(v5ToolCalls);

    expect(v4ToolCalls).toEqual([
      {
        toolCallType: 'function',
        toolCallId: 'call-1',
        toolName: 'get_weather',
        args: { location: 'SF' },
      },
    ]);
  });

  it('should convert provider options to provider metadata', () => {
    const providerOptions = { custom: 'value', another: 123 };
    const providerMetadata = convertProviderOptions(providerOptions);

    expect(providerMetadata).toEqual({ custom: 'value', another: 123 });
  });

  it('should handle empty/undefined provider options', () => {
    expect(convertProviderOptions(undefined)).toBeUndefined();
    expect(convertProviderOptions({})).toEqual({});
  });

  it('should validate v5 content parts with type guards', () => {
    expect(isV5TextPart({ type: 'text', text: 'hello' })).toBe(true);
    expect(isV5TextPart({ type: 'image', image: 'data' })).toBe(false);

    expect(isV5FilePart({ type: 'file', data: 'base64', mimeType: 'text/plain' })).toBe(true);
    expect(isV5FilePart({ type: 'text', text: 'hello' })).toBe(false);

    expect(isV5ReasoningPart({ type: 'reasoning', text: 'thinking...' })).toBe(true);
    expect(isV5ReasoningPart({ type: 'text', text: 'hello' })).toBe(false);

    expect(isV5ContentPart({ type: 'text', text: 'hello' })).toBe(true);
    expect(isV5ContentPart({ type: 'invalid' })).toBe(false);
  });

  it('should throw error for invalid message conversion', () => {
    expect(() => convertV5ToV4Prompt('invalid' as any)).toThrow('Messages must be an array');
    expect(convertV5ToV4Prompt([])).toEqual([]);
  });

  it('should throw error for unsupported content part type', () => {
    const invalidPart = { type: 'invalid', data: 'test' };
    expect(() => convertV5ContentPart(invalidPart as any)).toThrow('Unsupported v5 content part type: invalid');
  });
});
