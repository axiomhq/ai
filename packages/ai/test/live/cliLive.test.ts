import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

const isLiveEnabled = process.env.AXIOM_LIVE_TEST === '1';
const token = process.env.AXIOM_TOKEN;
const orgId = process.env.AXIOM_ORG_ID;
const url = process.env.AXIOM_URL;
const datasetOverride = process.env.AXIOM_TEST_TRACES_DATASET;

const hasRequiredEnv = Boolean(token && orgId && url);
const shouldRunLive = isLiveEnabled && hasRequiredEnv;

const liveEnv = {
  AXIOM_TOKEN: token,
  AXIOM_ORG_ID: orgId,
  AXIOM_URL: url,
};

describe.skipIf(!shouldRunLive)('cli live smoke', () => {
  it(
    'runs datasets list in json mode',
    { timeout: 20_000 },
    async () => {
      const result = await runCli(['datasets', 'list', '--format', 'json'], {
        env: liveEnv,
      });

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout) as { data: Array<{ name?: string | null }> };
      expect(Array.isArray(parsed.data)).toBe(true);
    },
  );

  it(
    'runs monitors list in json mode',
    { timeout: 20_000 },
    async () => {
      const result = await runCli(['monitors', 'list', '--format', 'json'], { env: liveEnv });

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout) as { data: unknown[] };
      expect(Array.isArray(parsed.data)).toBe(true);
    },
  );

  it(
    'runs query limit 1 against detected traces dataset',
    { timeout: 20_000 },
    async () => {
      let dataset = datasetOverride;

      if (!dataset) {
        const datasets = await runCli(['datasets', 'list', '--format', 'json'], {
          env: liveEnv,
        });
        expect(datasets.exitCode).toBe(0);

        const parsedDatasets = JSON.parse(datasets.stdout) as {
          data: Array<{ name?: string | null }>;
        };
        dataset = parsedDatasets.data.map((entry) => entry.name).find((name): name is string => Boolean(name));
      }

      expect(dataset).toBeTruthy();

      const result = await runCli(
        ['query', `['${dataset!}'] | limit 1`, '--format', 'json'],
        {
          env: liveEnv,
        },
      );

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout) as {
        data: { rows?: unknown[] };
      };
      expect(Array.isArray(parsed.data.rows)).toBe(true);
    },
  );
});

if (!shouldRunLive) {
  describe('cli live smoke', () => {
    it('is skipped unless AXIOM_LIVE_TEST=1 and required env vars are set', () => {
      expect(shouldRunLive).toBe(false);
    });
  });
}
