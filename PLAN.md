# Implementation Plan: Context/Metadata System for AI Evaluations

## Overview
Build a context/metadata system similar to Weights & Biases Weave that tracks the "ingredients" (flags and facts) that lead to AI evaluation outcomes. Uses OpenTelemetry Context + Baggage for storage while preventing cross-service propagation.

## Phase 1: Core Infrastructure
**Goal:** Implement basic flag/fact storage and context management

### Implementation Tasks
1. **Create core storage mechanism**
   - `src/evals/context/storage.ts` - OTel Context + Baggage wrapper
   - Private context key for experiment spans: `EXPERIMENT_SPAN_KEY`
   - `getEvalContext<Flags, Facts>()` function
   - `setEvalContext(flags, facts)` function

2. **Create basic flag/fact primitives**
   - `src/context.ts` - `flag<V>(key: string, defaultValue: V): V` function  
   - `src/context.ts` - `fact<V>(key: string, value: V): void` function
   - `src/context.ts` - `overrideFlags(partial)` function

3. **Environment compatibility layer**
   - Ensure OTel Context API works across Node/Browser/CF Workers
   - No custom AsyncLocalStorage usage - rely on OTel's pluggable context manager

### Validation Steps
- [ ] Unit tests: flag storage/retrieval works in isolated contexts
- [ ] Unit tests: fact recording creates proper span events  
- [ ] Unit tests: overrideFlags merges correctly with defaults
- [ ] Cross-environment tests: Node, jsdom (browser simulation), and Miniflare (CF Workers)
- [ ] Verify no HTTP propagation: start experiment span, make HTTP call, check headers don't contain experiment trace

**Acceptance Criteria:**
```ts
// Should work
const temp = flag('temperature', 0.7);  // returns 0.7 (default)
fact('modelName', 'gpt-4o');           // recorded as span event
overrideFlags({ temperature: 0.9 });   
const temp2 = flag('temperature', 0.7); // returns 0.9 (overridden)
```

---

## Phase 2: Type-Safe APIs
**Goal:** Implement type-safe experiment function with optional fact typing

### Implementation Tasks
1. **Create registry interfaces template**
   - `src/evals/context/registry.d.ts` - Template for `FlagRegistry` and `FactRegistry`
   - Document how users should declare their own registries

2. **Implement experiment function**  
   - `src/evals/experiment.ts`
   - Single generic: `experiment<Flags, Facts = any>()`  
   - `ExperimentContext<Flags, Facts>` interface with typed `fact()` method

3. **Private span management**
   - Experiment spans stored in `EXPERIMENT_SPAN_KEY`, never made current (prevents HTTP propagation)
   - Automatic span lifecycle (start/end) with proper error handling  
   - Facts recorded as span events during execution, consolidated as JSON attribute on span end

### Validation Steps
- [ ] TypeScript compilation tests with various registry combinations
- [ ] Unit tests: experiment context provides correct flag values
- [ ] Unit tests: typed facts enforce correct key/value types when Facts generic provided
- [ ] Unit tests: untyped facts accept any key/value when Facts generic omitted
- [ ] Integration tests: nested experiment calls maintain separate contexts
- [ ] Verify private spans don't appear in standard trace propagation

**Acceptance Criteria:**
```ts
// Type-safe usage
interface MyFlags { temperature: number; model: string; }
interface MyFacts { duration: number; }

experiment<MyFlags, MyFacts>(({ flags, fact }) => {
  const temp = flags.temperature;  // typed as number
  fact('duration', 123);           // typed - must be number
  // fact('typo', 123);            // TS error
});

// Loose typing (Facts defaults to any)
experiment<MyFlags>(({ flags, fact }) => {
  fact('anything', 'any value');   // no TS error
});
```

---

## Phase 3: CLI Integration
**Goal:** Support flag overrides via CLI arguments and config files

### Implementation Tasks
1. **CLI argument parsing**
   - Extend existing eval CLI in `src/cli/` to support `--flag.key=value` syntax
   - Support JSON config files: `--flags-config=path/to/flags.json`
   - Validate flag values against expected types where possible

2. **Integration with eval runner**
   - Call `overrideFlags()` before Vitest execution starts
   - Ensure flag context is established at eval suite root
   - Document CLI usage patterns

3. **Config file support**
   - JSON/TOML support for reproducible experiment runs
   - Schema validation for config files
   - Environment variable substitution in config files

### Validation Steps
- [ ] CLI tests: `--flag.temperature=0.9` correctly overrides default
- [ ] CLI tests: `--flags-config=file.json` loads and applies flags
- [ ] CLI tests: Invalid flag values produce helpful error messages
- [ ] Integration tests: CLI flags are available in experiment context
- [ ] Integration tests: Multiple flag sources (CLI + config + defaults) merge correctly
- [ ] Manual testing: Run eval with various flag combinations

**Acceptance Criteria:**
```bash
# CLI usage should work
axiom eval my-eval --flag.temperature=0.9 --flag.model=gpt-4o-mini
axiom eval my-eval --flags-config=experiments/high-temp.json
```

---

## Phase 4: Eval System Integration
**Goal:** Integrate with existing `Eval()` function and span reporting

### Implementation Tasks
1. **Extend EvalParams interface**
   - Add optional `flags?: Partial<FlagRegistry>` field
   - Add optional `facts?: Partial<FactRegistry>` field for pre-seeded facts
   - Maintain backward compatibility

2. **Integration with eval spans**
   - Store final flag/fact state on root eval span as attributes
   - Ensure experiment contexts inherit from eval root context
   - Export flag/fact data in eval reports

3. **Baseline comparison support**
   - Include flag/fact data in baseline records for comparison
   - Support "what changed" analysis between eval runs
   - Flag/fact diff visualization in reports

4. **Reporter updates**
   - Include flag/fact summary in `EvalCaseReport`
   - Add flag/fact metadata to exported traces
   - Support filtering eval runs by flag values

### Validation Steps
- [ ] Integration tests: Flags set in EvalParams are available in task functions
- [ ] Integration tests: Facts recorded during eval appear in final report
- [ ] Integration tests: Baseline comparison includes flag/fact differences
- [ ] End-to-end tests: Full eval run with CLI flags produces correct traces
- [ ] Performance tests: Flag/fact overhead is negligible (<5% eval time increase)
- [ ] Manual testing: View flag/fact data in Axiom traces

**Acceptance Criteria:**
```ts
Eval('my-eval', {
  flags: { temperature: 0.8 },  // Pre-seed flags
  task: async () => {
    experiment<MyFlags>(({ flags }) => {
      // flags.temperature === 0.8 (from EvalParams)
      // Can be overridden by CLI: --flag.temperature=0.9
    });
  },
  // ... existing fields
});
```

---

## Phase 5: Documentation & Polish
**Goal:** Production-ready with comprehensive docs and examples

### Implementation Tasks
1. **API documentation**
   - JSDoc comments on all public APIs
   - TypeScript declaration files with rich documentation
   - Migration guide from existing eval patterns

2. **Usage examples**
   - Basic flag/fact usage patterns
   - Advanced experiment setups
   - CLI usage examples
   - Integration with different AI SDK patterns

3. **Performance optimization**
   - Minimize baggage serialization overhead
   - Lazy context initialization
   - Memory leak prevention in long-running evals

4. **Error handling & debugging**
   - Clear error messages for common mistakes
   - Debug logging for context propagation issues
   - Validation for flag/fact registry mismatches

### Validation Steps
- [ ] Documentation review: All APIs have clear examples
- [ ] Performance benchmarks: Overhead stays under 5% in realistic scenarios
- [ ] Error handling tests: Common mistakes produce helpful error messages
- [ ] Accessibility tests: Works with screen readers and other assistive tech
- [ ] Load testing: System handles large numbers of concurrent experiments
- [ ] Beta user feedback: At least 3 internal teams validate the API

**Acceptance Criteria:**
- Complete API documentation with runnable examples
- Performance regression tests pass
- Error messages guide users to solutions
- Beta users successfully migrate existing evals

---

---

## Architecture Summary

### Package Structure  
```
axiom/
├─ ai/               // Runtime helpers (flag, fact, overrideFlags)
│   └─ context.ts    //   Imported by both app code and evals
│
└─ eval/             // Eval tooling (experiment, Eval)  
    └─ experiment.ts //   Import from axiom/eval
```

### Private Span Explanation
- `EXPERIMENT_SPAN_KEY`: Custom context key to store experiment spans
- **Why:** Prevents HTTP propagation while keeping telemetry organized  
- **How:** Span exists in context but never becomes "current span"
- **Result:** Your HTTP calls don't leak eval metadata to external services

### Facts Storage Strategy
- **During execution:** Record as span events (timestamped, unlimited)
- **On span end:** Consolidate as JSON attribute for easy querying
- **Best of both:** Time-series detail + dashboard filtering

---

## Success Metrics

### Technical Metrics
- **Type Safety:** 100% of flag/fact usage should be compile-time checked when registries are provided
- **Performance:** <5% overhead compared to baseline evals
- **Compatibility:** Works in Node.js 18+, modern browsers, Cloudflare Workers
- **Reliability:** No memory leaks in long-running eval suites

### User Experience Metrics
- **Migration Effort:** Existing evals can add flag/fact tracking with <10 lines of changes
- **Discoverability:** Flag/fact data visible in eval reports and traces
- **Debugging:** "Why did my eval score change?" questions answerable through flag/fact diff

### Integration Metrics
- **Zero Config:** Works out-of-the-box with existing OTel setup
- **No Propagation:** Experiment context never leaks to external HTTP calls
- **Baseline Compatibility:** Flag/fact data included in eval baselines for comparison

## Risks & Mitigations

### Risk: Baggage size limits
**Mitigation:** Document limits (<10 flags, <100B each), provide warnings when exceeded

### Risk: Type registry complexity
**Mitigation:** Provide clear templates and examples, make typing optional

### Risk: Performance impact
**Mitigation:** Implement lazy loading, benchmark at each phase

### Risk: Context propagation bugs
**Mitigation:** Comprehensive cross-environment testing, private span keys

## Rollout Strategy

1. **Phase 1-2:** Internal dogfooding with axiom/ai team
2. **Phase 3-4:** Beta release to select users
3. **Phase 5:** Public stable release with full documentation

Each phase gates on validation criteria before proceeding to the next.
