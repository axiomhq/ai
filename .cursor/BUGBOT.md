# Project Review Guidelines

## Project Context

Read and understand AGENTS.md files in the repo for full context. Key facts:

- **Axiom AI SDK** (`axiom` on npm) — TypeScript toolkit for OpenTelemetry-based GenAI observability
- **Multi-version support** — Vercel AI SDK v4/v5/v6 (LanguageModel API v1/v2/v3)
- **Multiple entry points** with different runtime requirements (see "Vitest Bundling" below)
- **Two-pass tsup build** — client modules (`feedback.ts`) build first with `clean: true, shims: false`; server modules build second with `clean: false, shims: true`
- **`__SDK_VERSION__`** is a build-time define from `package.json` — only available in tsup output, not in tests

## Review Focus Areas

- Changes are consistent with existing project structure, architecture, style, conventions, and guidelines
- TypeScript strict mode compliance — no `any` without justification, `type` keyword for type-only imports (`verbatimModuleSyntax`)
- OpenTelemetry span lifecycle correctness (spans must be ended, errors recorded)
- Peer dependency compatibility — imports from `@opentelemetry/api` and `zod` must stay within declared ranges (`^1.9.0` and `^3.25 || ^4.0`)

## Critical Bug Patterns

### 1. Vitest Bundling in Non-Eval Entry Points

**Severity: Critical — causes `ERR_MODULE_NOT_FOUND` at runtime when vitest is not installed**

The root cause:

- `axiom/ai/evals` (`src/evals.ts`) re-exports both `Eval` and `Scorer` from the same bundle
- `Eval` has a top-level `import { ... } from 'vitest'` in `src/evals/eval.ts`
- `tsup` marks `vitest` as external (not bundled), so it must be resolvable at runtime
- **Any import from `axiom/ai/evals` — even just `Scorer` — triggers the vitest import chain**
- Consumers who don't run evals don't have vitest installed → `ERR_MODULE_NOT_FOUND` for `vitest` or `vite`

The fix is strict entry point separation: vitest-free code has dedicated entry points (`axiom/ai/evals/scorers`, `axiom/ai/evals/online`). The old import paths from `axiom/ai` and `axiom/ai/evals` emit deprecation warnings at runtime and will be removed in a future version.

**Detection — flag ANY of these:**

- New static `import` or `require` of `vitest`, `vitest/node`, `vitest/runners`, or `vite-tsconfig-paths` in files outside `src/evals/eval.ts`, `src/evals/custom-runner.ts`, `src/evals/run-vitest.ts`, or test files
- New re-exports from `src/evals/eval.ts` added to a non-eval entry point (`src/index.ts`, `src/evals/scorers.ts`, `src/evals/online.ts`, `src/evals/aggregations.ts`, `src/feedback.ts`)
- Code that imports `Scorer` from `axiom/ai/evals` or `axiom/ai` instead of `axiom/ai/evals/scorers`
- Code that imports `onlineEval` from `axiom/ai` instead of `axiom/ai/evals/online`
- Adding vitest-dependent code to files reachable from vitest-free entry points

**Correct patterns:**

```typescript
// Scorers (vitest-free):
import { Scorer } from 'axiom/ai/evals/scorers';

// Online evaluations (vitest-free):
import { onlineEval } from 'axiom/ai/evals/online';

// Offline eval framework (vitest required — only in eval/test files):
import { Eval } from 'axiom/ai/evals';

// CLI code — dynamic import only:
const { runVitest } = await import('../../evals/run-vitest');
```

**Entry point dependency map:**

| Entry Point | vitest Required | Safe Without vitest |
|---|---|---|
| `axiom/ai` | NO | YES |
| `axiom/ai/evals/scorers` | NO | YES |
| `axiom/ai/evals/online` | NO | YES |
| `axiom/ai/evals/aggregations` | NO | YES |
| `axiom/ai/feedback` | NO | YES (client-safe) |
| `axiom/ai/config` | NO | YES |
| `axiom/ai/evals` | **YES** | NO — offline eval runner only |

### 2. Static Vitest Imports in CLI Code

**Severity: High — breaks `npx axiom login` and other non-eval CLI commands**

The CLI (`src/cli/`, `src/bin.ts`) must never statically import vitest or vitest-dependent modules. This is enforced by ESLint `no-restricted-imports` but can be bypassed.

**Detection — flag ANY of these:**

- Static `import` from `vitest`, `vitest/node`, `vitest/runners`, or `vite-tsconfig-paths` in `src/cli/**` or `src/bin.ts`
- Static `import` from `**/evals/run-vitest` in CLI code (must use `await import()`)
- New tsup entry points that bundle CLI code with vitest-dependent modules

### 3. Missing specificationVersion Handling

**Severity: High — silently breaks for users on unhandled AI SDK versions**

The middleware auto-detects the model's `specificationVersion` (v1/v2/v3) and delegates to the correct implementation. Any new middleware code must handle all three versions.

**Detection:**

- New code in `src/otel/middleware.ts` that switches on `specificationVersion` but doesn't handle all cases
- New `wrapGenerate` or `wrapStream` implementations that only cover one API version
- Missing version checks when accessing version-specific model properties

### 4. Stream Aggregator Completeness

**Severity: Medium — leaves spans with incomplete attributes**

`TransformStream` chunks in `src/otel/streaming/aggregators.ts` must be fully consumed. Partial reads leave OTEL spans without final token counts, finish reasons, or tool call results.

**Detection:**

- Changes to aggregator logic that skip chunk types or break early
- New stream handling code that doesn't aggregate all chunk fields
- Missing `flush()` or final aggregation step in stream wrappers

### 5. Build Pass Ordering

**Severity: Medium — client bundles break if server dependencies leak in**

The tsup build has two passes. Client modules (`feedback.ts`) must never import server-only dependencies (`@opentelemetry/api`, `async_hooks`, Node.js builtins).

**Detection:**

- New imports in `src/feedback.ts` that reference Node.js APIs or OTEL
- Moving `feedback.ts` to the server-side build pass
- Adding new client entry points without adding them to the first (client) build pass

### 6. Redaction Policy Bypass

**Severity: Medium — sensitive prompt/completion content leaks to telemetry**

`src/otel/utils/redaction.ts` implements content redaction for spans. All prompt and completion content must flow through the redaction policy before being set as span attributes.

**Detection:**

- New span attributes containing prompt/completion content that bypass `redaction.ts` utilities
- Direct `span.setAttribute()` calls with raw user input or model output

### 7. Example Staleness After SDK Changes

**Severity: Medium — examples drift from SDK, confusing users and hiding breakage**

PRs that change SDK source code (`packages/ai/src/`) should update or at minimum verify the examples in `examples/` that exercise the changed code paths. Stale examples give users broken copy-paste snippets and mask API incompatibilities.

**Detection — flag when ALL of these are true:**

- PR modifies files under `packages/ai/src/`
- PR does NOT modify any files under `examples/`
- The changed source files export public API surface (entry points, middleware, scorers, wrapTool, withSpan, onlineEval, feedback, config)

**What to flag:**

- "This PR changes public SDK surface in `<file>` but no examples were updated. Please verify the examples in `examples/` still work, or update them to reflect the new behavior."

**Exceptions — do NOT flag if:**

- Changes are purely internal (unexported helpers, type narrowing, refactors with no public API change)
- Changes only affect test files, CI config, or documentation

## Excluded Paths

- **DO NOT** review the contents of the `.cursor/` directory
- **DO NOT** review `node_modules/`, `dist/`, or generated files

## Forbidden Review Behaviors

- **DO NOT** suggest styles or conventions not used in the project
- **DO NOT** flag formatting issues (Prettier handles this)
- **DO NOT** suggest adding JSDoc comments to internal functions
- **DO NOT** suggest converting working code to use different libraries
