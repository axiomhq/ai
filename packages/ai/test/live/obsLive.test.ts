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

describe.skipIf(!shouldRunLive)('obs live smoke', () => {
  it(
    'runs service detect in json mode',
    { timeout: 20_000 },
    async () => {
      const result = await runCli(['service', 'detect', '--format', 'json'], {
        env: liveEnv,
      });

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout) as {
        data: { traces?: { dataset?: string | null } };
      };
      expect(parsed.data.traces).toBeDefined();
    },
  );

  it(
    'runs service list for the last 5 minutes in json mode',
    { timeout: 20_000 },
    async () => {
      const result = await runCli(
        ['service', 'list', '--since', '5m', '--format', 'json', '--limit', '5'],
        { env: liveEnv },
      );

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout) as { data: unknown[] };
      expect(Array.isArray(parsed.data)).toBe(true);
    },
  );

  it(
    'runs query run limit 1 against detected traces dataset',
    { timeout: 20_000 },
    async () => {
      let dataset = datasetOverride;

      if (!dataset) {
        const detect = await runCli(['service', 'detect', '--format', 'json'], {
          env: liveEnv,
        });
        expect(detect.exitCode).toBe(0);

        const parsedDetect = JSON.parse(detect.stdout) as {
          data: { traces?: { dataset?: string | null } };
        };
        dataset = parsedDetect.data.traces?.dataset ?? undefined;
      }

      expect(dataset).toBeTruthy();

      const result = await runCli(
        ['query', 'run', dataset!, '--apl', 'limit 1', '--format', 'json'],
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
  describe('obs live smoke', () => {
    it('is skipped unless AXIOM_LIVE_TEST=1 and required env vars are set', () => {
      expect(shouldRunLive).toBe(false);
    });
  });
}
