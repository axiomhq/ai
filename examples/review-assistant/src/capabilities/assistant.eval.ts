import { Eval, Scorer } from 'axiom/ai/evals';
import { pickFlags } from '@/app-scope';
import { assistant } from './assistant';
import { reviews } from '@/collections/reviews';
import { generateObject } from 'ai';
import { wrapAISDKModel } from 'axiom/ai';
import { openai } from '@/openai';
import { z } from 'zod';
import { ReviewCollection } from '@/schemas';

const scoringGuidelines = `
Score from 0.0 to 1.0 based on:
- Captures key sentiment and main points from the original review
- 20 words or less
- Clear and readable

Scoring bands:
1.0 = Perfect summary - accurate, concise, clear
0.8 = Good - minor issues with brevity or completeness
0.6 = Acceptable - misses some details or slightly unclear
0.4 = Poor - significant inaccuracies or far too long
0.2 = Very poor - mostly wrong or incomprehensible
0.0 = Complete failure`;

type AssistantOutput = Awaited<ReturnType<typeof assistant>>;

const sentimentAccuracy = Scorer(
  'sentiment-accuracy',
  ({ expected, output }: { expected: { sentiment: string }; output: AssistantOutput }) => {
    return expected.sentiment === output.sentiment;
  },
);

const summaryQuality = Scorer(
  'summary-quality',
  async ({
    input,
    expected,
    output,
  }: {
    input: { review: string };
    expected: { summary: string };
    output: AssistantOutput;
  }) => {
    const model = wrapAISDKModel(openai('gpt-4o-mini'));

    const { object: evaluation } = await generateObject({
      model,
      schema: z.object({
        score: z.number().min(0).max(1),
        reasoning: z.string(),
      }),
      prompt: `You are scoring a review summary.
Original review: \`${input.review}\`
Generated summary: \`${output.summary}\`
Reference summary: \`${expected.summary}\`
${scoringGuidelines}
Return only a number between 0.0 and 1.0.`,
    });

    return {
      score: evaluation.score,
      metadata: { reasoning: evaluation.reasoning },
    };
  },
);

Eval('review-assistant', {
  capability: 'review-assistant',
  configFlags: pickFlags('reviewAssistant'),
  data: reviews,
  task: async (task) => {
    return await assistant(task.input);
  },
  scorers: [sentimentAccuracy, summaryQuality],
});
