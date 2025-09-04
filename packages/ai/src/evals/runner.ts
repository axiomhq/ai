import type { StepDefinition } from 'src/capabilities';
import { collect } from 'src/collector/collector.esbuild';
import type { EvalDefinition } from './eval.types';

// run an evaluation
export const runEvaluation = async (stepName: string) => {
  const registry = await collect('.');
  const step = registry.find((item) => item.type === 'step' && item.name === stepName);
  if (!step) {
    throw new Error(`failed to find step: ${stepName}`);
  }

  const evaluation = registry.find((item) => item.type === 'eval' && item.step === stepName);
  if (!evaluation) {
    throw new Error(`failed to find evaluation for step: ${stepName}`);
  }

  return await executeEvaluation(step.def as StepDefinition, evaluation.def as EvalDefinition);
};

const executeEvaluation = async (step: StepDefinition, evaluation: EvalDefinition) => {
  console.log(evaluation);
  const dataset = await evaluation.data();
  const result = [];

  // loop over dataset and run step
  let index = 0;
  for (let record of dataset) {
    const output = step.run({
      input: record.input,
      config: evaluation.config,
    });

    // run scorers on output
    const scores = await evaluation.scorers.map(async (scorer) => {
      return await scorer({ input: record.input, output, expected: record.expected });
    });

    result.push({
      index,
      scores,
    });

    index++;
  }

  return result;
};
