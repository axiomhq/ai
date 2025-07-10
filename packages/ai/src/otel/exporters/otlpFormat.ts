import type { LocalSpanData } from '../localSpan';
import { SpanKind } from '@opentelemetry/api';

/**
 * OTLP span format based on OpenTelemetry protobuf definitions
 */
export interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano?: string;
  attributes: OtlpAttribute[];
  events: OtlpEvent[];
  status: OtlpStatus;
  links: OtlpLink[];
}

export interface OtlpAttribute {
  key: string;
  value: OtlpAttributeValue;
}

export interface OtlpAttributeValue {
  stringValue?: string;
  intValue?: string;
  doubleValue?: number;
  boolValue?: boolean;
  arrayValue?: OtlpArrayValue;
}

export interface OtlpArrayValue {
  values: OtlpAttributeValue[];
}

export interface OtlpEvent {
  name: string;
  timeUnixNano: string;
  attributes: OtlpAttribute[];
}

export interface OtlpStatus {
  code: number;
  message?: string;
}

export interface OtlpLink {
  traceId: string;
  spanId: string;
  attributes: OtlpAttribute[];
}

export interface OtlpResourceSpans {
  resource: {
    attributes: OtlpAttribute[];
  };
  instrumentationLibrarySpans: {
    instrumentationLibrary: {
      name: string;
      version: string;
    };
    spans: OtlpSpan[];
  }[];
}

export interface OtlpTraceData {
  resourceSpans: OtlpResourceSpans[];
}

/**
 * Convert milliseconds to nanoseconds as string
 */
function msToNanos(ms: number): string {
  return (ms * 1_000_000).toString();
}

/**
 * Convert SpanKind enum to OTLP span kind number
 */
function spanKindToOtlp(kind: SpanKind): number {
  switch (kind) {
    case SpanKind.INTERNAL: return 1; // INTERNAL
    case SpanKind.SERVER: return 2; // SERVER
    case SpanKind.CLIENT: return 3; // CLIENT
    case SpanKind.PRODUCER: return 4; // PRODUCER
    case SpanKind.CONSUMER: return 5; // CONSUMER
    default: return 0; // UNSPECIFIED
  }
}

/**
 * Convert attribute value to OTLP format
 */
function attributeValueToOtlp(value: any): OtlpAttributeValue {
  if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    return Number.isInteger(value) ? { intValue: value.toString() } : { doubleValue: value };
  } else if (typeof value === 'boolean') {
    return { boolValue: value };
  } else if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(v => attributeValueToOtlp(v))
      }
    };
  } else {
    // Convert other types to string
    return { stringValue: String(value) };
  }
}

/**
 * Convert attributes object to OTLP format
 */
function attributesToOtlp(attributes: Record<string, any>): OtlpAttribute[] {
  return Object.entries(attributes).map(([key, value]) => ({
    key,
    value: attributeValueToOtlp(value)
  }));
}

/**
 * Convert status to OTLP format
 */
function statusToOtlp(status?: { code: number; message?: string }): OtlpStatus {
  if (!status) {
    return { code: 1 }; // OK
  }
  return {
    code: status.code,
    message: status.message
  };
}

/**
 * Convert LocalSpanData to OTLP span format
 */
export function localSpanToOtlp(span: LocalSpanData): OtlpSpan {
  return {
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    name: span.name,
    kind: spanKindToOtlp(span.kind),
    startTimeUnixNano: msToNanos(span.startTime),
    endTimeUnixNano: span.endTime ? msToNanos(span.endTime) : undefined,
    attributes: attributesToOtlp(span.attributes),
    events: span.events.map(event => ({
      name: event.name,
      timeUnixNano: msToNanos(event.time),
      attributes: attributesToOtlp(event.attributes || {})
    })),
    status: statusToOtlp(span.status),
    links: span.links.map(link => ({
      traceId: link.context.traceId,
      spanId: link.context.spanId,
      attributes: attributesToOtlp(link.attributes || {})
    }))
  };
}

/**
 * Convert array of LocalSpanData to OTLP trace data format
 */
export function localSpansToOtlpTraceData(spans: LocalSpanData[]): OtlpTraceData {
  const otlpSpans = spans.map(localSpanToOtlp);
  
  return {
    resourceSpans: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: 'axiom-ai' } },
          { key: 'service.version', value: { stringValue: '0.0.1' } },
          { key: 'telemetry.sdk.name', value: { stringValue: 'axiom-ai' } },
          { key: 'telemetry.sdk.version', value: { stringValue: '0.0.1' } }
        ]
      },
      instrumentationLibrarySpans: [{
        instrumentationLibrary: {
          name: '@axiomhq/ai',
          version: '0.0.1'
        },
        spans: otlpSpans
      }]
    }]
  };
}

/**
 * Convert OTLP trace data to JSON string for HTTP transport
 */
export function otlpTraceDataToJson(data: OtlpTraceData): string {
  return JSON.stringify(data);
}
