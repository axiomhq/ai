/**
 * Entry point for aggregation functions.
 * Re-exports all aggregation types and functions for use with `axiom/ai/evals/aggregations`.
 */
export {
  Mean,
  Median,
  PassAtK,
  PassHatK,
  AtLeastOneTrialPasses,
  AllTrialsPass,
  type Aggregation,
} from './aggregations';
