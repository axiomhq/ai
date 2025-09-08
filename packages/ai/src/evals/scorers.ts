export type Score = {
  name: string;
  score: number | null;
  metadata?: Record<string, any>;
};

export type Scorer<
  TInput = any,
  TExpected = any,
  TOutput = any
> = (args: {
  input: TInput;
  output: TOutput;
  expected: TExpected;
}) => Score | Promise<Score>;
