import { describe, expect, it } from 'vitest';
import { runCli } from '../helpers/runCli';

const datasetHelp = `Discover datasets and schema\n\nUSAGE\n  axiom datasets <command> [flags]\n\nAVAILABLE COMMANDS\n  list:           List datasets\n  get <name>:     Show dataset metadata\n  schema <name>:  Show dataset schema (fields and types)\n  sample <name>:  Show a small sample of recent events\n\nINHERITED FLAGS\n  --format <format>   auto|table|csv|json|ndjson|jsonl|mcp\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n\nLEARN MORE\n  Use \`axiom datasets <command> --help\` for more information about a command.\n`;

const queryHelp = `Run APL queries\n\nUSAGE\n  axiom query [query...] [flags]\n\nFLAGS\n  --file <path>               Read APL from file\n  --stdin                     Read APL from stdin\n  --max-bin-auto-groups <n>   Override auto maxBinAutoGroups (positive integer)\n  --since <time>              Start time (for example: 30m or 2026-02-24T18:00:00Z)\n  --until <time>              End time (for example: 0m or 2026-02-24T19:00:00Z)\n  --format <format>           auto|table|csv|json|ndjson|jsonl|mcp\n  --url <url>                 Axiom API base URL\n  --org-id <id>               Organization ID\n  --token <token>             API token\n  --no-color                  Disable ANSI color\n  --quiet                     Suppress non-data output\n  --explain                   Print API calls and queries to stderr\n\nLEARN MORE\n  Use \`axiom query --help\` for more information about this command.\n`;

const monitorHelp = `Read monitors and run history\n\nUSAGE\n  axiom monitors <command> [flags]\n\nAVAILABLE COMMANDS\n  list:          List monitors\n  get <id>:      Show a monitor\n  history <id>:  Show monitor execution history\n\nINHERITED FLAGS\n  --format <format>   auto|table|csv|json|ndjson|jsonl|mcp\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n\nLEARN MORE\n  Use \`axiom monitors <command> --help\` for more information about a command.\n`;

const serviceHelp = `Investigate services, operations, traces, logs, and OTel dataset mappings\n\nUSAGE\n  axiom services <command> [flags]\n\nAVAILABLE COMMANDS\n  list:                  List services seen in traces\n  get <service>:         Show service status summary\n  operations <service>:  List operations for a service\n  traces <service>:      List recent traces for a service\n  logs <service>:        Show recent logs for a service (if available)\n  detect:                Detect OTel datasets and field mappings\n\nINHERITED FLAGS\n  --format <format>   auto|table|csv|json|ndjson|jsonl|mcp\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n\nLEARN MORE\n  Use \`axiom services <command> --help\` for more information about a command.\n`;

const traceHelp = `Trace-centric tools\n\nUSAGE\n  axiom traces <command> [flags]\n\nAVAILABLE COMMANDS\n  list:              Search recent traces\n  get <trace-id>:    Show a trace tree view plus key span table\n  spans <trace-id>:  Show spans as a table\n\nINHERITED FLAGS\n  --format <format>   auto|table|csv|json|ndjson|jsonl|mcp\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n\nLEARN MORE\n  Use \`axiom traces <command> --help\` for more information about a command.\n`;

describe('cli command help', () => {
  it('prints top-level help with cli commands', async () => {
    const result = await runCli(['--help'], { stdoutIsTTY: true });
    expect(result.stdout).not.toContain('dashboard');
    expect(result.stdout).not.toContain('metrics');
    expect(result.stdout).toMatchInlineSnapshot(`
      "Axiom CLI

      USAGE
        axiom <command> [flags]

      CORE COMMANDS
        auth:      Manage authentication with Axiom
        datasets:  Discover datasets and schema
        eval:      run evals locally
        monitors:  Read monitors and run history
        query:     Run APL queries
        services:  Investigate services, operations, traces, logs, and OTel dataset mappings
        traces:    Trace-centric tools

      ADDITIONAL COMMANDS
        completion:  Print shell completion script
        help:        display help for command
        login:       Authenticate with Axiom
        logout:      Remove authentication credentials
        status:      Check authentication status for all profiles
        switch:      Switch to a different profile
        version:     cli version

      FLAGS
        -V, --version   Show axiom version
        -h, --help      Show help for command

      LEARN MORE
        Use \`axiom <command> --help\` for more information about a command.
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
