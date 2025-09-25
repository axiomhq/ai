import { createOpenAI } from '@ai-sdk/openai';
import { axiomAIMiddleware } from 'axiom/ai';
import { gateway, wrapLanguageModel } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const model = gateway('openai/gpt-4o-mini');

export const gpt4oMini = wrapLanguageModel({
  model,
  middleware: [axiomAIMiddleware({ model })],
});
