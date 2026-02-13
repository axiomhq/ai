import type { OtelFieldMap } from './types';

const SERVICE_CANDIDATES = [
  'service.name',
  'resource.service.name',
  'resource.attributes.service.name',
];
const TRACE_ID_CANDIDATES = ['trace_id', 'trace.id', 'traceId'];
const SPAN_ID_CANDIDATES = ['span_id', 'span.id', 'spanId'];
const PARENT_SPAN_ID_CANDIDATES = ['parent_span_id', 'parent.id', 'parentSpanId'];
const SPAN_NAME_CANDIDATES = ['name', 'span.name'];
const SPAN_KIND_CANDIDATES = ['kind', 'span.kind'];
const STATUS_CANDIDATES = ['status.code', 'otel.status_code', 'status'];
const DURATION_CANDIDATES = ['duration_ms', 'duration', 'duration_nanos'];

const findFirst = (fields: Set<string>, candidates: string[]) => {
  for (const candidate of candidates) {
    if (fields.has(candidate)) {
      return candidate;
    }
  }
  return null;
};

export const mapOtelFields = (schemaFields: string[]): OtelFieldMap => {
  const fieldSet = new Set(schemaFields);

  return {
    serviceField: findFirst(fieldSet, SERVICE_CANDIDATES),
    traceIdField: findFirst(fieldSet, TRACE_ID_CANDIDATES),
    spanIdField: findFirst(fieldSet, SPAN_ID_CANDIDATES),
    parentSpanIdField: findFirst(fieldSet, PARENT_SPAN_ID_CANDIDATES),
    spanNameField: findFirst(fieldSet, SPAN_NAME_CANDIDATES),
    spanKindField: findFirst(fieldSet, SPAN_KIND_CANDIDATES),
    statusField: findFirst(fieldSet, STATUS_CANDIDATES),
    durationField: findFirst(fieldSet, DURATION_CANDIDATES),
    timestampField: '_time',
  };
};

export const TRACE_FIELD_CANDIDATES = {
  service: SERVICE_CANDIDATES,
  traceId: TRACE_ID_CANDIDATES,
  spanId: SPAN_ID_CANDIDATES,
  spanName: SPAN_NAME_CANDIDATES,
  status: STATUS_CANDIDATES,
  duration: DURATION_CANDIDATES,
};
