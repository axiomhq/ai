let scorerWarned = false;

export function warnScorerDeprecation(path: string): void {
  if (scorerWarned) return;
  scorerWarned = true;
  console.warn(
    `[axiom] Importing Scorer from '${path}' is deprecated. ` +
      `Use "import { Scorer } from 'axiom/ai/evals/scorers'" instead.`,
  );
}

let onlineEvalWarned = false;

export function warnOnlineEvalDeprecation(): void {
  if (onlineEvalWarned) return;
  onlineEvalWarned = true;
  console.warn(
    `[axiom] Importing onlineEval from 'axiom/ai' is deprecated. ` +
      `Use "import { onlineEval } from 'axiom/ai/evals/online'" instead.`,
  );
}
