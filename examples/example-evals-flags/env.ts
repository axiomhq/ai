import { z } from 'zod';

const envSchema = z.object({
  AXIOM_URL: z.string(),
  AXIOM_TOKEN: z.string(),
  AXIOM_DATASET: z.string(),
  AXIOM_EVAL_DATASET: z.string(),
  OPENAI_API_KEY: z.string(),
});

try {
  envSchema.parse(process.env);
} catch (error) {
  console.error(error);
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
