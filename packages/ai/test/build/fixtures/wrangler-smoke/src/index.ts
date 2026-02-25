import { withSpan, axiomAIMiddleware } from 'axiom/ai';

export default {
  async fetch() {
    const result = await withSpan({ capability: 'chat', step: 'generate' }, async () => 'ok');
    return new Response(
      JSON.stringify({
        withSpanType: typeof withSpan,
        middlewareType: typeof axiomAIMiddleware,
        result,
      }),
      { headers: { 'content-type': 'application/json' } },
    );
  },
};
