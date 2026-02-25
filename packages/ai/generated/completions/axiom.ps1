Register-ArgumentCompleter -Native -CommandName axiom -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)

  $values = @(
    '--apl',
    '--dataset',
    '--end',
    '--explain',
    '--file',
    '--format',
    '--logs-dataset',
    '--max-bin-auto-groups',
    '--no-color',
    '--operation',
    '--org-id',
    '--quiet',
    '--service',
    '--since',
    '--start',
    '--status',
    '--stdin',
    '--time-zone',
    '--token',
    '--until',
    '--url',
    'auth',
    'auto',
    'bash',
    'completion',
    'csv',
    'datasets',
    'detect',
    'error',
    'eval',
    'fish',
    'get',
    'history',
    'json',
    'jsonl',
    'list',
    'login',
    'logout',
    'logs',
    'mcp',
    'monitors',
    'ndjson',
    'ok',
    'operations',
    'powershell',
    'query',
    'sample',
    'schema',
    'services',
    'spans',
    'status',
    'switch',
    'table',
    'traces',
    'unset',
    'version',
    'zsh'
  )

  $values |
    Where-Object { $_ -like "$wordToComplete*" } |
    ForEach-Object {
      [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}
