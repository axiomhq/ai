# shellcheck shell=bash
_axiom_completion() {
  local current
  current="${COMP_WORDS[COMP_CWORD]}"
  local words="--apl --columns --dataset --end --explain --file --format --limit --logs-dataset --max-bin-auto-groups --max-cells --no-color --operation --org-id --quiet --service --since --start --status --stdin --time-zone --token --until --url auth auto bash completion csv dataset detect error eval fish get history json list login logout logs mcp monitor ndjson ok operations powershell query run sample saved schema service spans status switch table trace traces unset version zsh"
  COMPREPLY=( $(compgen -W "$words" -- "$current") )
}
complete -F _axiom_completion axiom
