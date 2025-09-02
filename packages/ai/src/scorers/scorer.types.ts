export type Score = {
  name: string;
  score: number;
  metadata?: Record<string, any>;
};

export type Scorer = (args: { input?: any; output: any; expected?: any }) => Score | Promise<Score>;
