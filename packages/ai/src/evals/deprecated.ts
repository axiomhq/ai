let scorerWarned = false;

export function warnScorerDeprecation(path: string): void {
  if (scorerWarned) return;
  scorerWarned = true;
  console.warn(
    `[axiom] Importing Scorer from '${path}' is deprecated. ` +
      `Use "import { Scorer } from 'axiom/ai/evals/scorers'" instead.`,
  );
}
