import { loadConfigAsync } from '../../src/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Scenario = {
  name: string;
  cwd: string;
  expected: {
    url: string;
    ai: { evals: { dataset: string; token: string } };
    credentials?: { dataset: string; token: string };
  };
};

const scenarios: Scenario[] = [
  {
    name: 'mjs config',
    cwd: join(__dirname, 'mjs'),
    expected: {
      url: 'https://api.axiom.co',
      ai: { evals: { dataset: 'mjs-dataset', token: 'mjs-token' } },
      credentials: { dataset: 'mjs-dataset', token: 'mjs-token' },
    },
  },
  {
    name: 'js config',
    cwd: join(__dirname, 'js'),
    expected: {
      url: 'https://api.axiom.co',
      ai: { evals: { dataset: 'js-dataset', token: 'js-token' } },
      credentials: { dataset: 'js-dataset', token: 'js-token' },
    },
  },
  {
    name: 'cjs config',
    cwd: join(__dirname, 'cjs'),
    expected: {
      url: 'https://api.axiom.co',
      ai: { evals: { dataset: 'cjs-dataset', token: 'cjs-token' } },
      credentials: { dataset: 'cjs-dataset', token: 'cjs-token' },
    },
  },
  {
    name: 'json config',
    cwd: join(__dirname, 'json'),
    expected: {
      url: 'https://api.axiom.co',
      ai: { evals: { dataset: 'json-dataset', token: 'json-token' } },
      credentials: { dataset: 'json-dataset', token: 'json-token' },
    },
  },
  {
    name: 'package.json axiom field',
    cwd: join(__dirname, 'pkg'),
    expected: {
      url: 'https://api.axiom.co',
      ai: { evals: { dataset: 'pkg-dataset', token: 'pkg-token' } },
      credentials: { dataset: 'pkg-dataset', token: 'pkg-token' },
    },
  },
];

describe('unconfig loads axiom config from multiple sources', () => {
  afterEach(() => {
    process.chdir(process.cwd());
  });

  for (const scenario of scenarios) {
    it(`loads config from ${scenario.name}`, async () => {
      process.chdir(scenario.cwd);
      const result = await loadConfigAsync();
      expect(result.error).toBeNull();
      const cfg = result.config as any;
      expect(cfg).toBeDefined();
      expect(cfg.url).toBe(scenario.expected.url);
      expect(cfg.ai.evals.dataset).toBe(scenario.expected.ai.evals.dataset);
      expect(cfg.ai.evals.token).toBe(scenario.expected.ai.evals.token);
      if (scenario.expected.credentials) {
        expect(cfg.credentials?.dataset).toBe(scenario.expected.credentials.dataset);
        expect(cfg.credentials?.token).toBe(scenario.expected.credentials.token);
      }
    });
  }
});
