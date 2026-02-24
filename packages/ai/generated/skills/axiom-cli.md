# Axiom CLI

## Output mode
Prefer MCP-friendly output for analysis:
- Use `--format mcp` for compact Markdown plus CSV blocks.
- Use `--format json` or `--format ndjson` when you need strict machine parsing.

If a command fails due to missing datasets or fields:
1. Run: `axiom services detect --format mcp --explain`
2. Re-run the command with `--dataset <name>` (and `--logs-dataset <name>` for logs).

## Authentication checks
Before running queries:
- `axiom auth status`
If not logged in:
- `axiom auth login`

## Primary investigation workflows

### 1) Find what services exist
- `axiom services list --since 30m --format mcp`

### 2) Get a service status summary
- `axiom services get <service> --since 30m --format mcp`

### 3) List operations for a service
- `axiom services operations <service> --since 30m --format mcp`

### 4) Find recent failing traces for a service
- `axiom services traces <service> --since 30m --format mcp`

### 5) Inspect a trace
- `axiom traces get <trace-id> --format mcp`
- If you need a table of all spans:
  - `axiom traces spans <trace-id> --format mcp`

### 6) Use raw APL when needed
- `axiom query run --apl "<APL>" --format mcp --explain`

## Commands

### dataset
- `axiom datasets list`
- `axiom datasets get <name>`
- `axiom datasets schema <name>`
- `axiom datasets sample <name>`

### query
- `axiom query run --apl "<APL>"`

### monitor
- `axiom monitors list`
- `axiom monitors get <id>`
- `axiom monitors history <id>`

### service (OpenTelemetry)
- `axiom services detect`
- `axiom services list`
- `axiom services get <service>`
- `axiom services operations <service>`
- `axiom services traces <service>`
- `axiom services logs <service>`

### trace (OpenTelemetry)
- `axiom traces list`
- `axiom traces get <trace-id>`
- `axiom traces spans <trace-id>`

## Safety and scope
All commands in this skill are read-only. Do not attempt to create, update, or delete Axiom resources via this CLI workflow.
