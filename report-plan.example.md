## Full configs
```
[Full config (baseline)]
--------------------------------------------------------
  behavior.strategy: dumb
  handleReturnRequest.policy: lenient
  ticketClassification.model: gpt-5
  ui.theme: light

[Full config (experiment)]
---------------------------------------------------------
  behavior.strategy: smart
  handleReturnRequest.policy: lenient
  ticketClassification.model: gpt-5 (overridden by CLI)
  ui.theme: light
```

## Config changes - always show
```
[Config changes]
---------------------------------------------------------
• myFeature.someAttribute:
  - 0.2
  + 1.5
• otherFeature.someOtherAttribute:
  - {foo: "bar", something: { somethingElse: "baz"}}
  + {foo: "bar", something: { somethingElse: "qux"}}
• nextFeature.newThing:
  - undefined
  + foo
• anotherFeature.gotRemoved:
  - foo
  + undefined
```

## Vitest output - always show (but wipe at the end...)
```
> pnpm eval

 RUN  v3.2.4 /path/to/project

[STARTING] feature-example (test/feature.eval.ts)
 ✓ case 0 (6ms)
 ✓ case 1 (6ms)
 ✓ case 2 (6ms)
 ✓ case 3 (6ms)
 ✓ case 4 (6ms)

[STARTING] Spam classification (src/lib/.../ticket-classification.eval.ts)
 ✓ case 0 (4473ms)
 ✓ case 1 (4473ms)
 ✓ case 2 (4473ms)
 ✓ case 3 (4473ms)
 ✓ case 4 (4473ms)

... any console.logs would appear here ...
```
(At the very end, the screen is cleared and the following is printed)

## Detailed report - print everything for now
```
Ticket classification
├─ File: src/foo/bar/ticket-classification.eval.ts
├─ Duration: 6.49s
├─ Baseline: Ticket_classification-o2lnaywuvw (2025-09-29, 11:00 UTC)
└─ Results:
   • C-00:
     ├─ Spam classification: 1.0000 → 1.0000 (+0.0000)
     └─ Jaccard Response:    0.1190 → 0.1351 (+0.0161)
   • C-01:
     ⚠ Out-of-scope flag: behavior.strategy (picked: 'ui')
       at: myFn (/Users/cje/dev/axiom/ai/examples/example-evals-nextjs/test/feature.eval.ts:5:20)
     ├─ Spam classification: 1.0000 → 1.0000 (+0.0000)
     └─ Jaccard Response:    0.1190 → 0.1351 (+0.0161)
   • C-02:
     ├─ Spam classification: 1.0000 → 1.0000 (+0.0000)
     └─ Jaccard Response:    0.1190 → 0.1351 (+0.0161)
   • C-03:
     ├─ Spam classification: 1.0000 → 1.0000 (+0.0000)
     └─ Jaccard Response:    0.1190 → 0.1351 (+0.0161)

Other suite
├─ File: src/foo/bar/other-suite.eval.ts
├─ Duration: 6.49s
├─ Baseline: (none)
└─ Results:
   • C-00:
     ├─ Spam classification: 1.0000
     └─ Jaccard Response:    0.1190
   • C-01:
     ├─ Spam classification: 1.0000
     └─ Jaccard Response:    0.1190
   • C-02:
     ├─ Spam classification: 1.0000
     └─ Jaccard Response:    0.1190
   • C-03:
     ├─ Spam classification: 1.0000
     └─ Jaccard Response:    0.1190
```

## Summary - always show
```
Summary
├─ 2 suites | 8 cases | 16 scores evaluated
|
├─ Ticket Classification
|  ├─ Spam classification: 1.0000 → 1.0000 (+0.0000)
|  └─ Jaccard Response:    0.1190 → 0.1351 (+0.0161)
|
└─ Other Eval
   ├─ Foo scorer:          1.0000 → 1.0000 (+0.0000)
   └─ Bar scorer:          0.1190 → 0.1351 (+0.0161)

View full report:
https://app.axiom.co/evaluations/<???>/27dfa5bb82057689ff4ec6b5d49f7d53
```
