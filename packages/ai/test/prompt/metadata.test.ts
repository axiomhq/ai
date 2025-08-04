import { describe, expect, it } from 'vitest';
import { parse, Template } from '../../src/prompt/index';
import type { Prompt } from '../../src/types';
import type { ParsedMessage } from '../../src/types/metadata';

describe('Prompt Metadata', () => {
  const PROMPT_ID = 'bb8f400c-2fac-4b54-b215-2cacbe21bee7';
  const mockPrompt = {
    promptId: PROMPT_ID,
    name: 'Test Prompt',
    slug: 'test-prompt',
    version: '1.0.0',
    model: 'gpt-4',
    options: {},
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello {{ name }}!' },
    ],
    arguments: {
      name: Template.String(),
    },
  } satisfies Prompt;

  describe('parse function with metadata', () => {
    it('should return messages as a Proxy with _axiomMeta property', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'World' },
      });

      // Messages should behave like a normal array
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].role).toBe('system');
      expect(result.messages[1].content).toBe('Hello World!');

      // But should also have metadata accessible
      expect(result.messages._axiomMeta).toEqual({
        id: PROMPT_ID,
        name: 'Test Prompt',
        slug: 'test-prompt',
        version: '1.0.0',
      });
    });

    it('should support all array methods on proxied messages', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'Test' },
      });

      const messages = result.messages;

      // Test array methods
      expect(messages.length).toBe(2);
      expect(messages.map((m) => m.role)).toEqual(['system', 'user']);
      expect(messages.filter((m) => m.role === 'user')).toHaveLength(1);
      expect(messages.find((m) => m.role === 'system')).toBeDefined();

      // Test array iteration
      let count = 0;
      for (const message of messages) {
        count++;
        expect(message).toHaveProperty('role');
        expect(message).toHaveProperty('content');
      }
      expect(count).toBe(2);

      // Test array access
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    it('should preserve original prompt properties', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'Test' },
      });

      expect(result.name).toBe('Test Prompt');
      expect(result.slug).toBe('test-prompt');

      expect(result.version).toBe('1.0.0');
      expect(result.arguments).toEqual(mockPrompt.arguments);
    });

    it('should work with minimal prompt metadata', async () => {
      const minimalPrompt: Prompt = {
        promptId: PROMPT_ID,
        name: 'Minimal',
        slug: 'minimal',
        version: '1.0',
        model: 'gpt-4',
        options: {},
        messages: [{ role: 'user', content: 'Hi' }],
        arguments: {},
      };

      const result = await parse(minimalPrompt, { context: {} });

      expect(result.messages._axiomMeta).toEqual({
        name: 'Minimal',
        slug: 'minimal',
        version: '1.0',
        id: PROMPT_ID,
      });
    });
  });

  describe('messages proxy behavior', () => {
    it('should handle symbol properties correctly', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'Test' },
      });

      // Should work with iterator symbols
      expect(typeof result.messages[Symbol.iterator]).toBe('function');
    });

    it('should be JSON serializable (without _axiomMeta)', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'Test' },
      });

      const serialized = JSON.stringify(result.messages);
      const parsed = JSON.parse(serialized);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].role).toBe('system');
      expect(parsed[1].content).toBe('Hello Test!');
      expect(parsed._axiomMeta).toBeUndefined();
    });
  });

  describe('providerOptions metadata attachment', () => {
    it('should attach metadata to the last message providerOptions', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'Test' },
      });

      // Check that metadata is NOT on the first message
      expect(result.messages[0].providerOptions?._axiomMeta).toBeUndefined();

      // Check that metadata IS on the last message
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage.providerOptions?._axiomMeta).toEqual({
        name: 'Test Prompt',
        slug: 'test-prompt',
        version: '1.0.0',
        id: PROMPT_ID,
      });
    });

    it('should attach metadata to the last message even with single message', async () => {
      const singleMessagePrompt: Prompt = {
        promptId: PROMPT_ID,
        name: 'Single Message',
        slug: 'single-message',
        version: '2.0.0',
        model: 'gpt-4',
        options: {},
        messages: [{ role: 'user', content: 'Hello' }],
        arguments: {},
      };

      const result = await parse(singleMessagePrompt, { context: {} });

      expect(result.messages[0].providerOptions?._axiomMeta).toEqual({
        name: 'Single Message',
        slug: 'single-message',
        version: '2.0.0',
        id: PROMPT_ID,
      });
    });

    it('should preserve existing providerOptions when adding metadata', async () => {
      const promptWithOptions: Prompt = {
        ...mockPrompt,
        messages: [
          { role: 'system', content: 'System message' },
          {
            role: 'user',
            content: 'User message',
            providerOptions: { customOption: 'value' },
          },
        ] as ParsedMessage[],
      };

      const result = await parse(promptWithOptions, {
        context: { name: 'Test' },
      });

      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage.providerOptions).toEqual({
        customOption: 'value',
        _axiomMeta: {
          name: 'Test Prompt',
          slug: 'test-prompt',
          version: '1.0.0',
          id: PROMPT_ID,
        },
      });
    });
  });
});
