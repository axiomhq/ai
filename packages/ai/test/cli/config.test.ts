import { describe, expect, it } from 'vitest';
import { resolveCliConfig } from '../../src/cli/config/resolve';

describe('resolveCliConfig', () => {
  it('applies flag precedence over env and auth', () => {
    const config = resolveCliConfig(
      {
        url: 'https://flag.example',
        orgId: 'flag-org',
        token: 'flag-token',
        format: 'json',
        explain: true,
      },
      {
        AXIOM_URL: 'https://env.example',
        AXIOM_ORG_ID: 'env-org',
        AXIOM_TOKEN: 'env-token',
        AXIOM_FORMAT: 'csv',
        AXIOM_EXPLAIN: '0',
      },
      {
        url: 'https://auth.example',
        orgId: 'auth-org',
        token: 'auth-token',
      },
    );

    expect(config).toMatchObject({
      url: 'https://flag.example',
      orgId: 'flag-org',
      token: 'flag-token',
      format: 'json',
      explain: true,
    });
  });

  it('falls back to env and auth defaults', () => {
    const config = resolveCliConfig(
      {},
      {
        AXIOM_FORMAT: 'ndjson',
        AXIOM_QUIET: '1',
      },
      {
        url: 'https://auth.example',
        orgId: 'auth-org',
        token: 'auth-token',
      },
    );

    expect(config).toMatchObject({
      url: 'https://auth.example',
      orgId: 'auth-org',
      token: 'auth-token',
      format: 'ndjson',
      quiet: true,
    });
  });
});
