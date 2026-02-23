#compdef axiom

_axiom_completion() {
  local -a words
  words=('--apl' '--columns' '--dataset' '--end' '--explain' '--file' '--format' '--limit' '--logs-dataset' '--max-bin-auto-groups' '--max-cells' '--no-color' '--operation' '--org-id' '--quiet' '--service' '--since' '--start' '--status' '--stdin' '--time-zone' '--token' '--until' '--url' 'auth' 'auto' 'bash' 'completion' 'csv' 'datasets' 'detect' 'error' 'eval' 'fish' 'get' 'history' 'json' 'list' 'login' 'logout' 'logs' 'mcp' 'monitors' 'ndjson' 'ok' 'operations' 'powershell' 'query' 'run' 'sample' 'schema' 'services' 'spans' 'status' 'switch' 'table' 'traces' 'unset' 'version' 'zsh')
  _describe 'value' words
}

compdef _axiom_completion axiom
