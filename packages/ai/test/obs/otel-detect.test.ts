import { describe, expect, it } from 'vitest';
import { mapOtelFields } from '../../src/obs/otel/fieldMapping';
import {
  buildTraceTieWarning,
  detectOtelDatasets,
  requireOtelFields,
} from '../../src/obs/otel/detectDatasets';

describe('otel mapping and dataset detection', () => {
  it('selects field mapping by priority order', () => {
    const map = mapOtelFields([
      'resource.service.name',
      'service.name',
      'trace.id',
      'trace_id',
      'span.id',
      'span_id',
      'status',
      'status.code',
      'duration',
      'duration_ms',
    ]);

    expect(map).toEqual({
      serviceField: 'service.name',
      traceIdField: 'trace_id',
      spanIdField: 'span_id',
      parentSpanIdField: null,
      spanNameField: null,
      spanKindField: null,
      statusField: 'status.code',
      durationField: 'duration_ms',
      timestampField: '_time',
    });
  });

  it('detects deterministic trace and logs datasets with tie break', () => {
    const result = detectOtelDatasets({
      zeta_traces: ['trace_id', 'span_id', 'service.name', 'name', 'duration_ms', 'status.code'],
      alpha_traces: ['trace_id', 'span_id', 'service.name', 'name', 'duration_ms', 'status.code'],
      logs: ['service.name', 'trace_id', 'severity_text', 'message'],
    });

    expect(result.traces?.dataset).toBe('alpha_traces');
    expect(result.traces?.score).toBe(18);
    expect(result.traceTies).toEqual(['alpha_traces', 'zeta_traces']);
    expect(result.logs?.dataset).toBe('logs');
    expect(result.logs?.score).toBe(10);

    expect(buildTraceTieWarning(result.traceTies, result.traces!.dataset)).toBe(
      'warning: multiple trace datasets detected: alpha_traces, zeta_traces. using alpha_traces. set --dataset to override.',
    );
  });

  it('returns null when no dataset reaches thresholds', () => {
    const result = detectOtelDatasets({
      app: ['_time', 'message'],
    });

    expect(result.traces).toBeNull();
    expect(result.logs).toBeNull();
  });

  it('throws required-field error with service detect guidance', () => {
    expect(() =>
      requireOtelFields(
        'traces',
        {
          serviceField: 'service.name',
          traceIdField: null,
          spanIdField: 'span_id',
          parentSpanIdField: null,
          spanNameField: 'name',
          spanKindField: null,
          statusField: 'status.code',
          durationField: 'duration_ms',
          timestampField: '_time',
        },
        ['traceIdField', 'spanIdField'],
      ),
    ).toThrow(
      'Dataset traces is missing required fields: traceIdField. Run `axiom services detect --explain` to inspect mappings.',
    );
  });
});
