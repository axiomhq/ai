import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

describe('cli command explain', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses env var for explain output', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ matches: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['query', "['alpha'] | limit 1"], {
      stdoutIsTTY: true,
      env: { AXIOM_EXPLAIN: '1', AXIOM_TOKEN: 'token', AXIOM_ORG_ID: 'org' },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('explain:');
    expect(result.stderr).toContain('/v1/datasets/_apl?format=legacy');
    expect(result.stderr).toContain("['alpha'] | limit 1");
  });

  it('uses flag override for explain output', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ matches: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(
      ['query', "['alpha'] | limit 1", '--explain'],
      {
        stdoutIsTTY: true,
        env: { AXIOM_EXPLAIN: '0', AXIOM_TOKEN: 'token', AXIOM_ORG_ID: 'org' },
      },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('explain:');
    expect(result.stderr).toContain('/v1/datasets/_apl?format=legacy');
    expect(result.stderr).toContain("['alpha'] | limit 1");
  });
});
