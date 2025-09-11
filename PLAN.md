## Plan: Namespaced Flag System Demo
**Goal:** Test-first development of namespaced flag system with dot notation access

### Overview
Validate the feasibility of changing from `flagSchema: ZodObject<any>` to `flagSchema: Record<string, ZodObject>` with typesafe dot notation access patterns like `flag("namespace.flag", default)` and `flag("namespace.foo.bar", default)`.

### Test-First Approach
Write comprehensive tests first to define both functional and type-level behavior, then implement based on failing tests.

### Implementation Tasks

1. **Create test files**
   - `packages/ai/src/app-scope-2.test.ts` - Runtime behavior tests
   - `packages/ai/src/app-scope-2.test-d.ts` - Type-level tests (using tsd)

2. **Runtime behavior tests** (Jest/Vitest)
   - `basicAccess.test` - `flag('ui.theme')` returns value or default
   - `nestedObjects.test` - Deep nesting 3+ levels: `flag('ui.layout.grid.columns')`
   - `wholeNamespace.test` - `flag('ui')` returns entire namespace object
   - `defaults.test` - Schema defaults vs explicit defaults priority
   - `inheritedDefaults.test` - Parent object defaults provide child defaults: `flag('ui.layout.grid.columns')` works without explicit default
   - `typeInference.test` - Runtime type correctness validation
   - `errorsRuntime.test` - Missing keys, wrong types produce helpful errors

3. **Type-level behavior tests** (tsd)
   - `basic-access-ok.test-d.ts` - Basic dot notation inference works
   - `nested-inference-ok.test-d.ts` - Deep path inference works
   - `namespace-ok.test-d.ts` - Whole namespace access typed correctly
   - `default-handling-ok.test-d.ts` - Direct default requirement inference
   - `inherited-defaults-ok.test-d.ts` - Parent object defaults detected correctly
   - `autocomplete-ok.test-d.ts` - IDE autocomplete validation
   - Error suites - Wrong paths, types should fail compilation

4. **Core type utilities**
   - `DotPaths<T>` - Generate union of all valid dot paths
   - `PathValue<T, P>` - Look up value type by dot path
   - `KeysWithDefaults<T>` - Detect paths with direct schema defaults
   - `KeysWithInheritedDefaults<T>` - Detect paths with parent object defaults
   - `AllKeysWithDefaults<T>` - Union of direct + inherited defaults
   - `FlagFunction` overloads - Conditional default requirement based on any available default

### Test Coverage Matrix

| Feature | Runtime Test | Type Test | Edge Cases |
|---------|--------------|-----------|------------|
| Basic dot notation | ✓ basicAccess | ✓ basic-access-ok | Missing keys, wrong syntax |
| Deep nesting | ✓ nestedObjects | ✓ nested-inference-ok | Recursion limits, arrays |
| Whole namespace | ✓ wholeNamespace | ✓ namespace-ok | Partial objects, iteration |
| Direct defaults | ✓ defaults | ✓ default-handling-ok | Schema vs explicit priority |
| Inherited defaults | ✓ inheritedDefaults | ✓ inherited-defaults-ok | Parent chain traversal |
| Type inference | ✓ typeInference | ✓ autocomplete-ok | Wrong types, any fallback |
| Error cases | ✓ errorsRuntime | ✓ error suites | Helpful error messages |

### Validation Steps
- [ ] Write failing tests for all access patterns
- [ ] Write failing type tests for inference and errors
- [ ] Implement minimal skeleton (all tests fail)
- [ ] Implement runtime dot-path lookup
- [ ] Implement type utilities for path generation
- [ ] Implement conditional overloads for defaults
- [ ] All tests pass with proper IDE experience

### Implementation Files
1. **Test file:** `packages/ai/src/app-scope-2.test.ts`
2. **Type test file:** `packages/ai/src/app-scope-2.test-d.ts` 
3. **Implementation:** `packages/ai/src/app-scope-2.ts`

### Success Criteria
```ts
// Test schema
const schemas = {
  ui: z.object({
    theme: z.string().default('dark'),     // has direct default
    fontSize: z.number(),                  // no default
    layout: z.object({
      sidebar: z.boolean().default(true), // nested direct default
      grid: z.object({
        columns: z.number(),               // no direct default
      }),
    }).default({                           // parent object default
      sidebar: false,
      grid: { columns: 12 }                // inherited default for columns
    }),
  }),
  feature: z.object({
    enabled: z.boolean(),
    config: z.object({
      timeout: z.number(),
    }).default({ timeout: 5000 }),         // parent default provides child default
  }),
};

const scope = createAppScope({ flagSchema: schemas });

// Should work (direct schema defaults)
scope.flag('ui.theme');                    // string, no default needed
scope.flag('ui.layout.sidebar');           // boolean, no default needed

// Should work (inherited defaults from parent objects)
scope.flag('ui.layout.grid.columns');      // number, no default needed (inherited from layout default)
scope.flag('feature.config.timeout');     // number, no default needed (inherited from config default)

// Should work (explicit defaults)
scope.flag('ui.fontSize', 16);             // number, default required
scope.flag('feature.enabled', false);     // boolean, default required

// Should work (namespace access)
const ui = scope.flag('ui', { theme: 'light', fontSize: 14 }); // typed object
const layout = scope.flag('ui.layout');   // typed object with defaults applied

// Should fail compilation
// scope.flag('ui.fontSize');              // ❌ no default provided (neither direct nor inherited)
// scope.flag('unknown.path');             // ❌ invalid path
// scope.flag('ui.theme', 123);            // ❌ wrong default type
```

### Risk Mitigation
- **Complexity Risk:** Start with minimal test cases, iterate incrementally
- **Type Performance:** Monitor compilation time, limit recursion depth
- **IDE Experience:** Test autocomplete and error messages early
- **Edge Cases:** Comprehensive test matrix covers all access patterns

### Acceptance Criteria
- All runtime tests pass with expected behavior
- All type tests pass with proper inference
- IDE provides autocomplete for valid paths
- IDE shows helpful errors for invalid usage
- Compilation time remains reasonable (<10s for test suite)
