export const SERVICE_LIST_APL_TEMPLATE = `let start = datetime(\${START});
let end = datetime(\${END});
range start to end
| summarize spans=count(), last_seen=max(_time), error_spans=countif(\${STATUS_FIELD} == "error"), p95_ms=percentile(\${DURATION_FIELD}, 95) by service=\${SERVICE_FIELD}
| extend error_rate = iff(spans > 0, error_spans * 1.0 / spans, 0)
| project service, last_seen, spans, error_spans, error_rate, p95_ms`;

export const SERVICE_OPERATIONS_APL_TEMPLATE = `let start = datetime(\${START});
let end = datetime(\${END});
range start to end
| where \${SERVICE_FIELD} == "\${SERVICE}"
| summarize spans=count(), last_seen=max(_time), error_spans=countif(\${STATUS_FIELD} == "error"), p95_ms=percentile(\${DURATION_FIELD}, 95) by operation=\${SPAN_NAME_FIELD}
| extend error_rate = iff(spans > 0, error_spans * 1.0 / spans, 0)
| project operation, spans, error_spans, error_rate, p95_ms, last_seen`;

export const SERVICE_SUMMARY_APL_TEMPLATE = `let start = datetime(\${START});
let end = datetime(\${END});
range start to end
| where \${SERVICE_FIELD} == "\${SERVICE}"
| summarize spans=count(), last_seen=max(_time), error_spans=countif(\${STATUS_FIELD} == "error"), p50_ms=percentile(\${DURATION_FIELD}, 50), p95_ms=percentile(\${DURATION_FIELD}, 95)`;

export const SERVICE_TRACES_APL_TEMPLATE = `let start = datetime(\${START});
let end = datetime(\${END});
range start to end
| where \${SERVICE_FIELD} == "\${SERVICE}"
| summarize started_at=min(_time), root_operation=min(\${SPAN_NAME_FIELD}), duration_ms=max(\${DURATION_FIELD}), span_count=count(), error=max(iif(\${ERROR_EXPR}, 1, 0)) by trace_id=\${TRACE_ID_FIELD}
| project trace_id, root_operation, started_at, duration_ms, span_count, error`;

export const SERVICE_LOGS_APL_TEMPLATE = `let start = datetime(\${START});
let end = datetime(\${END});
range start to end
| where \${SERVICE_FIELD} == "\${SERVICE}"
| project _time, severity=\${SEVERITY_FIELD}, message=\${MESSAGE_FIELD}, trace_id=\${TRACE_ID_FIELD}
| sort by _time desc
| limit \${LIMIT}`;
