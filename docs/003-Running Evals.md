# Running Evals

Our SDK uses vitest internally to run the evals. Our cli detects *.eval.ts files and register them to vitest then run the tests. 

To use, users would import our `Eval()` function and define their eval attributes, along with 
scorers and threshold. 


Terminology:
- A run is when users call the cli to run one or more evals. A run contains one or more experiments.
- An experiment is the outcome of running on eval.
- A case is a single dataset instance of input/expected, which runs inside an experiment


example:

```ts
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
  skipIf: () => false
})
```

TODO:

- [ x ] Setup the cli to run evals locally
- [ x ] Collect traces inside eval experiments and send them to Axiom
- [ x ] Review the gen_ai.eval attributes and ensure they follow the spec
- [ x ] Review the eval.experiment attributes and ensure they follow the spec
- [ x ] Review the eval.case attributes and ensure they follow the spec
- [   ] Handle scorers that return multiple scores and set score.scorer attribute
- [   ] Handle inputs/outputs that are not of type string
- [   ] Implement trials
- [   ] Decide how to handle thresholds for each score, or maybe as an average score for the whole experiment?
- [   ] Capture assertions?
- [   ] Test with an llm call inside task
- [   ] Support other scorers (currently auto-evals only)
- [   ] Use remote datasets?
- [   ] Load Prompt from Axiom
 
Questions:

- Where to get values for run name, type and tags? Does the user pass these when they run the cli, something like:

```
axiom run some-test.eval.ts --run text_match_1 --tags expirement
```

- What is an expirement compared to a run? Do users have to indicate this is an expirement? 
if yes, where do the id, name, version and group come from?

An experiment is the outcome of running an `Eval()` and its used to categorize what a user runs. 
It contains information like user id and the environment where the experiment is running.

- What is a dataset.split value mean?

- How would we capture assertions and report them?

- How do users pass case metadata?

- Do we need the prompt sent to Axiom?
When users use our functions like `loadPrompt()` and this will create a span as part of the task span.

- What is `eval.score.unit` ? Where to get that value from?
