// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createVitest } from 'vitest/node';
import { loadConfig } from '../../src/config/loader';
import { resolveVitestConfigPath } from '../../src/evals/run-vitest';

const writeTempFile = async (dir: string, file: string, contents: string) => {
  await writeFile(join(dir, file), contents, 'utf8');
};

describe('vitest config integration', () => {
  afterEach(() => {
    delete (globalThis as any).__SDK_VERSION__;
  });

  it('loads setupFiles from vitest config referenced by axiom.config.ts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'axiom-vitest-config-'));

    try {
      await writeTempFile(
        dir,
        'axiom.config.ts',
        `
          export default {
            eval: {
              url: 'https://api.axiom.co',
              edgeUrl: 'https://api.axiom.co',
              token: 'test-token',
              dataset: 'test-dataset',
              vitestConfig: './vitest.eval.config.ts',
            },
          };
        `,
      );

      await writeTempFile(
        dir,
        'vitest.eval.config.ts',
        `
          import { defineConfig } from 'vitest/config';

          export default defineConfig({
            test: {
              setupFiles: ['./setup.ts'],
            },
          });
        `,
      );

      await writeTempFile(
        dir,
        'setup.ts',
        `
          (globalThis as any).__axiomVitestSetupLoaded = true;
        `,
      );

      await writeTempFile(
        dir,
        'config-load.test.ts',
        `
          import { expect, it } from 'vitest';

          it('loads setup from vitest config', () => {
            expect((globalThis as any).__axiomVitestSetupLoaded).toBe(true);
          });
        `,
      );

      const { config, configPath } = await loadConfig(dir);
      const vitestConfigPath = resolveVitestConfigPath(config.eval.vitestConfig, configPath, dir);

      expect(vitestConfigPath).toBeTypeOf('string');

      const vi = await createVitest('test', {
        config: vitestConfigPath,
        root: dir,
        include: ['**/*.test.ts'],
        watch: false,
        silent: true,
      });

      try {
        const result = await vi.start();
        expect(result.unhandledErrors).toEqual([]);
        expect(vi.state.getCountOfFailedTests()).toBe(0);
      } finally {
        await vi.close();
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
