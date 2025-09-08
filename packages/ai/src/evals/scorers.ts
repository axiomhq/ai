export type Score = {
  name: string;
  score: number | null;
  metadata?: Record<string, any>;
};

// Factory function for creating scorers with better ergonomics
export { createScorer } from './scorer.factory';
export { createScorer as defineScorer } from './scorer.factory';

export type Scorer<TInput, TExpected, TOutput> = (args: {
  input: TInput;
  expected: TExpected;
  output: TOutput;
}) => Score | Promise<Score>;
