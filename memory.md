# Memory

The trials feature (spec.md) is complete. All phases implemented and verified:
- Aggregation functions (Mean, Median, PassAtK, PassHatK)
- Scorer factory with aggregation support
- Trial span execution loop
- Builder API with `withTrials()`
- Public exports via `@axiomhq/ai/evals`
- Tests and documentation

All checks pass: build, test, format:check, lint, typecheck.
