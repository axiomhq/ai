# Implementation plan: Human-readable eval report

## Objective

- Produce a coherent Run → Suite → Case → Metric terminal report with baseline deltas, config diffs, and clear structure.
- Keep it simple: default mode prints everything; a DEBUG flag can be added later to gate verbosity.
- Implement in small, verifiable steps, each easy to test manually in examples/example-evals-nextjs.

## Quick test matrix (manual)

- default: final report with all sections printed.
- debug: same as default; you can add extra gating later via `AXIOM_DEBUG=true`.

Example commands (run from repo root):

```bash
# Default (prints everything for now)
pnpm --filter example-evals-nextjs eval:by-name

# Debug
pnpm --filter example-evals-nextjs eval:by-name --debug

# Override
pnpm --filter example-evals-nextjs eval:by-name --flag.foo.bar=somevalue
```

## Steps (small, incremental)

1) Reporter aggregation skeleton and final print
- Scope: packages/ai/src/evals/reporter.ts
- Change: add in-memory structures to collect per-suite data (suite name, relative path, baseline meta, cases, link) and run totals. Initialize in `onTestRunStart`. Print a single, structured report in `onTestRunEnd`.
- Test: run once; add a temporary totals print at end to confirm aggregation works.

2) Baseline loading + per-metric deltas (numbers only)
- Scope: packages/ai/src/evals/reporter.ts
- Change: for each case, compute per-metric baseline deltas by index if present. Determine primary metric as the first scorer key. Represent all scores and deltas as plain numbers (e.g., 0.1190 → 0.1351, +0.0161).
- Test: use example suites; verify deltas match current raw output numbers; handle missing baseline gracefully (no delta shown).

3) Config snapshot at run end (diff-only; full configs printed for now)
- Scope: packages/ai/src/evals/eval.ts, packages/ai/src/evals/reporter.ts, packages/ai/src/evals/reporter.console-utils.ts
- Change: ensure `lastConfigSnapshot` is populated from per-case run (finalFlags/overrides) and that `configEnd` is set in `afterAll`. At `onTestRunEnd`, print a "Config changes" header using existing console utils (diff-only). For now, also print full configs; later you can gate with DEBUG.
- Test: run with `AXIOM_FLAGS` (or CLI overrides) to see changed keys; confirm full config block prints.

4) Formatting helpers (numbers only)
- Scope: packages/ai/src/evals/reporter.console-utils.ts
- Change: add helpers to format numbers with fixed precision (e.g., 4 decimals) and to render deltas as raw numeric differences (e.g., +0.0161). Do not convert ratios to percentages and do not use percentage points.
- Test: verify `0.1190 → 0.1351 (+0.0161)` style across the report.

5) Suite-level blocks
- Scope: packages/ai/src/evals/reporter.ts, packages/ai/src/evals/reporter.console-utils.ts
- Change: print per-suite header (name, relative file path, duration), baseline alias+id+timestamp, one link, aggregated out-of-scope summary; then per-case metrics with deltas and capped runtime flags.
- Test: compare with report-plan.example.md; ensure no absolute paths; single link per suite.

6) Out-of-scope flags aggregation and display
- Scope: packages/ai/src/evals/eval.ts, packages/ai/src/evals/reporter.console-utils.ts
- Change: use evaluation-level aggregated flags in suite blocks; show count and top N examples. Keep per-case full lists in the detailed section (since default prints everything for now).
- Test: trigger a flag (e.g., access a non-picked flag) and verify suite-level count increments and examples appear.

7) Summary section + link hub
- Scope: packages/ai/src/evals/reporter.ts, packages/ai/src/evals/reporter.console-utils.ts
- Change: print run totals (suites, cases, failures), primary metric cross-suite average (current vs baseline) with delta, and one line per suite (primary avg + delta + link). Add a final link hub.
- Test: verify counts and averages; links display slugified names and use id-based URLs.

8) Debug live logs (later)
- Scope: packages/ai/src/evals/run-vitest.ts, packages/ai/src/evals/reporter.ts
- Change: keep current behavior for now (print everything). Later, add `if (DEBUG)` to limit streaming and move full configs behind DEBUG.
- Test: set `AXIOM_DEBUG=true` to ensure nothing breaks.

9) Edge cases hardening
- Scope: reporter.ts and utils
- Change: handle: missing baseline, mismatched case counts, non-[0,1] metrics, long values (use `truncate`), empty suites.
- Test: simulate each scenario and confirm graceful output.

## Definition of done

- Default run prints a single, clean final report (no gating); config changes appear once at top; full configs printed (for now).
- Per-suite headers, per-case metrics with numeric deltas, aggregated out-of-scope; relative paths only.
- Summary shows one line per suite + cross-suite summary + link hub.
- All metrics and deltas are plain numbers (no percentages, no pp).
