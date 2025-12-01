## Setup

- `cp .env.example .env`
- Fill out the environment variables. Make sure that your Axiom API token has read permissions.
- `pnpm i`
- `pnpm eval` (You should get 0% pass rate)
- `pnpm eval --flag.minimalDemo.strategy=smart --flag.minimalDemo.beThorough=true` (You should hopefully now get 100% pass rate on this very contrived example)
