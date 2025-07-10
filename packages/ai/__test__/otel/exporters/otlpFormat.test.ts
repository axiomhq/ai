import { describe, it, expect } from 'vitest';
import { SpanKind } from '@opentelemetry/api';
import { 
  localSpanToOtlp, 
  localSpansToOtlpTraceData, 
  otlpTraceDataToJson 
} from '../../../src/otel/exporters/otlpFormat';
import type { LocalSpanData } from '../../../src/otel/localSpan';

describe('OTLP Format Conversion', () => {
  const mockSpanData: LocalSpanData = {
    name: 'test-span',
    startTime: 1000,
    endTime: 2000,
    attributes: { 
      'string.attr': 'value',
      'number.attr': 42,
      'boolean.attr': true,
      'array.attr': ['a', 'b', 'c']
    },
    status: { code: 1, message: 'OK' },
    kind: SpanKind.CLIENT,
    parentSpanId: 'parent-span-id',
    spanId: 'test-span-id',
    traceId: 'test-trace-id',
    events: [{
      name: 'test-event',
      time: 1500,
      attributes: { 'event.attr': 'event-value' }
    }],
    links: [{
      context: {
        traceId: 'linked-trace-id',
        spanId: 'linked-span-id'
      },
      attributes: { 'link.attr': 'link-value' }
    }],
    exceptions: [{
      name: 'Error',
      message: 'Test error',
      stack: 'Error stack',
      time: 1800
    }]
  };

  describe('localSpanToOtlp', () => {
    it('should convert LocalSpanData to OTLP format', () => {
      const otlpSpan = localSpanToOtlp(mockSpanData);

      expect(otlpSpan.traceId).toBe('test-trace-id');
      expect(otlpSpan.spanId).toBe('test-span-id');
      expect(otlpSpan.parentSpanId).toBe('parent-span-id');
      expect(otlpSpan.name).toBe('test-span');
      expect(otlpSpan.kind).toBe(3); // CLIENT
      expect(otlpSpan.startTimeUnixNano).toBe('1000000000'); // 1000ms * 1,000,000
      expect(otlpSpan.endTimeUnixNano).toBe('2000000000'); // 2000ms * 1,000,000
    });

    it('should handle span without end time', () => {
      const spanWithoutEnd = { ...mockSpanData, endTime: undefined };
      const otlpSpan = localSpanToOtlp(spanWithoutEnd);

      expect(otlpSpan.endTimeUnixNano).toBeUndefined();
    });

    it('should convert attributes correctly', () => {
      const otlpSpan = localSpanToOtlp(mockSpanData);
      const attributes = otlpSpan.attributes;

      expect(attributes).toHaveLength(4);
      
      const stringAttr = attributes.find(attr => attr.key === 'string.attr');
      expect(stringAttr?.value.stringValue).toBe('value');
      
      const numberAttr = attributes.find(attr => attr.key === 'number.attr');
      expect(numberAttr?.value.intValue).toBe('42');
      
      const booleanAttr = attributes.find(attr => attr.key === 'boolean.attr');
      expect(booleanAttr?.value.boolValue).toBe(true);
      
      const arrayAttr = attributes.find(attr => attr.key === 'array.attr');
      expect(arrayAttr?.value.arrayValue?.values).toHaveLength(3);
      expect(arrayAttr?.value.arrayValue?.values[0].stringValue).toBe('a');
    });

    it('should convert events correctly', () => {
      const otlpSpan = localSpanToOtlp(mockSpanData);
      const events = otlpSpan.events;

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('test-event');
      expect(events[0].timeUnixNano).toBe('1500000000');
      expect(events[0].attributes).toHaveLength(1);
      expect(events[0].attributes[0].key).toBe('event.attr');
      expect(events[0].attributes[0].value.stringValue).toBe('event-value');
    });

    it('should convert links correctly', () => {
      const otlpSpan = localSpanToOtlp(mockSpanData);
      const links = otlpSpan.links;

      expect(links).toHaveLength(1);
      expect(links[0].traceId).toBe('linked-trace-id');
      expect(links[0].spanId).toBe('linked-span-id');
      expect(links[0].attributes).toHaveLength(1);
      expect(links[0].attributes[0].key).toBe('link.attr');
      expect(links[0].attributes[0].value.stringValue).toBe('link-value');
    });

    it('should convert status correctly', () => {
      const otlpSpan = localSpanToOtlp(mockSpanData);
      
      expect(otlpSpan.status.code).toBe(1);
      expect(otlpSpan.status.message).toBe('OK');
    });

    it('should handle missing status', () => {
      const spanWithoutStatus = { ...mockSpanData, status: undefined };
      const otlpSpan = localSpanToOtlp(spanWithoutStatus);
      
      expect(otlpSpan.status.code).toBe(1); // Default to OK
    });

    it('should handle different span kinds', () => {
      const testCases = [
        { kind: SpanKind.INTERNAL, expected: 1 },
        { kind: SpanKind.SERVER, expected: 2 },
        { kind: SpanKind.CLIENT, expected: 3 },
        { kind: SpanKind.PRODUCER, expected: 4 },
        { kind: SpanKind.CONSUMER, expected: 5 }
      ];

      testCases.forEach(({ kind, expected }) => {
        const spanWithKind = { ...mockSpanData, kind };
        const otlpSpan = localSpanToOtlp(spanWithKind);
        expect(otlpSpan.kind).toBe(expected);
      });
    });
  });

  describe('localSpansToOtlpTraceData', () => {
    it('should convert array of spans to OTLP trace data', () => {
      const spans = [mockSpanData];
      const traceData = localSpansToOtlpTraceData(spans);

      expect(traceData.resourceSpans).toHaveLength(1);
      expect(traceData.resourceSpans[0].instrumentationLibrarySpans).toHaveLength(1);
      expect(traceData.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(1);
    });

    it('should include correct resource attributes', () => {
      const spans = [mockSpanData];
      const traceData = localSpansToOtlpTraceData(spans);

      const resourceAttrs = traceData.resourceSpans[0].resource.attributes;
      expect(resourceAttrs).toHaveLength(4);

      const serviceNameAttr = resourceAttrs.find(attr => attr.key === 'service.name');
      expect(serviceNameAttr?.value.stringValue).toBe('axiom-ai');

      const serviceVersionAttr = resourceAttrs.find(attr => attr.key === 'service.version');
      expect(serviceVersionAttr?.value.stringValue).toBe('0.0.1');

      const sdkNameAttr = resourceAttrs.find(attr => attr.key === 'telemetry.sdk.name');
      expect(sdkNameAttr?.value.stringValue).toBe('axiom-ai');

      const sdkVersionAttr = resourceAttrs.find(attr => attr.key === 'telemetry.sdk.version');
      expect(sdkVersionAttr?.value.stringValue).toBe('0.0.1');
    });

    it('should include correct instrumentation library info', () => {
      const spans = [mockSpanData];
      const traceData = localSpansToOtlpTraceData(spans);

      const instrumentationLibrary = traceData.resourceSpans[0].instrumentationLibrarySpans[0].instrumentationLibrary;
      expect(instrumentationLibrary.name).toBe('@axiomhq/ai');
      expect(instrumentationLibrary.version).toBe('0.0.1');
    });

    it('should handle multiple spans', () => {
      const spans = [
        mockSpanData,
        { ...mockSpanData, name: 'second-span', spanId: 'second-span-id' }
      ];
      const traceData = localSpansToOtlpTraceData(spans);

      expect(traceData.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(2);
    });

    it('should handle empty spans array', () => {
      const spans: LocalSpanData[] = [];
      const traceData = localSpansToOtlpTraceData(spans);

      expect(traceData.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(0);
    });
  });

  describe('otlpTraceDataToJson', () => {
    it('should serialize OTLP trace data to JSON', () => {
      const spans = [mockSpanData];
      const traceData = localSpansToOtlpTraceData(spans);
      const jsonString = otlpTraceDataToJson(traceData);

      expect(typeof jsonString).toBe('string');
      
      const parsed = JSON.parse(jsonString);
      expect(parsed.resourceSpans).toBeDefined();
      expect(parsed.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(1);
    });

    it('should handle empty data', () => {
      const emptyData = {
        resourceSpans: [{
          resource: { attributes: [] },
          instrumentationLibrarySpans: [{
            instrumentationLibrary: { name: 'test', version: '1.0.0' },
            spans: []
          }]
        }]
      };
      
      const jsonString = otlpTraceDataToJson(emptyData);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.resourceSpans[0].instrumentationLibrarySpans[0].spans).toHaveLength(0);
    });
  });

  describe('timing conversion', () => {
    it('should convert milliseconds to nanoseconds correctly', () => {
      const testSpan = {
        ...mockSpanData,
        startTime: 1000,
        endTime: 2000
      };
      
      const otlpSpan = localSpanToOtlp(testSpan);
      
      expect(otlpSpan.startTimeUnixNano).toBe('1000000000'); // 1000ms * 1,000,000
      expect(otlpSpan.endTimeUnixNano).toBe('2000000000'); // 2000ms * 1,000,000
    });

    it('should handle fractional milliseconds', () => {
      const testSpan = {
        ...mockSpanData,
        startTime: 1000.5,
        endTime: 2000.75
      };
      
      const otlpSpan = localSpanToOtlp(testSpan);
      
      expect(otlpSpan.startTimeUnixNano).toBe('1000500000'); // 1000.5ms * 1,000,000
      expect(otlpSpan.endTimeUnixNano).toBe('2000750000'); // 2000.75ms * 1,000,000
    });

    it('should handle event timing correctly', () => {
      const testSpan = {
        ...mockSpanData,
        events: [{
          name: 'test-event',
          time: 1500.25,
          attributes: {}
        }]
      };
      
      const otlpSpan = localSpanToOtlp(testSpan);
      
      expect(otlpSpan.events[0].timeUnixNano).toBe('1500250000'); // 1500.25ms * 1,000,000
    });
  });
});
