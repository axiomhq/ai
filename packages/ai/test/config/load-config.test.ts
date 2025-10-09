import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../../src/config/loader';
import { DEFAULT_EVAL_INCLUDE } from '../../src/config/index';

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
