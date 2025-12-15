import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('CLI lazy imports', () => {
  const distDir = resolve(__dirname, '../../dist');

  it('bin.js import chain should not include vitest', () => {
    // This test prevents regressions where vitest gets statically imported
    // in the CLI startup path, breaking `npx axiom login` etc.
    //
    // The fix is to use dynamic imports for vitest-dependent code:
    //   const { runVitest } = await import('../../evals/run-vitest');

    const allChunks = readdirSync(distDir)
      .filter((f) => f.endsWith('.js') && !f.endsWith('.cjs'))
      .map((f) => ({
        name: f,
        content: readFileSync(resolve(distDir, f), 'utf-8'),
      }));

    // Find chunks that import vitest
    const vitestChunks = new Set(
      allChunks
        .filter((c) => /from\s+['"]vitest/.test(c.content))
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

      // Find static imports (top-level imports, not dynamic import())
      // Matches both single-line and multi-line import statements
      const staticImports = chunk.content.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g);
      for (const match of staticImports) {
        // Skip dynamic imports like: import("./chunk.js")
        const beforeFrom = chunk.content.slice(0, match.index);
        const lastLine = beforeFrom.slice(beforeFrom.lastIndexOf('\n'));
        if (lastLine.includes('import(')) continue;

        toVisit.push(match[1]);
      }
    }

    // Check if any visited chunk imports vitest
    const vitestInChain = [...visited].filter((v) => vitestChunks.has(v));

    expect(vitestInChain).toEqual([]);
  });
});
