# Repo Architecture

This is a monorepo that can consist of one or more packages. We decided to go with a monorepo
because it provides us the flexibility we need to build examples or e2e projects. 

## Tech:

The repo is powered by:

- turbo
- pnpm
- vite

## Packages:

There is one package `ai` that serves as a library but also works as a binary. The binary file source lives at `packages/ai/bin.ts` and could be run locally this way:

```sh
./packages/ai/dist/bin.js run ./packages/examples/example.eval.ts
```

