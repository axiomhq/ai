/**
 * Online Evaluations — Minimal Example
 *
 * Demonstrates the simplest use of online evaluations: a single scorer
 * running inside a withSpan callback. The active span is auto-detected
 * and linked to the eval span.
 *
 * This example awaits onlineEval() because it's a short-lived script
 * that flushes telemetry before exiting. In a long-running server,
 * use `void onlineEval(...)` for fire-and-forget.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import { Scorer } from 'axiom/ai/evals/scorers';
import { onlineEval } from 'axiom/ai/evals/online';
import { initializeTelemetry, flushTelemetry } from './instrumentation';

initializeTelemetry();

const openai = createOpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
const model = wrapAISDKModel(openai('gpt-4o-mini'));

// Output-only scorer: checks if the response is a well-formed single sentence.
const formatScorer = Scorer('format', ({ output }: { output: string }) => {
  const trimmed = output.trim();
  return /[.!?]$/.test(trimmed) && !trimmed.includes('\n') && trimmed.length <= 200;
});

async function main() {
  const prompt = 'Tell me a fun fact about space in one sentence.';
  console.log(`Prompt: "${prompt}"`);

  const result = await withSpan({ capability: 'demo', step: 'generate-fact' }, async () => {
    const response = await generateText({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    // Await ensures the eval completes before flushTelemetry() shuts down.
    // In a long-running server, use `void onlineEval(...)` instead.
    await onlineEval(
      { capability: 'demo', step: 'generate-fact' },
      { output: response.text, scorers: [formatScorer] },
    );

    return response.text;
  });

  console.log(`Response: ${result}`);
  console.log('\nDone! Check your Axiom dashboard for evaluation results.');

  await flushTelemetry();
}

main().catch(console.error);
