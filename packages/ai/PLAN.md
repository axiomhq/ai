# Eval Instrumentation Integration Plan

## Legend
- [ ] not started
- [~] in progress
- [x] complete

## Tasks

1. **Configuration & Types**
   - [x] Finalize `AxiomEvalsInstrumentationConfig` shape (function-only signature) and update config defaults / docs.
   - [x] Ensure config loader handles the new instrumentation function (resolve from user config, validate shape, surface helpful errors).

2. **Instrumentation Lifecycle**
   - [x] Refactor `evals/instrument.ts` to support dual-provider model (eval-only tracer vs user tracer), including async init + guard logic for worker reuse.
   - [x] Update `run-vitest.ts` and `eval.ts` to await the new async initialization and propagate errors cleanly.
   - [x] Guarantee eval spans always use the dedicated provider/exporter targeting `config.eval.dataset` and keep `service.name = 'axiom'`.

3. **User Hook Execution**
   - [x] Invoke the user-supplied instrumentation function (with resolved connection info) per worker; short-circuit when a provider is already registered.
   - [x] Capture returned OTEL primitives (provider/tracer) and integrate them into flush/shutdown paths without mutating user state unexpectedly.
   - [x] Add warnings when no user instrumentation is configured (so app spans stay uninstrumented under the CLI).

4. **Lifecycle Management**
   - [x] Extend `flush()`/`shutdown` logic to cover both the eval provider and any user-provided provider; handle errors with actionable messages.
   - [x] Respect debug mode by skipping both instrumentations while keeping the API surface consistent.

5. **Examples & Documentation**
   - [x] Update example projects (`examples/example-evals-nextjs`, etc.) to export the expected instrumentation function and show config usage.
   - [x] Document the new hook contract (README / comments) including expectations about idempotency and TypeScript support.

6. **Validation**
   - [x] Add/adjust tests (unit or integration) to confirm mixed-provider traces share the same trace ID and exporter configuration.
   - [x] Perform manual sanity run (or scripted smoke test) to ensure eval runs emit spans for both eval and app code with the correct service names.
