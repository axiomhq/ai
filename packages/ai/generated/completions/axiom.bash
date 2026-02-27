# shellcheck shell=bash
_axiom_completion() {
  local current
  current="${COMP_WORDS[COMP_CWORD]}"
  local words="--api-token --apl --content-encoding --content-type --continue-on-error --csv-fields --dataset --delimiter --edge-url --end --explain --file --format --label --max-bin-auto-groups --no-color --org-id --quiet --since --start --stdin --time-zone --timestamp-field --timestamp-format --token --until --url auth auto bash completion csv datasets eval fish get gzip history identity ingest json jsonl list login logout mcp monitors ndjson powershell query sample schema status switch table traces version zsh zstd"
  COMPREPLY=( $(compgen -W "$words" -- "$current") )
}
complete -F _axiom_completion axiom
