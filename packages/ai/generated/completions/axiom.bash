# shellcheck shell=bash
_axiom_completion() {
  local current
  current="${COMP_WORDS[COMP_CWORD]}"
  local words="--apl --dataset --end --explain --file --format --logs-dataset --max-bin-auto-groups --no-color --operation --org-id --quiet --service --since --start --status --stdin --time-zone --token --until --url auth auto bash completion csv datasets detect error eval fish get history json jsonl list login logout logs mcp monitors ndjson ok operations powershell query sample schema services spans status switch table traces unset version zsh"
  COMPREPLY=( $(compgen -W "$words" -- "$current") )
}
complete -F _axiom_completion axiom
