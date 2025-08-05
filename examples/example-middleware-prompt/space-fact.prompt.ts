import type { experimental_Prompt as Prompt } from 'axiom';
import { experimental_Type as Type } from 'axiom';

const spaceFactPrompt = {
  name: 'Space Fact',
  slug: 'space-fact',
  description: 'A prompt to generate a fun fact about space',
  messages: [
    {
      role: 'user',
      content: 'Tell me a fun fact about space in one sentence.',
    },
    {
      role: 'system',
      content: '{{ fewShotExamples }}',
    },
  ],
  version: 'v1.0.0',
  arguments: {
    fewShotExamples: Type.Array(
      Type.String({ description: 'A few shot example of a fun fact about space' }),
    ),
  },
  model: 'gpt-4o-mini',
  options: {},
} satisfies Prompt;

export default spaceFactPrompt;
