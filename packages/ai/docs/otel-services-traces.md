# OTel Services and Traces Learnings

This note captures the design learnings from the first pass of service/trace investigation tooling.

## Region-aware querying

- Dataset metadata includes `region`.
- Region-to-endpoint mapping comes from `GET /api/internal/regions`.
- For multi-dataset OTel queries, group datasets by region and execute one query per edge endpoint.
- Merge rows client-side after per-region query responses.

## Dataset selection heuristics

- Do not assume dataset appears first in APL.
- Prefer selecting the earliest known dataset token in the query text.
- Use cached dataset metadata for matching.
- Keep this as a temporary heuristic until AST-based resolution is available.

## Service discovery shape

Useful aggregate for service inventory:

```apl
union ['otel-demo-genai'], ['otel-demo-traces'], ['mcp-otel-traces'], ['bsky-otel']
| summarize total=count(), errored=countif(['status.code'] == "ERROR"), avg(duration) by _source, ['service.name']
| project _source, service=['service.name'], total, errored, error_rate=(errored/toreal(total)), avg_duration=avg_duration
```

Implementation notes:

- `_source` may be compressed and should be mapped back to dataset name where possible.
- Duration is often nanoseconds; table output should show a human-friendly duration.

## Service drill-down shape

For service + operation drill-down, fetch:

- last 5 traces
- last 5 errored traces (`['status.code'] == "ERROR"`)

This keeps output actionable while bounded.

## Trace rendering

- Tree rendering is more useful than flat span tables for human inspection.
- Keep full `span_id` visible in a fixed right column.
- Truncate only the left tree label when width is constrained.
- Mark error spans inline (`(!)`) from `status.code == ERROR`.
