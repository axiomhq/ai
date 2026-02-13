import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../helpers/runCli';

const env = {
  AXIOM_TOKEN: 'token',
  AXIOM_ORG_ID: 'org',
  AXIOM_URL: 'https://api.axiom.co',
};

describe('dataset commands', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders dataset list in table and csv', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            name: 'alpha',
            description: 'Alpha dataset',
            created_at: '2026-01-01T00:00:00Z',
            modified_at: '2026-01-02T00:00:00Z',
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tableResult = await runCli(['dataset', 'list', '--format', 'table'], {
      stdoutIsTTY: true,
      env,
    });

    expect(tableResult.stdout).toMatchInlineSnapshot(`
      "name   description    created_at            modified_at         
      alpha  Alpha dataset  2026-01-01T00:00:00Z  2026-01-02T00:00:00Z
      "
    `);

    const csvResult = await runCli(['dataset', 'list', '--format', 'csv'], { env });
    expect(csvResult.stdout).toMatchInlineSnapshot(`""`);
  });

  it('renders dataset get in json and mcp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T00:00:00Z'));
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'beta',
          description: null,
          created_at: '2026-01-03T00:00:00Z',
          modified_at: null,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const jsonResult = await runCli(['dataset', 'get', 'beta', '--format', 'json'], { env });
    expect(jsonResult.stdout).toMatchInlineSnapshot(`
      "{
        "meta": {
          "command": "axiom dataset get",
          "generated_at": "2026-01-05T00:00:00.000Z",
          "truncated": false,
          "rows_shown": 1,
          "rows_total": 1
        },
        "data": [
          {
            "name": "beta",
            "description": null,
            "created_at": "2026-01-03T00:00:00Z",
            "modified_at": null
          }
        ]
      }
      "
    `);

    const mcpResult = await runCli(['dataset', 'get', 'beta', '--format', 'mcp'], { env });
    expect(mcpResult.stdout).toMatchInlineSnapshot(`""`);
    vi.useRealTimers();
  });

  it('renders dataset schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          fields: [
            { name: '_time', type: 'time', nullable: false },
            { name: 'message', type: 'string', nullable: true, description: 'Message' },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['dataset', 'schema', 'alpha', '--format', 'table'], {
      stdoutIsTTY: true,
      env,
    });

    expect(result.stdout).toMatchInlineSnapshot(`
      "field    type    nullable  description
      _time    time    false                
      message  string  true      Message    
      "
    `);
  });

  it('renders dataset sample with shaping', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [
            {
              _time: '2026-01-01T00:00:00Z',
              message: 'hello',
              service: 'svc',
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['dataset', 'sample', 'alpha', '--format', 'table'], {
      stdoutIsTTY: true,
      env,
    });

    expect(result.stdout).toMatchInlineSnapshot(`""`);
  });
});
