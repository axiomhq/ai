import { createOpenAI } from '@ai-sdk/openai';
import { axiomAIMiddleware } from '@axiomhq/ai';
import { wrapLanguageModel } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const gpt4oMiniModel = openai('gpt-4o-mini');
const o3MiniModel = openai('o3-mini');

export const gpt4oMini = wrapLanguageModel({
  model: gpt4oMiniModel,
  middleware: [axiomAIMiddleware({ model: gpt4oMiniModel })],
});

export const o3Mini = wrapLanguageModel({
  model: o3MiniModel,
  middleware: [axiomAIMiddleware({ model: o3MiniModel })],
});
