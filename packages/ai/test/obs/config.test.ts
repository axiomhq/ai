import { describe, expect, it } from 'vitest';
import { resolveObsConfig } from '../../src/obs/config/resolve';

describe('resolveObsConfig', () => {
  it('applies flag precedence over env and auth', () => {
    const config = resolveObsConfig(
      {
        url: 'https://flag.example',
        orgId: 'flag-org',
        token: 'flag-token',
        format: 'json',
        maxCells: 250,
        explain: true,
      },
      {
        AXIOM_URL: 'https://env.example',
        AXIOM_ORG_ID: 'env-org',
        AXIOM_TOKEN: 'env-token',
        AXIOM_FORMAT: 'csv',
        AXIOM_MAX_CELLS: '123',
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
      maxCells: 250,
      explain: true,
    });
  });

  it('falls back to env and auth defaults', () => {
    const config = resolveObsConfig(
      {},
      {
        AXIOM_FORMAT: 'ndjson',
        AXIOM_MAX_CELLS: '600',
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
      maxCells: 600,
      quiet: true,
    });
  });
});
