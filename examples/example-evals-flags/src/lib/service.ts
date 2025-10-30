import { generateText, tool, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { wrapAISDKModel, wrapTools, withSpan } from 'axiom/ai';
import type { ListingInput, ListingOutput } from './schemas';
import { checkProhibitedItems } from './tools/check-prohibited-items';

const SYSTEM_PROMPT = `You are a writer for Acme, an online marketplace where users buy and sell products. Your job is to create a listing for the product described by the seller in a style consistent with the Acme brand voice. Before writing, check if the item is prohibited using the checkProhibitedItems tool.`;

export async function generateListing(
  input: ListingInput,
): Promise<{ output: ListingOutput; traceId: string }> {
  let traceId = '';

  const result = await withSpan(
    { capability: 'listing-writer', step: 'generate' },
    async (span) => {
      traceId = span.spanContext().traceId;

      const response = await generateText({
        model: wrapAISDKModel(openai('gpt-4o-mini')),
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: input.seller_brief,
          },
        ],
        stopWhen: stepCountIs(3),
        tools: wrapTools({
          checkProhibitedItems: tool({
            description: 'Check if a product is on the prohibited items list',
            inputSchema: z.object({
              productDescription: z.string().describe('The product description to check'),
            }),
            execute: checkProhibitedItems,
          }),
        }),
      });

      return { product_description: response.text };
    },
  );

  return { output: result, traceId };
}
