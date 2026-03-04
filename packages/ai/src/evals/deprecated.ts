let onlineEvalWarned = false;

export function warnOnlineEvalDeprecation(): void {
  if (onlineEvalWarned) return;
  onlineEvalWarned = true;
  console.warn(
    `[axiom] Importing onlineEval from 'axiom/ai' is deprecated. ` +
      `Use "import { onlineEval } from 'axiom/ai/evals/online'" instead.`,
  );
}
