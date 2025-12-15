import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('CLI lazy imports', () => {
  const distDir = resolve(__dirname, '../../dist');

  it('bin.js import chain should not include dev-only modules', () => {
    // This test prevents regressions where vitest or other dev-only modules
    // get statically imported in the CLI startup path, breaking `npx axiom login` etc.
    //
    // The fix is to use dynamic imports for vitest-dependent code:
    //   const { runVitest } = await import('../../evals/run-vitest');
    //
    // We only care about the ESM entrypoint (`dist/bin.js`), which is used by the `bin` field.
    // CJS chunks (`*.cjs`) are ignored here.

    // Modules that must not appear in the bin.js static import graph
    // These are external dev-only dependencies that won't be available via npx
    const forbiddenModules = [
      'vitest',
      'vitest/node',
      'vitest/index.cjs',
      'vitest/runners',
      'vite-tsconfig-paths',
    ] as const;

    const allChunks = readdirSync(distDir)
      .filter((f) => f.endsWith('.js') && !f.endsWith('.cjs'))
      .map((f) => ({
        name: f,
        content: readFileSync(resolve(distDir, f), 'utf-8'),
      }));

    // Find chunks that import any forbidden module
    const forbiddenChunks = new Set(
      allChunks
        .filter((c) =>
          forbiddenModules.some((m) => new RegExp(`from\\s+['"]${m}['"]`).test(c.content)),
        )
        .map((c) => `./${c.name}`),
    );

    // Follow static import chain from bin.js
    const visited = new Set<string>();
    const toVisit = ['./bin.js'];

    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const chunk = allChunks.find((c) => `./${c.name}` === current);
      if (!chunk) continue;

      // Find static imports (module-level `import ... from "./chunk.js"`)
      // Dynamic imports use `import("./chunk.js")` syntax which won't match
      const staticImports = chunk.content.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g);
      for (const match of staticImports) {
        toVisit.push(match[1]);
      }
    }

    // Check if any visited chunk imports forbidden modules
    const forbiddenInChain = [...visited].filter((v) => forbiddenChunks.has(v));

    expect(forbiddenInChain).toEqual([]);
  });
});
