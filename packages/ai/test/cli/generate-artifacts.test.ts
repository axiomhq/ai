import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateArtifacts } from '../../src/cli/gen/generateArtifacts';

describe('cli artifact generator', () => {
  it('is deterministic across runs', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'axiom-cli-gen-'));

    const first = generateArtifacts({ rootDir });
    const firstContents = Object.fromEntries(
      Object.keys(first).map((path) => [path, readFileSync(path, 'utf8')]),
    );

    const second = generateArtifacts({ rootDir });
    const secondContents = Object.fromEntries(
      Object.keys(second).map((path) => [path, readFileSync(path, 'utf8')]),
    );

    expect(secondContents).toEqual(firstContents);
  });
});
