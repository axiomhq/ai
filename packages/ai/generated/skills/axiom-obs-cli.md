# Axiom Observability CLI skill

You can use the `axiom` CLI to investigate Axiom datasets and OpenTelemetry traces in a read-only way.

## Output mode
Prefer MCP-friendly output for analysis:
- Use `--format mcp` for compact Markdown plus CSV blocks.
- Use `--format json` or `--format ndjson` when you need strict machine parsing.

If a command fails due to missing datasets or fields:
1. Run: `axiom service detect --format mcp --explain`
2. Re-run the command with `--dataset <name>` (and `--logs-dataset <name>` for logs).

## Authentication checks
Before running queries:
- `axiom auth status`
If not logged in:
- `axiom auth login`

## Primary investigation workflows

### 1) Find what services exist
- `axiom service list --since 30m --format mcp`

### 2) Get a service status summary
- `axiom service get <service> --since 30m --format mcp`

### 3) List operations for a service
- `axiom service operations <service> --since 30m --format mcp`

### 4) Find recent failing traces for a service
- `axiom service traces <service> --since 30m --format mcp`

### 5) Inspect a trace
- `axiom trace get <trace-id> --format mcp`
- If you need a table of all spans:
  - `axiom trace spans <trace-id> --format mcp`

### 6) Use raw APL when needed
- `axiom query run <dataset> --apl "<APL>" --format mcp --explain`

## Commands

### dataset
- `axiom dataset list`
- `axiom dataset get <name>`
- `axiom dataset schema <name>`
- `axiom dataset sample <name>`

### query
- `axiom query run <dataset> --apl "<APL>"`
- `axiom query saved list`
- `axiom query saved get <id>`
- `axiom query saved run <id>`

### monitor
- `axiom monitor list`
- `axiom monitor get <id>`
- `axiom monitor history <id>`

### service (OpenTelemetry)
- `axiom service detect`
- `axiom service list`
- `axiom service get <service>`
- `axiom service operations <service>`
- `axiom service traces <service>`
- `axiom service logs <service>`

### trace (OpenTelemetry)
- `axiom trace list`
- `axiom trace get <trace-id>`
- `axiom trace spans <trace-id>`

## Safety and scope
All commands in this skill are read-only. Do not attempt to create, update, or delete Axiom resources via this CLI workflow.
