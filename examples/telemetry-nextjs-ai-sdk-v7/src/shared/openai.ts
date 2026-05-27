import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const gpt4oMini = openai('gpt-4o-mini');
