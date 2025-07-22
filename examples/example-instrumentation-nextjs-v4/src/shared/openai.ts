import { createOpenAI } from '@ai-sdk/openai';
import { wrapAISDKModel } from '@axiomhq/ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  compatibility: 'strict',
});

export const gpt4oMini = wrapAISDKModel(openai('gpt-4o-mini'));
