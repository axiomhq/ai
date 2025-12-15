import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('CLI lazy imports', () => {
  const distDir = resolve(__dirname, '../../dist');

  it('bin.js should not statically import vitest modules', () => {
    // Read the built bin.js and check it doesn't have static vitest imports
    // Dynamic imports (inside functions) are fine, but top-level imports would
    // cause "Cannot find package 'vitest'" errors when running via npx
    const binJs = readFileSync(resolve(distDir, 'bin.js'), 'utf-8');

    // Check for static import statements of vitest
    // These patterns would indicate vitest is eagerly loaded at module init time
    const staticVitestImport = /^import\s+.*from\s+['"]vitest/m;
    const staticVitestNodeImport = /^import\s+.*from\s+['"]vitest\/node/m;

    expect(binJs).not.toMatch(staticVitestImport);
    expect(binJs).not.toMatch(staticVitestNodeImport);
  });

  it('bin.js should not statically import run-vitest chunk', () => {
    const binJs = readFileSync(resolve(distDir, 'bin.js'), 'utf-8');

    // The run-vitest module should only be dynamically imported
    // If it appears as a static import, vitest will be loaded eagerly
    const staticRunVitestImport = /^import\s+.*run-vitest/m;

    expect(binJs).not.toMatch(staticRunVitestImport);
  });
});
