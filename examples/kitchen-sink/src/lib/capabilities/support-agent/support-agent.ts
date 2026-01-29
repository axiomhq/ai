import { flag } from '@/lib/app-scope';
import { openai } from '@/lib/openai';
import { startActiveSpan } from '@/lib/utilities/start-active-span';
import { generateText, ModelMessage, stepCountIs, tool } from 'ai';
import { withSpan, wrapAISDKModel, wrapTools } from 'axiom/ai';
import type { FeedbackLinks } from 'axiom/ai/feedback';
import z from 'zod';
import { categorizeMessage, MessageCategory } from './categorize-messages';
import { extractTicketInfo, ExtractTicketInfoResult } from './extract-ticket-info';
import { veryBadRAG } from './retrieve-from-knowledge-base';

export const SUPPORT_AGENT_CAPABILITY_NAME = 'support-agent';

type ToolCalls = Awaited<ReturnType<typeof generateText>>['toolCalls'];

export type SupportAgentResult = {
  category: MessageCategory;
  answer: ModelMessage | null; // null when we short-circuit (spam, etc)
  toolCalls?: ToolCalls;
  retrieval?: {
    status: string;
    documents: { id: string; title: string; body: string }[];
  };
  ticket: ExtractTicketInfoResult | null;
  links?: FeedbackLinks;
};

const supportAgentTools = wrapTools({
  searchKnowledgeBase: tool({
    description:
      'Search the internal knowledge base for information about Pets.ai products, policies, and troubleshooting.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
    }),
    execute: async ({ query }: { query: string }) => {
      const res = await veryBadRAG(query);
      return res.documents.map((d) => `[${d.title}] ${d.body}`).join('\n\n');
    },
  }),
});

export const runSupportAgent = async (
  messages: ModelMessage[],
  conversationId?: string,
): Promise<SupportAgentResult> => {
  return startActiveSpan(SUPPORT_AGENT_CAPABILITY_NAME, null, async (span) => {
    const links: FeedbackLinks = {
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      capability: SUPPORT_AGENT_CAPABILITY_NAME,
      conversationId,
    };

    // 1. Categorize
    const category = await categorizeMessage(messages, conversationId);

    // 2. Hard routing / early exits
    if (category === 'spam') {
      return {
        category,
        answer: {
          role: 'assistant',
          content: 'This channel is for support requests only. Your message looks like spam.',
        },
        ticket: null,
        links,
      };
    }

    if (category === 'wrong_company') {
      return {
        category,
        answer: {
          role: 'assistant',
          content:
            "It looks like you're trying to reach a different company. This is Pets.ai support.",
        },
        ticket: null,
        links,
      };
    }

    // 3. Always extract ticket info
    // We do this in parallel with generating the answer so the UI updates
    const ticketPromise = extractTicketInfo(messages, conversationId);

    // 4. Generate answer using tools (RAG)
    // We pass the result of the ticket extraction to the prompt if it's ready,
    // but since we want to run them in parallel, we'll just let the model figure out what's missing
    // based on the conversation history.
    const answerPromise = generateSupportAnswer(messages, conversationId);

    const [ticket, answerResult] = await Promise.all([ticketPromise, answerPromise]);

    // If the ticket is incomplete, we might want to ensure the model asked for the missing info.
    // But for this simple tool-use demo, relying on the model's system prompt is usually enough.

    return {
      category,
      answer: answerResult.message,
      toolCalls: answerResult.toolCalls,
      // Retrieval status is now harder to expose since it's hidden inside the tool call.
      // For this demo, we'll omit explicit retrieval status in the top-level result
      // or we could capture it via a side-effect if we really needed to show it in the UI.
      // For now, let's just return undefined or empty for back-compat.
      retrieval: undefined,
      ticket,
      links: answerResult.links,
    };
  });
};

async function generateSupportAnswer(
  messages: ModelMessage[],
  conversationId?: string,
): Promise<{ message: ModelMessage; toolCalls: ToolCalls; links: FeedbackLinks }> {
  const modelName = flag('supportAgent.main.model');
  const model = wrapAISDKModel(openai(modelName));

  return await withSpan(
    { capability: SUPPORT_AGENT_CAPABILITY_NAME, step: 'generate-answer', conversationId },
    async (span) => {
      const { text, toolCalls } = await generateText({
        model,
        tools: supportAgentTools,
        stopWhen: stepCountIs(10),
        messages: [
          {
            role: 'system',
            content: `
  You are a support assistant for Pets.ai.
  
  Your goal is to help the user resolve their issue.
  
  1. Analyze the conversation.
  2. If you need information to answer the user's question, use the 'searchKnowledgeBase' tool.
  3. If the user is reporting an issue but hasn't provided enough details (like which product, what the error is), ASK for those details.
  4. Be helpful, concise, and professional.
  
  Do not make up information. If the knowledge base doesn't have the answer, say so.
        `.trim(),
          },
          ...messages,
        ],
      });

      const traceId = span.spanContext().traceId;
      const spanId = span.spanContext().spanId;

      return {
        message: { role: 'assistant', content: text },
        toolCalls,
        links: { traceId, spanId, capability: SUPPORT_AGENT_CAPABILITY_NAME, conversationId },
      };
    },
  );
}
