import { flag } from '@/lib/app-scope';
import { openai } from '@/lib/openai';
import { generateObject, ModelMessage } from 'ai';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import z from 'zod';

const intents = [
  'billing_dispute',
  'technical_issue',
  'account_access',
  'feature_request',
  'other',
  'unknown',
] as const;
const products = ['mobile_app', 'dashboard', 'api', 'unknown'] as const;

export const ticketInfoSchema = z.object({
  intent: z.enum(intents).nullable().describe('The primary intent of the user'),
  product: z
    .enum(products)
    .nullable()
    .describe('The specific product or service mentioned (e.g., "mobile app", "dashboard", "api")'),
});

export type TicketInfo = z.infer<typeof ticketInfoSchema>;

export type ExtractTicketInfoResult = {
  ticketInfo: TicketInfo;
  status: {
    isComplete: boolean;
    missingFields: string[];
  };
};

export const extractTicketInfo = async (
  messages: ModelMessage[],
): Promise<ExtractTicketInfoResult> => {
  const modelName = flag('supportAgent.extractTicketInfo.model');
  const model = wrapAISDKModel(openai(modelName));

  const llmRes = await withSpan(
    { capability: 'support_agent', step: 'extract_ticket_info' },
    async () => {
      return await generateObject({
        model,
        schema: ticketInfoSchema,
        system: `You are a support ticket triage agent. 
      Analyze the conversation and extract the ticket information. 
      We need:
      - product (possible values: ${products.join(', ')})
      - intent (possible values: ${intents.join(', ')})
      If you are uncertain about the product or intent, use "unknown".`,
        messages,
      });
    },
  );

  const hasIntent = Boolean(llmRes.object.intent) && llmRes.object.intent !== 'unknown';
  const hasProduct = Boolean(llmRes.object.product) && llmRes.object.product !== 'unknown';

  const isComplete = hasIntent && hasProduct;
  const missingFields = [...(hasIntent ? [] : ['intent']), ...(hasProduct ? [] : ['product'])];

  const result = {
    ticketInfo: llmRes.object,
    status: { isComplete, missingFields },
  };

  return result;
};
