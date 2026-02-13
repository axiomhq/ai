import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

const datasetHelp = `Usage:\n  axiom dataset <command>\n\nCommands:\n  list                List datasets\n  get <name>          Show dataset metadata\n  schema <name>       Show dataset schema (fields and types)\n  sample <name>       Show a small sample of recent events\n\nGlobal options:\n  --format <format>   auto|table|csv|json|ndjson|mcp\n  --max-cells <n>     Max rendered table cells (rows x columns)\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n`;

const queryHelp = `Usage:\n  axiom query <command>\n\nCommands:\n  run <dataset>                 Run an APL query against a dataset\n  saved list                     List saved queries\n  saved get <id>                 Show a saved query\n  saved run <id>                 Run a saved query\n\nOptions for query run:\n  --apl <string>                APL query string\n  --file <path>                 Read APL from file\n  --stdin                        Read APL from stdin\n  --max-bin-auto-groups <n>     Override auto maxBinAutoGroups\n  --columns <csv>               Explicit output columns\n  --limit <n>                   Limit rows (post-query shaping)\n  --since / --until / --start / --end\n  --format <format>             auto|table|csv|json|ndjson|mcp\n  --max-cells <n>\n  --explain\n`;

const monitorHelp = `Usage:\n  axiom monitor <command>\n\nCommands:\n  list                     List monitors\n  get <id>                 Show a monitor\n  history <id>             Show monitor execution history\n\nOptions:\n  --limit <n>              Default 100\n  --since / --until        Default since=7d for history\n  --format <format>\n  --max-cells <n>\n  --explain\n`;

const serviceHelp = `Usage:\n  axiom service <command>\n\nCommands:\n  list                         List services seen in traces\n  get <service>                Show service status summary\n  operations <service>         List operations for a service\n  traces <service>             List recent traces for a service\n  logs <service>               Show recent logs for a service (if available)\n  detect                       Detect OTel datasets and field mappings\n\nCommon options:\n  --dataset <name>             Traces dataset override\n  --since / --until / --start / --end\n  --limit <n>                  Default 20\n  --format <format>\n  --max-cells <n>\n  --explain\n`;

const traceHelp = `Usage:\n  axiom trace <command>\n\nCommands:\n  list                         Search recent traces\n  get <trace-id>               Show a trace tree view plus key span table\n  spans <trace-id>             Show spans as a table\n\nOptions:\n  --dataset <name>             Traces dataset override\n  --service <name>             Filter traces by service\n  --operation <name>           Filter traces by operation\n  --status <ok|error|unset>    Filter by span status where possible\n  --since / --until / --start / --end\n  --limit <n>                  Default 20\n  --format <format>\n  --max-cells <n>\n  --explain\n`;

describe('obs cli help', () => {
  it('prints top-level help with obs commands', async () => {
    const result = await runCli(['--help'], { stdoutIsTTY: true });
    expect(result.stdout).toMatchInlineSnapshot(`
      "Usage: axiom [options] [command]

      Axiom's CLI to manage your objects and run evals

      Options:
        -V, --version            output the version number
        -h, --help               display help for command

      Commands:
        auth                     Manage authentication with Axiom
        login [options]          Authenticate with Axiom
        logout [options]         Remove authentication credentials
        status                   Check authentication status for all profiles
        switch [alias]           Switch to a different profile
        eval [options] [target]  run evals locally
        version                  cli version
        dataset [options]        Discover datasets and schema
        query [options]          Run APL and work with saved queries
        monitor [options]        Read monitors and run history
        service [options]        OTel-first entry point
        trace [options]          Trace-centric tools
        help [command]           display help for command
      "
    `);
  });

  it('prints dataset help', async () => {
    const result = await runCli(['dataset', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(datasetHelp);
  });

  it('prints query help', async () => {
    const result = await runCli(['query', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(queryHelp);
  });

  it('prints monitor help', async () => {
    const result = await runCli(['monitor', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(monitorHelp);
  });

  it('prints service help', async () => {
    const result = await runCli(['service', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(serviceHelp);
  });

  it('prints trace help', async () => {
    const result = await runCli(['trace', '--help'], { stdoutIsTTY: true });
    expect(result.stdout).toBe(traceHelp);
  });
});
