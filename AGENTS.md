# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Project

Axiom AI SDK (`axiom` on npm) — TypeScript toolkit for adding OpenTelemetry-based observability to GenAI applications. Supports Vercel AI SDK v4/v5/v6 (LanguageModel API v1/v2/v3).

Published as a single package with multiple entry points:
- `axiom/ai` — Instrumentation (middleware, withSpan, wrapTool, onlineEval)
- `axiom/ai/evals` — Offline evaluation framework (vitest-based)
- `axiom/ai/scorers` — Vitest-free scorer entry point
- `axiom/ai/scorers/aggregations` — Score aggregation utilities
- `axiom/ai/config` — Configuration loading (c12-based)
- `axiom/ai/feedback` — Client-side feedback (no Node.js shims)

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages (turbo)
pnpm test                 # Run all tests (turbo)
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm format               # Prettier write
pnpm format:check         # Prettier check

# Package-level (from packages/ai/)
pnpm test                 # vitest run
pnpm test:watch           # vitest --watch

# Single test file
cd packages/ai && npx vitest run test/otel/middleware.test.ts
```

## Monorepo Layout

```
packages/ai/       # Main SDK package (published as "axiom")
internal/          # Shared tooling (eslint-config)
examples/          # Reference apps (telemetry-*, evals-*, online-evals-*)
```

pnpm workspaces + Turborepo. Node.js 20.x/22.x/24.x.

## Architecture

### OpenTelemetry Instrumentation (`src/otel/`)

The core of the SDK. Creates OpenTelemetry spans around AI model calls.

- **`middleware.ts`** — The main entry point. `axiomAIMiddleware()` auto-detects the model's `specificationVersion` (v1/v2/v3) and delegates to the correct versioned middleware. Each version implements `wrapGenerate` and `wrapStream` hooks.
- **`initAxiomAI.ts`** — `initAxiomAI({ tracer })` stores tracer scope in `globalThis` for cross-context propagation (e.g. Next.js). Must be called once during instrumentation setup.
- **`withSpan.ts`** — Manual span creation for wrapping arbitrary AI call sequences.
- **`wrapTool.ts`** — Wraps Vercel AI SDK `tool()` definitions with span instrumentation.
- **`streaming/aggregators.ts`** — Stream chunk aggregators (text, tool calls, stats) per API version. Used by `wrapStream` to collect attributes from `TransformStream` chunks.
- **`semconv/attributes.ts`** — Centralized `Attr` object mapping all span attribute keys (GenAI semantic conventions + Axiom custom attributes).
- **`utils/wrapperUtils.ts`** — Shared span lifecycle helpers (`withSpanHandling`, `createStreamChildSpan`, `setBaseAttributes`, etc.).
- **`utils/redaction.ts`** — Redaction policy support for controlling what content is captured in spans.

### Multi-Version Support

The SDK maintains parallel implementations for Vercel AI SDK API versions:
- `AxiomWrappedLanguageModelV1.ts` / V2 / V3 — Legacy wrapper classes
- `middleware.ts` — Current approach using middleware pattern (V1/V2/V3)
- Dev dependencies use aliased packages (`aiv4`/`aiv5`/`aiv6`, `@ai-sdk/openaiv1`/v2/v3) for testing across versions

### Evaluations (`src/evals/`)

Offline evaluation framework built on vitest:
- **`eval.ts`** — `Eval()` creates vitest describe blocks that run tasks against collections, score results, and report
- **`custom-runner.ts`** — Custom vitest runner for eval-specific lifecycle hooks
- **`scorer.factory.ts`** — `createScorer()` / `Scorer()` factory for defining scoring functions
- **`reporter.ts`** — Console reporter with formatted eval output

### Online Evaluations (`src/online-evals/`)

Production-safe scoring that runs without vitest dependency. `onlineEval()` executes scorers within the current OTEL context.

### CLI (`src/cli/`, `src/bin.ts`)

`axiom` binary for running evals, managing config. **Critical rule**: vitest and related imports must be dynamically imported in CLI command handlers — never at module top-level. This is enforced by eslint.

### Build (`tsup.config.ts`)

Two-pass build:
1. Client-compatible modules (`feedback.ts`) — `clean: true`, `shims: false`
2. Server-side modules (everything else) — `clean: false`, `shims: true`

Both passes output ESM + CJS. `handlebars` is bundled (`noExternal`); vitest and OTEL are external.

`__SDK_VERSION__` is defined at build time from `package.json`.

## Testing

Vitest with `globals: true` (no need to import `describe`/`it`/`expect`). Tests in `packages/ai/test/`.

OTEL tests use `createOtelTestSetup()` from `test/helpers/otel-test-setup.ts` which provides an in-memory span exporter and `getSpans()` for assertions.

HTTP mocking uses `msw` (Mock Service Worker).

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) with semantic PR titles (enforced by CI)
- **Formatting**: Prettier — single quotes, semicolons, trailing commas, 100 char width, 2-space indent
- **TypeScript**: Strict mode, `verbatimModuleSyntax`, bundler module resolution
- **Imports**: `type` keyword required for type-only imports (enforced by `verbatimModuleSyntax`)
- **Peer dependencies**: `@opentelemetry/api` ^1.9.0, `zod` ^3.25 || ^4.0

## Cursor Cloud specific instructions

This is a pure TypeScript SDK library — no services, databases, or Docker needed. The environment requires only Node.js 22.x and pnpm 10.16.1 (both pre-installed).

- **Build before testing**: `pnpm test` depends on `pnpm build` (Turborepo handles this automatically via the `dependsOn` config). If you only run `pnpm test`, it will build first.
- **CI parity**: The CI pipeline runs `pnpm format:check`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` — in that order. Replicate this locally to catch issues before pushing.
- **Install flags**: Use `pnpm install --frozen-lockfile --ignore-scripts` for reproducible installs. The `--ignore-scripts` flag is safe here; the `dist/bin.js` warnings during install are expected and resolve after `pnpm build`.
- **Examples require external secrets**: The `examples/` apps need `OPENAI_API_KEY`, `AXIOM_TOKEN`, and `AXIOM_DATASET` environment variables. These are not needed for SDK development or testing — all tests use in-memory OTEL exporters and MSW mocks.
- **Running examples**: Install `tsx` globally (`npm install -g tsx`) to run example `.ts` files directly (e.g., `npx tsx examples/telemetry-minimal/telemetry-minimal-ai-sdk-v6.ts`). The simplest end-to-end smoke test is the `telemetry-minimal` example which makes a single OpenAI call instrumented with Axiom tracing.
