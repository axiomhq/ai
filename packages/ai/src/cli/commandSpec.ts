export type OptionSpec = {
  name: string;
  flags: string;
  description: string;
  choices?: string[];
  defaultValue?: string | number | boolean;
  helpValue?: string;
  hidden?: boolean;
};

export type CommandSpec = {
  name: string;
  description: string;
  args?: string;
  actionPath?: string;
  help?: string;
  hidden?: boolean;
  options?: OptionSpec[];
  subcommands?: CommandSpec[];
};

const formatChoices = ['auto', 'table', 'csv', 'json', 'ndjson', 'jsonl', 'mcp'];
const statusChoices = ['ok', 'error', 'unset'];

export const cliCommandSpec = {
  globalOptions: [
    {
      name: 'format',
      flags: '--format <format>',
      description: 'auto|table|csv|json|ndjson|jsonl|mcp',
      choices: formatChoices,
    },
    {
      name: 'url',
      flags: '--url <url>',
      description: 'Axiom API base URL',
    },
    {
      name: 'orgId',
      flags: '--org-id <id>',
      description: 'Organization ID',
    },
    {
      name: 'token',
      flags: '--token <token>',
      description: 'API token',
    },
    {
      name: 'timeZone',
      flags: '--time-zone <zone>',
      description: 'Time zone (local or IANA)',
      hidden: true,
    },
    {
      name: 'noColor',
      flags: '--no-color',
      description: 'Disable ANSI color',
    },
    {
      name: 'quiet',
      flags: '--quiet',
      description: 'Suppress non-data output',
    },
    {
      name: 'explain',
      flags: '--explain',
      description: 'Print API calls and queries to stderr',
    },
  ] satisfies OptionSpec[],
  commands: [
    {
      name: 'datasets',
      description: 'Discover datasets and schema',
      help: `Usage:\n  axiom datasets <command>\n\nCommands:\n  list                List datasets\n  get <name>          Show dataset metadata\n  schema <name>       Show dataset schema (fields and types)\n  sample <name>       Show a small sample of recent events\n\nGlobal options:\n  --format <format>   auto|table|csv|json|ndjson|jsonl|mcp\n  --url <url>         Axiom API base URL\n  --org-id <id>       Organization ID\n  --token <token>     API token\n  --no-color          Disable ANSI color\n  --quiet             Suppress non-data output\n  --explain           Print API calls and queries to stderr\n`,
      subcommands: [
        {
          name: 'list',
          description: 'List datasets',
        },
        {
          name: 'get',
          description: 'Show dataset metadata',
          args: '<name>',
        },
        {
          name: 'schema',
          description: 'Show dataset schema (fields and types)',
          args: '<name>',
        },
        {
          name: 'sample',
          description: 'Show a small sample of recent events',
          args: '<name>',
          options: [
            { name: 'since', flags: '--since <since>', description: 'Time range start', defaultValue: '15m' },
          ],
        },
      ],
    },
    {
      name: 'query',
      description: 'Run APL queries',
      args: '[query...]',
      actionPath: 'query',
      options: [
        {
          name: 'apl',
          flags: '--apl <string>',
          description: 'APL query string',
          hidden: true,
        },
        { name: 'file', flags: '--file <path>', description: 'Read APL from file' },
        { name: 'stdin', flags: '--stdin', description: 'Read APL from stdin' },
        {
          name: 'maxBinAutoGroups',
          flags: '--max-bin-auto-groups <n>',
          description: 'Override auto maxBinAutoGroups (positive integer)',
        },
        {
          name: 'since',
          flags: '--since <time>',
          description: 'Start time (for example: 30m or 2026-02-24T18:00:00Z)',
        },
        {
          name: 'until',
          flags: '--until <time>',
          description: 'End time (for example: 0m or 2026-02-24T19:00:00Z)',
        },
        { name: 'start', flags: '--start <time>', description: 'Alias for --since', hidden: true },
        { name: 'end', flags: '--end <time>', description: 'Alias for --until', hidden: true },
      ],
    },
    {
      name: 'monitors',
      description: 'Read monitors and run history',
      help: `Usage:\n  axiom monitors <command>\n\nCommands:\n  list                     List monitors\n  get <id>                 Show a monitor\n  history <id>             Show monitor execution history\n\nOptions:\n  --since / --until        Default since=7d for history\n  --format <format>\n  --explain\n`,
      subcommands: [
        { name: 'list', description: 'List monitors' },
        { name: 'get', description: 'Show a monitor', args: '<id>' },
        {
          name: 'history',
          description: 'Show monitor execution history',
          args: '<id>',
          options: [
            {
              name: 'since',
              flags: '--since <since>',
              description: 'Default since=7d for history',
              defaultValue: '7d',
            },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
      ],
    },
    {
      name: 'services',
      description: 'Investigate services, operations, traces, logs, and OTel dataset mappings',
      help: `Usage:\n  axiom services <command>\n\nCommands:\n  list                         List services seen in traces\n  get <service>                Show service status summary\n  operations <service>         List operations for a service\n  traces <service>             List recent traces for a service\n  logs <service>               Show recent logs for a service (if available)\n  detect                       Detect OTel datasets and field mappings\n\nCommon options:\n  --dataset <name>             Dataset override (traces commands; accepted by logs as alias)\n  --logs-dataset <name>        Logs dataset override (logs command)\n  --since / --until / --start / --end\n  --format <format>\n  --explain\n`,
      subcommands: [
        {
          name: 'list',
          description: 'List services seen in traces',
          options: [
            { name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' },
            { name: 'since', flags: '--since <since>', description: 'Time range start' },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
        {
          name: 'get',
          description: 'Show service status summary',
          args: '<service>',
          options: [
            { name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' },
            { name: 'since', flags: '--since <since>', description: 'Time range start' },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
        {
          name: 'operations',
          description: 'List operations for a service',
          args: '<service>',
          options: [
            { name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' },
            { name: 'since', flags: '--since <since>', description: 'Time range start' },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
        {
          name: 'traces',
          description: 'List recent traces for a service',
          args: '<service>',
          options: [
            { name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' },
            { name: 'since', flags: '--since <since>', description: 'Time range start' },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
        {
          name: 'logs',
          description: 'Show recent logs for a service (if available)',
          args: '<service>',
          options: [
            {
              name: 'dataset',
              flags: '--dataset <name>',
              description: 'Logs dataset override (alias for --logs-dataset)',
            },
            { name: 'logsDataset', flags: '--logs-dataset <name>', description: 'Logs dataset override' },
            { name: 'since', flags: '--since <since>', description: 'Time range start' },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
        { name: 'detect', description: 'Detect OTel datasets and field mappings' },
      ],
    },
    {
      name: 'traces',
      description: 'Trace-centric tools',
      help: `Usage:\n  axiom traces <command>\n\nCommands:\n  list                         Search recent traces\n  get <trace-id>               Show a trace tree view plus key span table\n  spans <trace-id>             Show spans as a table\n\nOptions:\n  --dataset <name>             Traces dataset override\n  --service <name>             Filter traces by service\n  --operation <name>           Filter traces by operation\n  --status <ok|error|unset>    Filter by span status where possible\n  --since / --until / --start / --end\n  --format <format>\n  --explain\n`,
      subcommands: [
        {
          name: 'list',
          description: 'Search recent traces',
          options: [
            { name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' },
            { name: 'service', flags: '--service <name>', description: 'Filter traces by service' },
            { name: 'operation', flags: '--operation <name>', description: 'Filter traces by operation' },
            {
              name: 'status',
              flags: '--status <status>',
              description: 'Filter by span status where possible',
              choices: statusChoices,
            },
            { name: 'since', flags: '--since <since>', description: 'Time range start' },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
        {
          name: 'get',
          description: 'Show a trace tree view plus key span table',
          args: '<trace-id>',
          options: [{ name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' }],
        },
        {
          name: 'spans',
          description: 'Show spans as a table',
          args: '<trace-id>',
          options: [{ name: 'dataset', flags: '--dataset <name>', description: 'Traces dataset override' }],
        },
      ],
    },
  ] satisfies CommandSpec[],
  statusChoices,
  formatChoices,
};
