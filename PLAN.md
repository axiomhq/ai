

Based on my research and analysis of your codebase, here's my thinking on the `axiom.config.ts` approach:

## Key Findings

Your SDK currently has:
1. **Eval runner**: Programmatically creates vitest via `createVitest()` in `run-vitest.ts`
2. **CLI-driven config**: Environment vars (`AXIOM_URL`, `AXIOM_TOKEN`, `AXIOM_DATASET`) and CLI flags
3. **App-level config**: `createAppScope()` with zod schemas for flags/facts
4. **No config file currently**: Users have bare vitest configs in examples, but SDK doesn't read them

## Architecture Decision

### Vitest Config as a Peer (Separate Concerns)**

```typescript
// axiom.config.ts
export default defineAxiomConfig({
  axiom: {
    url: 'https://api.axiom.co',
    token: process.env.AXIOM_TOKEN,
    dataset: 'my-evals'
  },
  evals: {
    timeout: 60000,
    baseline: 'baseline-id',
    reporters: ['verbose'],
    debug: false
  },
  prompts: {
    directory: './src/prompts',
    pushOnBuild: false
  }
})

// vitest.config.ts (separate, optional)
export default defineConfig({
  resolve: { alias: { '@': './src' } }
})
```

**Pros:**
- ✅ Clean separation: Axiom concerns vs build/test tool concerns
- ✅ Two-way door: Can change approach later without breaking users
- ✅ Simple to implement: Just load `axiom.config.ts` in your CLI/runner
- ✅ Familiar pattern: Matches Playwright (playwright.config.ts separate from vite.config.ts)

**Cons:**
- ❌ Two config files for users to manage
- ❌ Users can't access vitest-specific options from axiom.config (no DRY if they need both)

### **Config Structure**

```typescript
// axiom.config.ts
import { defineConfig, type AxiomConfig } from 'axiom/ai/config'

export default defineConfig({
  // env mostly
  axiom: {
    url: process.env.AXIOM_URL || 'https://api.axiom.co',
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET
  },
  
  evals: {
    timeout: 60000,
    // this is an important one! if we don't allow custom
    // instrumentation files, traces may look different in
    // evals vs regular app traces
    instrumentation: ["./src/instrumentation.node.ts"],
    include: ['**/*.eval.ts'],
    reporters: [VerboseConsoleReporter(), AxiomReporter()],
    retries: 3,
    // etc
  },
  
  prompts: {
    // FUTURE: idk what prompt management will entail
    include: ["./src/prompts"],
    pushOnBuild: false,
    autoVersion: true
  }, 
}) satisfies AxiomConfig
```

### **Implementation Plan**

**Very Easy:**
- ✅ Load `axiom.config.ts` in CLI (`eval.command.ts`) using `import()` or `jiti`
- ✅ Merge config values with CLI flags (CLI wins)
- ✅ Pass config to `runVitest()` instead of hardcoding

**Easy:**
- ✅ Add `defineConfig` helper for types
- ✅ Support `.js` / `.ts` / `.mjs` extensions
- ✅ Add schema validation with zod

**Medium:**
- 🟡 Handle config file discovery (check cwd, then parents)
- 🟡 Decide precedence: config file < env vars < CLI flags
- 🟡 Support async config (for dynamic baseline lookup, etc.)

**Hard:**
- ❌ Merging with vitest config (in the future)
- ❌ Hot reloading config in watch mode
- ❌ Config file codegen from CLI usage

### **One-Way vs Two-Way Decisions**

| Decision | Type | Why |
|----------|------|-----|
| Separate from vitest config | **Two-way** | Can merge later if needed |
| Use `defineConfig` pattern | **Two-way** | Industry standard, easy to change internals |
| Config file name `axiom.config.ts` | **One-way** | Hard to rename once published |
| Top-level keys (`axiom`, `evals`, `prompts`) | **One-way** | Breaking change to restructure |
| Support `.js` / `.ts` / `.mjs` | **Two-way** | Just file loading logic |
| Allow async config | **One-way** | Can't easily remove async once added |

### **Challenges**

1. **TypeScript config loading**: Need to handle `.ts` files (use `jiti` or `tsx`)
2. **Merging precedence**: Config < env < CLI requires careful handling
3. **Backward compat**: Existing users with no config file must keep working
4. **Vitest.config discovery**: Your programmatic vitest still won't read user's vitest.config unless you explicitly load it (current behavior is fine IMO)
