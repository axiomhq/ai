import { Levenshtein } from 'autoevals'
import { Eval } from '@axiomhq/ai'

Eval("text-match-eval", {
  data: async () => {
    // The scenarios you wish to evaluate
    return [
      {
        input: "test",
        expected: "hi, test!",
      },
      {
        input: "foobar",
        expected: "hello, foobar!",
      }
    ];
  },

  task: async (input: string, expected: string) => {
    return `hi, ${input}!`
  },

  // Scorers determine if the response was acceptable - in this case we're using
  // a secondary LLM prompt to judge the response of the first.
  scorers: [Levenshtein],

  // The threshold required for the average score for this eval to pass. This will be
  // based on the scorers you've provided, and in the case of Factuality, we might be
  // ok with a 60% score (see the implementation for why).
  threshold: 1,

  // The timeout for each test. Defaults to 10s. You may need to increase this if your model
  // provider has high latency or you're using a large number of scorers.
  // timeout: 60000,

  // A check to determine if these tests should run. This is helpful to control tests so they only
  // in certain situations, for example if a model providers API key is defined.
  skipIf: () => true
})

Eval("support-ticket-system-eval", {
  data: async () => {
    // The scenarios you wish to evaluate
    return [
      {
        input: "islam",
        expected: "hi, islam!",
      },
      {
        input: "neil",
        expected: "hello, neil!",
      }
    ];
  },

  task: async (input: string, expected: string) => {
    return `hello, ${input}`
  },

  // Scorers determine if the response was acceptable - in this case we're using
  // a secondary LLM prompt to judge the response of the first.
  scorers: [Levenshtein],

  // The threshold required for the average score for this eval to pass. This will be
  // based on the scorers you've provided, and in the case of Factuality, we might be
  // ok with a 60% score (see the implementation for why).
  threshold: 0.6,

  // The timeout for each test. Defaults to 10s. You may need to increase this if your model
  // provider has high latency or you're using a large number of scorers.
  // timeout: 60000,

  // A check to determine if these tests should run. This is helpful to control tests so they only
  // in certain situations, for example if a model providers API key is defined.
  skipIf: () => true
})