import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/config/loader';
import { DEFAULT_EVAL_INCLUDE } from '../../src/config/index';
import { resolveAxiomConnection } from '../../src/config/resolver';
import type { ResolvedAxiomConfig } from '../../src/config/index';

const writeConfig = async (dir: string, contents: string) => {
  await writeFile(join(dir, 'axiom.config.cjs'), contents, 'utf8');
};

const withTempConfigDir = async (configContents: string, run: (dir: string) => Promise<void>) => {
  const dir = await mkdtemp(join(tmpdir(), 'axiom-config-'));
  try {
    await writeConfig(dir, configContents);
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

describe('loadConfig', () => {
  it('falls back to the default eval include pattern when none is provided', async () => {
    await withTempConfigDir(
      `
        module.exports = {
          eval: {
            token: 'test-token',
            dataset: 'test-dataset',
          },
        };
      `,
      async (dir) => {
        const { config } = await loadConfig(dir);
        expect(config.eval.include).toEqual([...DEFAULT_EVAL_INCLUDE]);
      },
    );
  });

  it('uses the user provided eval include patterns without merging', async () => {
    const customInclude = ['custom/**/*.eval.ts'];
    await withTempConfigDir(
      `
        module.exports = {
          eval: {
            token: 'test-token',
            dataset: 'test-dataset',
            include: ${JSON.stringify(customInclude)},
          },
        };
      `,
      async (dir) => {
        const { config } = await loadConfig(dir);
        expect(config.eval.include).toEqual(customInclude);
      },
    );
  });
});

describe('resolveAxiomConnection', () => {
  const createConfig = (
    overrides: Partial<ResolvedAxiomConfig['eval']> = {},
  ): ResolvedAxiomConfig =>
    ({
      eval: {
        url: 'https://api.axiom.co',
        edgeUrl: undefined,
        token: 'test-token',
        dataset: 'test-dataset',
        orgId: 'test-org',
        flagSchema: null,
        instrumentation: null,
        include: [],
        exclude: [],
        timeoutMs: 60_000,
        ...overrides,
      },
    }) as ResolvedAxiomConfig;

  it('falls back to url when edgeUrl is not set', () => {
    const config = createConfig({ url: 'https://api.axiom.co', edgeUrl: undefined });
    const connection = resolveAxiomConnection(config);

    expect(connection.edgeUrl).toBe('https://api.axiom.co');
    expect(connection.url).toBe('https://api.axiom.co');
  });

  it('uses edgeUrl when explicitly set', () => {
    const config = createConfig({
      url: 'https://api.axiom.co',
      edgeUrl: 'https://eu-central-1.aws.edge.axiom.co',
    });
    const connection = resolveAxiomConnection(config);

    expect(connection.edgeUrl).toBe('https://eu-central-1.aws.edge.axiom.co');
    expect(connection.url).toBe('https://api.axiom.co');
  });

  it('falls back to url when edgeUrl is empty string', () => {
    const config = createConfig({ url: 'https://api.axiom.co', edgeUrl: '' });
    const connection = resolveAxiomConnection(config);

    expect(connection.edgeUrl).toBe('https://api.axiom.co');
  });
});
