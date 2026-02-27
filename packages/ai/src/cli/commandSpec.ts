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
            {
              name: 'since',
              flags: '--since <since>',
              description: 'Time range start',
              defaultValue: 'now-15m',
            },
          ],
        },
      ],
    },
    {
      name: 'ingest',
      description: 'Ingest structured data into a dataset',
      args: '<dataset>',
      actionPath: 'ingest',
      options: [
        { name: 'file', flags: '--file <path...>', description: 'File(s) to ingest (repeatable, use - for stdin)' },
        { name: 'timestampField', flags: '--timestamp-field <field>', description: 'Field to use for event timestamp' },
        { name: 'timestampFormat', flags: '--timestamp-format <format>', description: 'Timestamp format for the timestamp field' },
        { name: 'delimiter', flags: '--delimiter <delimiter>', description: 'CSV delimiter (only valid for CSV)' },
        {
          name: 'contentType',
          flags: '--content-type <type>',
          description: 'Input content type (json|ndjson|csv)',
          choices: ['json', 'ndjson', 'csv'],
        },
        {
          name: 'contentEncoding',
          flags: '--content-encoding <encoding>',
          description: 'Input content encoding (identity|gzip|zstd)',
          choices: ['identity', 'gzip', 'zstd'],
          defaultValue: 'identity',
        },
        { name: 'label', flags: '--label <key:value...>', description: 'Attach a label to all ingested events (repeatable)' },
        { name: 'csvFields', flags: '--csv-fields <field...>', description: 'CSV header fields when input has no header row' },
        { name: 'continueOnError', flags: '--continue-on-error', description: 'Continue ingesting remaining inputs after a failure' },
        { name: 'edgeUrl', flags: '--edge-url <url>', description: 'Override edge base URL for ingest requests' },
        { name: 'apiToken', flags: '--api-token <token>', description: 'Override API token for ingest requests' },
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
          description: 'Start time (for example: now-30m or 2026-02-24T18:00:00Z)',
        },
        {
          name: 'until',
          flags: '--until <time>',
          description: 'End time (for example: now or 2026-02-24T19:00:00Z)',
        },
        { name: 'edgeUrl', flags: '--edge-url <url>', description: 'Override edge base URL for this query' },
        { name: 'apiToken', flags: '--api-token <token>', description: 'Override API token for query requests' },
        { name: 'start', flags: '--start <time>', description: 'Alias for --since', hidden: true },
        { name: 'end', flags: '--end <time>', description: 'Alias for --until', hidden: true },
      ],
    },
    {
      name: 'monitors',
      description: 'Read monitors and run history',
      help: `Usage:\n  axiom monitors <command>\n\nCommands:\n  list                     List monitors\n  get <id>                 Show a monitor\n  history <id>             Show monitor execution history\n\nOptions:\n  --since / --until        Default since=now-7d for history\n  --format <format>\n  --explain\n`,
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
              description: 'Default since=now-7d for history',
              defaultValue: 'now-7d',
            },
            { name: 'until', flags: '--until <until>', description: 'Time range end' },
            { name: 'start', flags: '--start <start>', description: 'Absolute start time' },
            { name: 'end', flags: '--end <end>', description: 'Absolute end time' },
          ],
        },
      ],
    },
    {
      name: 'traces',
      description: 'Trace-centric tools',
      help: `Usage:\n  axiom traces <command>\n\nCommands:\n  get <trace-id>               Show a trace tree view with span IDs\n\nOptions:\n  --dataset <name>             Required dataset containing the trace\n  --since <since>              Required query start time\n  --until <until>              Required query end time\n  --format <format>\n  --explain\n`,
      subcommands: [
        {
          name: 'get',
          description: 'Show a trace tree view with span IDs',
          args: '<trace-id>',
          options: [
            { name: 'dataset', flags: '--dataset <name>', description: 'Required dataset containing the trace' },
            { name: 'since', flags: '--since <since>', description: 'Required query start time' },
            { name: 'until', flags: '--until <until>', description: 'Required query end time' },
            { name: 'start', flags: '--start <start>', description: 'Alias for --since', hidden: true },
            { name: 'end', flags: '--end <end>', description: 'Alias for --until', hidden: true },
          ],
        },
      ],
    },
  ] satisfies CommandSpec[],
  formatChoices,
};
