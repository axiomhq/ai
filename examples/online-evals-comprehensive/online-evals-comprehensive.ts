/**
 * Online Evaluations — Comprehensive Example
 *
 * Demonstrates all onlineEval patterns. Each eval span links to its
 * originating generation span via an OTel span link — the link is the
 * stable relationship, parent/child hierarchy is just a consequence of
 * where onlineEval() is called.
 *
 * Because this is a short-lived script that flushes telemetry before
 * exiting, we collect eval promises and drain them before shutdown.
 * In a long-running server, use `void onlineEval(...)` fire-and-forget
 * instead — there's no shutdown race.
 *
 * Patterns shown:
 * 1. Inside withSpan (recommended) — active span auto-detected and linked
 * 2. Deferred — outside withSpan with explicit link
 * 3. Standalone — no withSpan context, manual link
 * 4. Awaitable — await onlineEval() inline for short-lived processes
 */

import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { type SpanContext } from '@opentelemetry/api';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import { Scorer } from 'axiom/ai/evals/scorers';
import { onlineEval } from 'axiom/ai/evals/online';
import { z } from 'zod';
import { initializeTelemetry, flushTelemetry } from './instrumentation';

initializeTelemetry();

const openai = createOpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
const model = wrapAISDKModel(openai('gpt-4o-mini'));

// =============================================================================
// Scorers
// =============================================================================

// Output-only scorer: checks response format. Cheap — fine at 100%.
const formatScorer = Scorer('format', ({ output }: { output: string }) => {
  const trimmed = output.trim();
  return /[.!?]$/.test(trimmed) && !trimmed.includes('\n') && trimmed.length <= 200;
});

// Input+output LLM judge: evaluates if the response answers the question.
// Expensive — use a lower sampling rate in production.
const judgeModel = wrapAISDKModel(openai('gpt-4o-mini'));
const relevanceScorer = Scorer(
  'relevance',
  async ({ input, output }: { input: string; output: string }) => {
    const result = await generateObject({
      model: judgeModel,
      schema: z.object({
        relevant: z.boolean().describe('Whether the response answers the question'),
      }),
      system: 'You evaluate if an AI response answers the user question.',
      prompt: `Question: ${input}\n\nResponse: ${output}`,
    });
    return result.object.relevant;
  },
);

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('Online Evaluations — Comprehensive Example');
  console.log('============================================\n');

  // Collect eval promises so we can drain them before flushing telemetry.
  // In a long-running server, you'd use `void onlineEval(...)` instead.
  const pendingEvals: Promise<unknown>[] = [];

  // ---------------------------------------------------------------------------
  // Pattern 1: Inside withSpan (recommended default)
  // ---------------------------------------------------------------------------
  // Active span is auto-detected and linked. The eval span is naturally a
  // child of the withSpan span.
  const prompt1 = 'Tell me a fun fact about space in one sentence.';
  console.log('Pattern 1: Inside withSpan');
  console.log(`Prompt: "${prompt1}"`);

  const result1 = await withSpan({ capability: 'demo', step: 'generate-fact' }, async () => {
    const response = await generateText({
      model,
      messages: [{ role: 'user', content: prompt1 }],
    });

    // In a server: `void onlineEval(...)` — fire-and-forget is fine.
    // Here we collect the promise because the script exits after flush.
    pendingEvals.push(
      onlineEval(
        'generate-fact',
        { capability: 'demo', step: 'generate-fact' },
        { output: response.text, scorers: [formatScorer] },
      ),
    );

    return response.text;
  });

  console.log(`Response: ${result1}\n`);

  // ---------------------------------------------------------------------------
  // Pattern 2: Deferred — outside withSpan with explicit link
  // ---------------------------------------------------------------------------
  // Capture span.spanContext() inside the callback, then call onlineEval()
  // after withSpan returns. The eval span is root-level with a link back to
  // the originating span.
  const prompt2 = 'What is the capital of France?';
  console.log('Pattern 2: Deferred with explicit link');
  console.log(`Prompt: "${prompt2}"`);

  let originCtx: SpanContext;
  const result2 = await withSpan({ capability: 'demo', step: 'answer-question' }, async (span) => {
    originCtx = span.spanContext();

    const response = await generateText({
      model,
      messages: [{ role: 'user', content: prompt2 }],
    });
    return response.text;
  });

  // Called outside withSpan — explicit link connects eval to originating span.
  // LLM judge at 50% sampling rate — tune down for expensive scorers in production.
  pendingEvals.push(
    onlineEval(
      'answer-question',
      { capability: 'demo', step: 'answer-question', links: originCtx! },
      {
        input: prompt2,
        output: result2,
        scorers: [{ scorer: relevanceScorer, sampling: 0.5 }],
      },
    ),
  );

  console.log(`Response: ${result2}\n`);

  // ---------------------------------------------------------------------------
  // Pattern 3: Standalone — no withSpan context, manual link
  // ---------------------------------------------------------------------------
  // Use a previously stored SpanContext (e.g., from a database or message queue)
  // to link an eval span to an originating span that ran in a different process
  // or at a different time.
  const prompt3 = 'Name a famous scientist.';
  console.log('Pattern 3: Standalone with manual link');
  console.log(`Prompt: "${prompt3}"`);

  let storedCtx: SpanContext;
  const result3 = await withSpan({ capability: 'demo', step: 'name-scientist' }, async (span) => {
    storedCtx = span.spanContext();

    const response = await generateText({
      model,
      messages: [{ role: 'user', content: prompt3 }],
    });
    return response.text;
  });

  console.log(`Response: ${result3}`);

  // Simulate a later evaluation using a stored SpanContext.
  // No active withSpan context here — the link is the only connection.
  pendingEvals.push(
    onlineEval(
      'name-scientist',
      { capability: 'demo', step: 'name-scientist', links: storedCtx! },
      { output: result3, scorers: [formatScorer] },
    ),
  );

  console.log();

  // ---------------------------------------------------------------------------
  // Pattern 4: Awaitable — for short-lived processes
  // ---------------------------------------------------------------------------
  // For CLI tools or serverless functions, await the eval inline to ensure
  // spans are created before flushing telemetry.
  const prompt4 = 'What color is the sky?';
  console.log('Pattern 4: Awaitable (for CLI / serverless)');
  console.log(`Prompt: "${prompt4}"`);

  const result4 = await withSpan({ capability: 'demo', step: 'describe-sky' }, async () => {
    const response = await generateText({
      model,
      messages: [{ role: 'user', content: prompt4 }],
    });
    return response.text;
  });

  // Await ensures eval completes before we flush.
  await onlineEval(
    'describe-sky',
    { capability: 'demo', step: 'describe-sky' },
    { output: result4, scorers: [formatScorer] },
  );

  console.log(`Response: ${result4}\n`);

  // Drain any outstanding evals before shutting down the trace provider.
  await Promise.allSettled(pendingEvals);

  console.log('Done! Check your Axiom dashboard for evaluation results.');

  await flushTelemetry();
}

main().catch(console.error);
