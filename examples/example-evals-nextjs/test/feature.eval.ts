import { experimental_Eval as Eval } from 'axiom/ai/evals';
import { flag, fact, getEvalContext } from 'axiom/ai';

// Define types for this example
type Score = { name: string; score: number };
type Scorer = ({ output, expected }: { output: any; expected: any }) => Score;

const myFn = async (input: string) => {
  // Use flags to configure the behavior
  const temperature = flag('temperature', 0.7);
  const model = flag('model', 'gpt-3.5-turbo');
  const useSystemPrompt = flag('use-system-prompt', true);
  const maxTokens = flag('max-tokens', 150);

  // Record facts about the input
  fact('prompt-length', input.length);
  fact('query-complexity', input.includes('|') && input.includes('where') ? 'complex' : 'simple');

  // Debug print current configuration (showing how flags are used)
  console.log('🔍 Current eval configuration:', {
    temperature,
    model,
    useSystemPrompt,
    maxTokens,
    inputLength: input.length,
    notes:
      'These values come from flag() calls with inline defaults. They can be overridden via CLI or builders.',
  });

  const startTime = Date.now();

  // Simulate processing the input with the configured parameters
  const _systemPrompt = useSystemPrompt
    ? 'You are a customer support agent that answers questions about log queries'
    : '';

  // Mock response based on input (in real scenario, this would call LLM with _systemPrompt, temperature, maxTokens)
  let response: string;
  if (input.includes('nginx') && input.includes('500')) {
    response = 'Nginx 5xx Errors';
  } else if (input.includes('error') || input.includes('>=')) {
    response = 'Error Analysis Query';
  } else {
    response = 'Standard Log Query';
  }

  // Record performance facts
  const responseTime = Date.now() - startTime;
  fact('response-time', responseTime);
  fact('tokens-used', Math.floor(response.length / 4)); // rough estimation

  return response;
};

// an example of a custom scorer
const exactMatchScorer: Scorer = ({ output, expected }) => {
  return {
    name: 'exact-match',
    score: output == expected ? 1 : 0,
  };
};

Eval('feature-example', {
  data: () => [
    {
      input: "['nginx-access-logs'] | where status >= 500",
      expected: 'Nginx 5xx Errors',
    },
  ],
  model: 'o3',
  params: {
    temperature: 0.6,
  },
  prompt: [
    {
      role: 'system',
      content: 'You are a customer support agent that answers questions about log queries',
    },
  ],
  task: async ({ input }) => {
    // Use the myFn function which demonstrates flag and fact usage
    const r = await myFn(input);
    const c = getEvalContext();
    console.log('tktk context', c);
    return r;
  },
  scorers: [exactMatchScorer as any], // TODO: BEFORE MERGE - idk
  metadata: {
    description:
      'Demonstrates flag and fact usage in eval tasks - flags configure behavior, facts track metrics',
  },
});
