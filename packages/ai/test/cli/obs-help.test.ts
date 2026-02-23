import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

const datasetHelp = `Usage:\n  axiom datasets <command>\n\nCommands:\n  list                List datasets\n  get <name>          Show dataset metadata\n  schema <name>       Show dataset schema (fields and types)\n  sample <name>       Show a small sample of recent events\n\nGlobal options:\n  --format <format>   auto|table|csv|json|ndjson|mcp\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n`;

const queryHelp = `Usage:\n  axiom query <command>\n\nCommands:\n  run [dataset]                 Run an APL query (dataset optional)\n\nOptions for query run:\n  --apl <string>                APL query string\n  --file <path>                 Read APL from file\n  --stdin                        Read APL from stdin\n  --max-bin-auto-groups <n>     Override auto maxBinAutoGroups (positive integer)\n  --columns <csv>               Explicit output columns\n  --limit <n>                   Limit rows (post-query shaping, positive integer)\n  --since / --until / --start / --end\n  --format <format>             auto|table|csv|json|ndjson|mcp\n  --max-cells <n>               Max rendered cells (rows x columns, positive integer)\n  --explain\n`;

const monitorHelp = `Usage:\n  axiom monitors <command>\n\nCommands:\n  list                     List monitors\n  get <id>                 Show a monitor\n  history <id>             Show monitor execution history\n\nOptions:\n  --since / --until        Default since=7d for history\n  --format <format>\n  --explain\n`;

const serviceHelp = `Usage:\n  axiom services <command>\n\nCommands:\n  list                         List services seen in traces\n  get <service>                Show service status summary\n  operations <service>         List operations for a service\n  traces <service>             List recent traces for a service\n  logs <service>               Show recent logs for a service (if available)\n  detect                       Detect OTel datasets and field mappings\n\nCommon options:\n  --dataset <name>             Dataset override (traces commands; accepted by logs as alias)\n  --logs-dataset <name>        Logs dataset override (logs command)\n  --since / --until / --start / --end\n  --format <format>\n  --explain\n`;

const traceHelp = `Usage:\n  axiom traces <command>\n\nCommands:\n  list                         Search recent traces\n  get <trace-id>               Show a trace tree view plus key span table\n  spans <trace-id>             Show spans as a table\n\nOptions:\n  --dataset <name>             Traces dataset override\n  --service <name>             Filter traces by service\n  --operation <name>           Filter traces by operation\n  --status <ok|error|unset>    Filter by span status where possible\n  --since / --until / --start / --end\n  --format <format>\n  --explain\n`;

describe('obs cli help', () => {
  it('prints top-level help with obs commands', async () => {
    const result = await runCli(['--help'], { stdoutIsTTY: true });
    expect(result.stdout).not.toContain('dashboard');
    expect(result.stdout).not.toContain('metrics');
    expect(result.stdout).toMatchInlineSnapshot(`
      "Usage: axiom [options] [command]

      Axiom's CLI to manage your objects and run evals

      Options:
        -V, --version             output the version number
        -h, --help                display help for command

      Commands:
        auth                            Manage authentication with Axiom
        completion  <shell>             Print shell completion script
        datasets    [options]           Discover datasets and schema
        eval        [options] [target]  run evals locally
        help        [command]           display help for command
        login       [options]           Authenticate with Axiom
        logout      [options]           Remove authentication credentials
        monitors    [options]           Read monitors and run history
        query       [options]           Run APL queries
        services    [options]           Investigate services, operations, traces, logs, and OTel dataset mappings
        status                          Check authentication status for all profiles
        switch      [alias]             Switch to a different profile
        traces      [options]           Trace-centric tools
        version                         cli version
      "
    `);
  });

  it('prints dataset help', async () => {
    const result = await runCli(['datasets', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(datasetHelp);
  });

  it('prints query help', async () => {
    const result = await runCli(['query', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(queryHelp);
  });

  it('prints monitor help', async () => {
    const result = await runCli(['monitors', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(monitorHelp);
  });

  it('prints service help', async () => {
    const result = await runCli(['services', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(serviceHelp);
  });

  it('prints trace help', async () => {
    const result = await runCli(['traces', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(traceHelp);
  });
});
