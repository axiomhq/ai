import { describe, expect, it } from 'vitest';
import { parse } from '../../src/prompt/index';
import { z } from 'zod';
import type { Prompt } from '../../src/types';
import type { ParsedMessage } from '../../src/types/metadata';

describe('Prompt Metadata', () => {
  const mockPrompt: Prompt = {
    id: 'prompt-123',
    name: 'Test Prompt',
    slug: 'test-prompt',
    environment: 'development',
    version: '1.0.0',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello {{ name }}!' },
    ],
    arguments: {
      name: z.string(),
    },
  };

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
      expect((result.messages as any)._axiomMeta).toEqual({
        id: 'prompt-123',
        name: 'Test Prompt',
        slug: 'test-prompt',
        environment: 'development',
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

      expect(result.id).toBe('prompt-123');
      expect(result.name).toBe('Test Prompt');
      expect(result.slug).toBe('test-prompt');
      expect(result.environment).toBe('development');
      expect(result.version).toBe('1.0.0');
      expect(result.arguments).toEqual(mockPrompt.arguments);
    });

    it('should work with minimal prompt metadata', async () => {
      const minimalPrompt: Prompt = {
        id: 'min-123',
        name: 'Minimal',
        slug: 'minimal',
        environment: null,
        version: '1.0',
        messages: [{ role: 'user', content: 'Hi' }],
        arguments: {},
      };

      const result = await parse(minimalPrompt, { context: {} });

      expect((result.messages as any)._axiomMeta).toEqual({
        id: 'min-123',
        name: 'Minimal',
        slug: 'minimal',
        environment: null,
        version: '1.0',
      });
    });
  });

  describe('messages proxy behavior', () => {
    it('should return undefined for non-existent properties', async () => {
      const result = await parse(mockPrompt, {
        context: { name: 'Test' },
      });

      expect((result.messages as any).nonExistentProperty).toBeUndefined();
    });

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
        id: 'prompt-123',
        name: 'Test Prompt',
        slug: 'test-prompt',
        environment: 'development',
        version: '1.0.0',
      });
    });

    it('should attach metadata to the last message even with single message', async () => {
      const singleMessagePrompt: Prompt = {
        id: 'single-123',
        name: 'Single Message',
        slug: 'single-message',
        environment: 'staging',
        version: '2.0.0',
        messages: [{ role: 'user', content: 'Hello' }],
        arguments: {},
      };

      const result = await parse(singleMessagePrompt, { context: {} });

      expect(result.messages[0].providerOptions?._axiomMeta).toEqual({
        id: 'single-123',
        name: 'Single Message',
        slug: 'single-message',
        environment: 'staging',
        version: '2.0.0',
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
          id: 'prompt-123',
          name: 'Test Prompt',
          slug: 'test-prompt',
          environment: 'development',
          version: '1.0.0',
        },
      });
    });
  });
});
