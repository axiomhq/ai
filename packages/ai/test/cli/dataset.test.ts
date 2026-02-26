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
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([
            {
              name: 'alpha',
              description: 'Alpha dataset',
              region: 'cloud.us-east-1.aws',
              created_at: '2026-01-01T00:00:00Z',
              modified_at: '2026-01-02T00:00:00Z',
            },
          ]),
          { status: 200 },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tableResult = await runCli(['datasets', 'list', '--format', 'table'], {
      stdoutIsTTY: true,
      env,
    });

    expect(tableResult.stdout).toMatchInlineSnapshot(`
      "name   region               created_at            description  
      alpha  cloud.us-east-1.aws  2026-01-01T00:00:00Z  Alpha dataset
      "
    `);

    const csvResult = await runCli(['datasets', 'list', '--format', 'csv'], { env });
    expect(csvResult.exitCode).toBe(0);
    expect(csvResult.stdout).toContain('name,region,created_at,description');
    expect(csvResult.stdout).toContain('alpha,cloud.us-east-1.aws,2026-01-01T00:00:00Z,Alpha dataset');
  });

  it('renders dataset get in json and mcp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T00:00:00Z'));
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            name: 'beta',
            description: null,
            created_at: '2026-01-03T00:00:00Z',
            modified_at: null,
          }),
          { status: 200 },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const jsonResult = await runCli(['datasets', 'get', 'beta', '--format', 'json'], { env });
    expect(jsonResult.stdout).toMatchInlineSnapshot(`
      "{
        "meta": {
          "command": "axiom datasets get",
          "generated_at": "2026-01-05T00:00:00.000Z",
          "truncated": false,
          "rows_shown": 1,
          "rows_total": 1
        },
        "data": [
          {
            "name": "beta",
            "description": null,
            "created_at": "2026-01-03T00:00:00Z"
          }
        ]
      }
      "
    `);

    const mcpResult = await runCli(['datasets', 'get', 'beta', '--format', 'mcp'], { env });
    expect(mcpResult.exitCode).toBe(0);
    expect(mcpResult.stdout).toContain('# Dataset beta');
    expect(mcpResult.stdout).toContain('```csv');
    expect(mcpResult.stdout).toContain('beta');
    vi.useRealTimers();
  });

  it('shows a friendly not found message for missing datasets', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'dataset not found',
        }),
        { status: 404 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['datasets', 'get', 'missing-dataset', '--format', 'json'], { env });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Dataset 'missing-dataset' was not found.");
    expect(result.stderr).not.toContain('Request failed:');
  });

  it('maps dataset metadata aliases across output formats', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            dataset: {
              name: 'vercel',
              description: 'Vercel dataset',
              created: '2026-01-06T00:00:00Z',
              modified: '2026-01-07T00:00:00Z',
            },
          }),
          { status: 200 },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tableResult = await runCli(['datasets', 'get', 'vercel', '--format', 'table'], {
      stdoutIsTTY: true,
      env,
    });
    expect(tableResult.exitCode).toBe(0);
    expect(tableResult.stdout).toContain('vercel');
    expect(tableResult.stdout).toContain('Vercel dataset');
    expect(tableResult.stdout).toContain('2026-01-06T00:00:00Z');

    const csvResult = await runCli(['datasets', 'get', 'vercel', '--format', 'csv'], { env });
    expect(csvResult.exitCode).toBe(0);
    expect(csvResult.stdout).toContain('name,description,created_at');
    expect(csvResult.stdout).toContain('vercel,Vercel dataset,2026-01-06T00:00:00Z');

    const jsonResult = await runCli(['datasets', 'get', 'vercel', '--format', 'json'], { env });
    expect(jsonResult.exitCode).toBe(0);
    const parsedJson = JSON.parse(jsonResult.stdout) as {
      data: Array<{
        name: string;
        description: string | null;
        created_at: string | null;
      }>;
    };
    expect(parsedJson.data[0]).toEqual({
      name: 'vercel',
      description: 'Vercel dataset',
      created_at: '2026-01-06T00:00:00Z',
    });

    const ndjsonResult = await runCli(['datasets', 'get', 'vercel', '--format', 'ndjson'], { env });
    expect(ndjsonResult.exitCode).toBe(0);
    const parsedNdjson = JSON.parse(ndjsonResult.stdout.trim()) as {
      name: string;
      description: string | null;
      created_at: string | null;
    };
    expect(parsedNdjson).toEqual({
      name: 'vercel',
      description: 'Vercel dataset',
      created_at: '2026-01-06T00:00:00Z',
    });

    const mcpResult = await runCli(['datasets', 'get', 'vercel', '--format', 'mcp'], { env });
    expect(mcpResult.exitCode).toBe(0);
    expect(mcpResult.stdout).toContain('# Dataset vercel');
    expect(mcpResult.stdout).toContain('```csv');
    expect(mcpResult.stdout).toContain('vercel,Vercel dataset,2026-01-06T00:00:00Z');

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('preserves explicit null metadata values and ignores modified aliases', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'vercel',
          description: null,
          created_at: null,
          created: '2026-01-06T00:00:00Z',
          modified_at: null,
          modified: '2026-01-07T00:00:00Z',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['datasets', 'get', 'vercel', '--format', 'json'], { env });
    expect(result.exitCode).toBe(0);

    const parsed = JSON.parse(result.stdout) as {
      data: Array<{
        name: string;
        description: string | null;
        created_at: string | null;
      }>;
    };
    expect(parsed.data[0]).toEqual({
      name: 'vercel',
      description: null,
      created_at: null,
    });
  });

  it('renders dataset schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          fields: [
            { name: '_time', type: 'time' },
            { name: 'message', type: 'string', description: 'Message', unit: 'ms' },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['datasets', 'schema', 'alpha', '--format', 'table'], {
      stdoutIsTTY: true,
      env,
    });

    expect(result.stdout).toMatchInlineSnapshot(`
      "name     type    unit  description
      _time    time                     
      message  string  ms    Message    
      "
    `);
  });

  it('does not truncate dataset schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          fields: [
            { name: '_time', type: 'time' },
            { name: 'message', type: 'string', description: 'Message', unit: 'ms' },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await runCli(['datasets', 'schema', 'alpha', '--format', 'json'], { env });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('"truncated": false');
    expect(result.stdout).toContain('"rows_shown": 2');
    expect(result.stdout).toContain('"name": "_time"');
    expect(result.stdout).toContain('"name": "message"');
    expect(result.stdout).toContain('"unit": "ms"');
  });

  it('renders dataset sample across output formats with valid apl', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T00:00:00Z'));

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
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
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tableResult = await runCli(
      ['datasets', 'sample', 'alpha', '--format', 'table', '--since', '24h'],
      { stdoutIsTTY: true, env },
    );
    expect(tableResult.exitCode).toBe(0);
    expect(tableResult.stdout).toContain('_time');
    expect(tableResult.stdout).toContain('message');
    expect(tableResult.stdout).toContain('service');
    expect(tableResult.stdout).toContain('hello');
    expect(tableResult.stdout).toContain('svc');

    const csvResult = await runCli(
      ['datasets', 'sample', 'alpha', '--format', 'csv', '--since', '24h'],
      { env },
    );
    expect(csvResult.exitCode).toBe(0);
    expect(csvResult.stdout).toContain('_time,message,service');
    expect(csvResult.stdout).toContain('2026-01-01T00:00:00Z,hello,svc');

    const jsonResult = await runCli(
      ['datasets', 'sample', 'alpha', '--format', 'json', '--since', '24h'],
      { env },
    );
    expect(jsonResult.exitCode).toBe(0);
    const jsonSample = JSON.parse(jsonResult.stdout) as {
      meta: {
        command: string;
        time_range: { start: string; end: string };
      };
      data: Array<{ message: string }>;
    };
    expect(jsonSample.meta.command).toBe('axiom datasets sample');
    expect(jsonSample.meta.time_range.start).toBe('24h');
    expect(jsonSample.meta.time_range.end).toBe('0m');
    expect(jsonSample.data[0]?.message).toBe('hello');

    const ndjsonResult = await runCli(
      ['datasets', 'sample', 'alpha', '--format', 'ndjson', '--since', '24h'],
      { env },
    );
    expect(ndjsonResult.exitCode).toBe(0);
    expect(ndjsonResult.stdout).toContain('"_time":"2026-01-01T00:00:00Z"');
    expect(ndjsonResult.stdout).toContain('"message":"hello"');
    expect(ndjsonResult.stdout).toContain('"service":"svc"');

    const mcpResult = await runCli(
      ['datasets', 'sample', 'alpha', '--format', 'mcp', '--since', '24h'],
      { env },
    );
    expect(mcpResult.exitCode).toBe(0);
    expect(mcpResult.stdout).toContain('# Dataset alpha sample');
    expect(mcpResult.stdout).toContain('```csv');
    expect(mcpResult.stdout).toContain('2026-01-01T00:00:00Z,hello,svc');

    expect(fetchMock).toHaveBeenCalledTimes(5);
    for (const call of fetchMock.mock.calls) {
      expect(call[0]).toBe('https://api.axiom.co/v1/datasets/_apl?format=legacy');
      expect(call[1]).toEqual(
        expect.objectContaining({
          method: 'POST',
        }),
      );

      const body = JSON.parse(String(call[1]?.body)) as {
        apl: string;
        startTime: string;
        endTime: string;
      };

      expect(body.apl).toBe("['alpha'] | limit 20");
      expect(body.apl).not.toContain('range ');
      expect(body.startTime).toBe('24h');
      expect(body.endTime).toBe('0m');
    }

    vi.useRealTimers();
  });
});
