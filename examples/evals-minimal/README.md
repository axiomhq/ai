## Setup

- `cp .env.example .env`
- Fill out the environment variables. Make sure that your Axiom API token has read permissions.
- `pnpm i`
- `pnpm eval` (You should get 0% pass rate)
- `pnpm eval --flag.minimalDemo.strategy=smart --flag.minimalDemo.beThorough=true` (You should hopefully now get 100% pass rate on this very contrived example)

## Trial Span Status Repro

- `pnpm eval:trial-status-repro`
- Open the `Trial-Span-Status-Repro` trace and inspect the two `eval.trial` spans.
- Trial index `1` is intentionally failed. If the bug is present, that span has `eval.trial.error` set but status `OK` instead of `ERROR`.
