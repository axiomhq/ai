'use server';

import { withSpan, wrapAISDKModel } from 'axiom/ai';
import type { FeedbackLinks } from 'axiom/ai/feedback';
import { generateText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Create and wrap the OpenAI model for automatic tracing
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const gpt4oMini = wrapAISDKModel(openaiProvider('gpt-4o-mini'));

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  links?: FeedbackLinks;
};

export async function chat(messages: Message[]): Promise<Message> {
  return await withSpan(
    { capability: 'chat-assistant', step: 'generate-response' },
    async (span) => {
      // Convert messages to AI SDK format
      const aiMessages: CoreMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call OpenAI with Axiom tracing via wrapped model
      const { text } = await generateText({
        model: gpt4oMini,
        system:
          'You are a helpful assistant. Keep responses concise and friendly.',
        messages: aiMessages,
      });

      // Create feedback links to connect user feedback to this trace
      const links: FeedbackLinks = {
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
        capability: 'chat-assistant',
      };

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: text,
        links,
      };
    }
  );
}
