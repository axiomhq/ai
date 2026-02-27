export const SERVICE_LIST_APL_TEMPLATE = `union \${UNION_SOURCES}
| summarize total=count(), errored=countif(tolower(tostring(__status)) == "error"), avg_duration_ns=avg(__duration_ns) by service
| extend error_rate = iff(total > 0, errored * 1.0 / total, 0)
| project service, total, errored, error_rate, avg_duration_ns`;

export const SERVICE_GET_OPERATIONS_APL_TEMPLATE = `union \${UNION_SOURCES}
| where service == \${SERVICE}
\${OPERATION_FILTER}
| summarize total=count(), errored=countif(tolower(tostring(__status)) == "error"), avg_duration_ns=avg(__duration_ns) by _source, operation
| extend error_rate = iff(total > 0, errored * 1.0 / total, 0)
| project _source, operation, total, errored, error_rate, avg_duration_ns`;

export const SERVICE_GET_RECENT_TRACES_APL_TEMPLATE = `union \${UNION_SOURCES}
| where service == \${SERVICE}
| where operation == \${OPERATION}
| where isnotempty(trace_id)
| summarize started_at=max(_time), duration_ns=max(__duration_ns), span_count=count(), errored_spans=countif(toupper(tostring(__status)) == "ERROR") by _source, trace_id
| extend error = errored_spans > 0
| sort by started_at desc
| limit 5
| project _source, trace_id, started_at, duration_ns, span_count, errored_spans, error`;

export const SERVICE_GET_ERRORED_TRACES_APL_TEMPLATE = `union \${UNION_SOURCES}
| where service == \${SERVICE}
| where operation == \${OPERATION}
| where isnotempty(trace_id)
| where toupper(tostring(__status)) == "ERROR"
| summarize started_at=max(_time), duration_ns=max(__duration_ns), span_count=count() by _source, trace_id
| extend error = true, errored_spans = span_count
| sort by started_at desc
| limit 5
| project _source, trace_id, started_at, duration_ns, span_count, errored_spans, error`;

export const SERVICE_OPERATIONS_APL_TEMPLATE = `where \${SERVICE_FIELD} == \${SERVICE}
| summarize spans=count(), last_seen=max(_time), error_spans=countif(\${STATUS_FIELD} == "error"), p95_ms=percentile(\${DURATION_FIELD}, 95) by operation=\${SPAN_NAME_FIELD}
| extend error_rate = iff(spans > 0, error_spans * 1.0 / spans, 0)
| project operation, spans, error_spans, error_rate, p95_ms, last_seen`;

export const SERVICE_SUMMARY_APL_TEMPLATE = `where \${SERVICE_FIELD} == \${SERVICE}
| summarize spans=count(), last_seen=max(_time), error_spans=countif(\${STATUS_FIELD} == "error"), p50_ms=percentile(\${DURATION_FIELD}, 50), p95_ms=percentile(\${DURATION_FIELD}, 95)`;

export const SERVICE_TRACES_APL_TEMPLATE = `where \${SERVICE_FIELD} == \${SERVICE}
| summarize started_at=min(_time), duration_ms=max(\${DURATION_FIELD}), span_count=count(), error=max(iff(\${ERROR_EXPR}, 1, 0)) by trace_id=\${TRACE_ID_FIELD}
| extend root_operation=""
| project trace_id, root_operation, started_at, duration_ms, span_count, error`;

export const SERVICE_LOGS_APL_TEMPLATE = `let start = datetime(\${START});
let end = datetime(\${END});
where _time >= start and _time <= end
| where \${SERVICE_FIELD} == \${SERVICE}
| project _time, severity=\${SEVERITY_FIELD}, message=\${MESSAGE_FIELD}, trace_id=\${TRACE_ID_FIELD}
| sort by _time desc
| limit \${LIMIT}`;

export const TRACE_LIST_APL_TEMPLATE = `\${FILTERS}summarize started_at=min(_time), duration_ms=max(\${DURATION_FIELD}), span_count=count(), error=max(iff(\${ERROR_EXPR}, 1, 0)) by trace_id=\${TRACE_ID_FIELD}
| extend root_operation=""
| project trace_id, root_operation, started_at, duration_ms, span_count, error`;

export const TRACE_SPANS_APL_TEMPLATE = `\${FILTER}
| project start=_time, duration_ms=\${DURATION_FIELD}, service=\${SERVICE_FIELD}, operation=\${SPAN_NAME_FIELD}, kind=\${SPAN_KIND_FIELD}, status=\${STATUS_FIELD}, span_id=\${SPAN_ID_FIELD}, parent_span_id=\${PARENT_SPAN_ID_FIELD}
| sort by start asc, duration_ms desc`;
