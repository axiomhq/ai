import { generateText } from 'ai';
import { flag } from './app-scope';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parrotOrAntiParrot(input: string) {
  // in your task function you would usually call code from your application

  const strategy = flag('minimalDemo.strategy');
  const modelName = flag('minimalDemo.model');

  const model = wrapAISDKModel(openai(modelName));

  let prompt =
    strategy === 'smart'
      ? `You are a parrot. Repeat back the following word: ${input}. `
      : `You are an anti-parrot. Repeat back the opposite of the following word: ${input}. `;

  const beThorough = flag('minimalDemo.beThorough');
  if (beThorough) {
    prompt +=
      'Be sure to reply in all lower-case, without any punctuation, EXACTLY the same as the input word you were given.';
  }

  const res = await withSpan({ capability: 'example', step: 'parrot' }, async () => {
    return generateText({
      model,
      prompt,
    });
  });

  return res.text;
}
