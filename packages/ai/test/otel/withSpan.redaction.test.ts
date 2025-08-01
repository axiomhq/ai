import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { trace, propagation } from '@opentelemetry/api';
import { withSpan } from '../../src/otel/withSpan';
import { initAxiomAI, resetAxiomAI } from '../../src/otel/initAxiomAI';
import {
  getCurrentRedactionSettings,
  BAGGAGE_KEYS,
  setAttributeIfNotRedacted,
  RedactionKind,
} from '../../src/otel/utils/redaction';

let memoryExporter: InMemorySpanExporter;
let tracerProvider: NodeTracerProvider;

beforeAll(() => {
  memoryExporter = new InMemorySpanExporter();
  const spanProcessor = new SimpleSpanProcessor(memoryExporter);
  tracerProvider = new NodeTracerProvider({
    spanProcessors: [spanProcessor],
  });
  tracerProvider.register();
});

beforeEach(() => {
  memoryExporter.reset();
  resetAxiomAI();
});

afterAll(async () => {
  resetAxiomAI();
  await tracerProvider.shutdown();
  await memoryExporter.shutdown();
});

describe('withSpan Redaction Configuration Propagation', () => {
  describe('Global Redaction Settings', () => {
    it('should propagate global redact: "all" setting to baggage', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'all' });

      await withSpan({ capability: 'test', step: 'global-all' }, async (_span) => {
        // Check that baggage contains the redaction settings
        const activeBaggage = propagation.getActiveBaggage();
        expect(activeBaggage).toBeDefined();

        if (activeBaggage) {
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.prompts)?.value).toBe('1');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.completions)?.value).toBe('1');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.toolArgs)?.value).toBe('1');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.toolMsgs)?.value).toBe('1');
        }

        // Check that getCurrentRedactionSettings reflects the settings
        const settings = getCurrentRedactionSettings();
        expect(settings).toEqual({
          prompts: true,
          completions: true,
          toolArguments: true,
          toolMessages: true,
        });

        return 'success';
      });
    });

    it('should propagate global redact: "none" setting to baggage', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      await withSpan({ capability: 'test', step: 'global-none' }, async (_span) => {
        const activeBaggage = propagation.getActiveBaggage();
        expect(activeBaggage).toBeDefined();

        if (activeBaggage) {
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.prompts)?.value).toBe('0');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.completions)?.value).toBe('0');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.toolArgs)?.value).toBe('0');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.toolMsgs)?.value).toBe('0');
        }

        const settings = getCurrentRedactionSettings();
        expect(settings).toEqual({
          prompts: false,
          completions: false,
          toolArguments: false,
          toolMessages: false,
        });

        return 'success';
      });
    });

    it('should propagate global object redaction settings to baggage', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({
        tracer,
        redact: {
          prompts: true,
          completions: false,
          toolArguments: true,
          toolMessages: false,
        },
      });

      await withSpan({ capability: 'test', step: 'global-object' }, async (_span) => {
        const activeBaggage = propagation.getActiveBaggage();
        expect(activeBaggage).toBeDefined();

        if (activeBaggage) {
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.prompts)?.value).toBe('1');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.completions)?.value).toBe('0');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.toolArgs)?.value).toBe('1');
          expect(activeBaggage.getEntry(BAGGAGE_KEYS.toolMsgs)?.value).toBe('0');
        }

        const settings = getCurrentRedactionSettings();
        expect(settings).toEqual({
          prompts: true,
          completions: false,
          toolArguments: true,
          toolMessages: false,
        });

        return 'success';
      });
    });
  });

  describe('Local Redaction Overrides', () => {
    it('should allow local redact settings to override global settings', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' }); // Global: redact nothing

      await withSpan(
        { capability: 'test', step: 'local-override' },
        async (_span) => {
          const settings = getCurrentRedactionSettings();
          expect(settings).toEqual({
            prompts: true, // overridden locally
            completions: true, // overridden locally
            toolArguments: false, // from global
            toolMessages: false, // from global
          });

          return 'success';
        },
        { redact: { prompts: true, completions: true } }, // Local override
      );
    });

    it('should allow local "all" to override global "none"', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      await withSpan(
        { capability: 'test', step: 'local-all' },
        async (_span) => {
          const settings = getCurrentRedactionSettings();
          expect(settings).toEqual({
            prompts: true,
            completions: true,
            toolArguments: true,
            toolMessages: true,
          });

          return 'success';
        },
        { redact: 'all' },
      );
    });

    it('should allow local "none" to override global "all"', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'all' });

      await withSpan(
        { capability: 'test', step: 'local-none' },
        async (_span) => {
          const settings = getCurrentRedactionSettings();
          expect(settings).toEqual({
            prompts: false,
            completions: false,
            toolArguments: false,
            toolMessages: false,
          });

          return 'success';
        },
        { redact: 'none' },
      );
    });

    it('should allow partial local overrides', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({
        tracer,
        redact: {
          prompts: true,
          completions: true,
          toolArguments: true,
          toolMessages: true,
        },
      });

      await withSpan(
        { capability: 'test', step: 'partial-override' },
        async (_span) => {
          const settings = getCurrentRedactionSettings();
          expect(settings).toEqual({
            prompts: false, // overridden locally
            completions: true, // from global (not overridden)
            toolArguments: false, // overridden locally
            toolMessages: true, // from global (not overridden)
          });

          return 'success';
        },
        { redact: { prompts: false, toolArguments: false } },
      );
    });
  });

  describe('Nested withSpan Calls', () => {
    it('should handle nested withSpan calls with different redaction settings', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      const outerResult = await withSpan(
        { capability: 'test', step: 'outer' },
        async (_outerSpan) => {
          // Outer span should have redact: all
          let outerSettings = getCurrentRedactionSettings();
          expect(outerSettings.prompts).toBe(true);
          expect(outerSettings.completions).toBe(true);

          const innerResult = await withSpan(
            { capability: 'test', step: 'inner' },
            async (_innerSpan) => {
              // Inner span should have redact: none (overriding outer)
              let innerSettings = getCurrentRedactionSettings();
              expect(innerSettings.prompts).toBe(false);
              expect(innerSettings.completions).toBe(false);

              return 'inner-success';
            },
            { redact: 'none' },
          );

          // After inner span, outer settings should be restored
          outerSettings = getCurrentRedactionSettings();
          expect(outerSettings.prompts).toBe(true);
          expect(outerSettings.completions).toBe(true);

          return { outer: 'outer-success', inner: innerResult };
        },
        { redact: 'all' },
      );

      expect(outerResult).toEqual({
        outer: 'outer-success',
        inner: 'inner-success',
      });
    });

    it('should handle deeply nested withSpan calls', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      await withSpan(
        { capability: 'test', step: 'level1' },
        async (_span1) => {
          expect(getCurrentRedactionSettings().prompts).toBe(true); // from level1 redact: all

          await withSpan(
            { capability: 'test', step: 'level2' },
            async (_span2) => {
              expect(getCurrentRedactionSettings().prompts).toBe(false); // from level2 redact: none

              await withSpan(
                { capability: 'test', step: 'level3' },
                async (_span3) => {
                  expect(getCurrentRedactionSettings().prompts).toBe(true); // from level3 redact: {prompts: true}
                  expect(getCurrentRedactionSettings().completions).toBe(false); // inherited from level2

                  return 'level3-success';
                },
                { redact: { prompts: true } },
              );

              // Back to level2 settings
              expect(getCurrentRedactionSettings().prompts).toBe(false);

              return 'level2-success';
            },
            { redact: 'none' },
          );

          // Back to level1 settings
          expect(getCurrentRedactionSettings().prompts).toBe(true);

          return 'level1-success';
        },
        { redact: 'all' },
      );
    });
  });

  describe('Concurrent withSpan Calls', () => {
    it('should maintain separate redaction contexts for concurrent calls', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      const results = await Promise.all([
        withSpan(
          { capability: 'test', step: 'concurrent1' },
          async (_span) => {
            // Wait a bit to ensure overlap with other concurrent calls
            await new Promise((resolve) => setTimeout(resolve, 10));

            const settings = getCurrentRedactionSettings();
            expect(settings.prompts).toBe(true); // from redact: 'all'
            expect(settings.completions).toBe(true);

            return 'concurrent1-success';
          },
          { redact: 'all' },
        ),
        withSpan(
          { capability: 'test', step: 'concurrent2' },
          async (_span) => {
            // Wait a bit to ensure overlap with other concurrent calls
            await new Promise((resolve) => setTimeout(resolve, 10));

            const settings = getCurrentRedactionSettings();
            expect(settings.prompts).toBe(false); // from redact: 'none'
            expect(settings.completions).toBe(false);

            return 'concurrent2-success';
          },
          { redact: 'none' },
        ),
        withSpan(
          { capability: 'test', step: 'concurrent3' },
          async (_span) => {
            // Wait a bit to ensure overlap with other concurrent calls
            await new Promise((resolve) => setTimeout(resolve, 10));

            const settings = getCurrentRedactionSettings();
            expect(settings.prompts).toBe(true); // from redact: {prompts: true}
            expect(settings.completions).toBe(false); // default false

            return 'concurrent3-success';
          },
          { redact: { prompts: true } },
        ),
      ]);

      expect(results).toEqual([
        'concurrent1-success',
        'concurrent2-success',
        'concurrent3-success',
      ]);
    });
  });

  describe('Context Propagation Integration', () => {
    it('should preserve existing baggage entries while adding redaction settings', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      await withSpan(
        { capability: 'test', step: 'preserve-baggage' },
        async (_span) => {
          const activeBaggage = propagation.getActiveBaggage();
          expect(activeBaggage).toBeDefined();

          if (activeBaggage) {
            // Should have capability and step from withSpan
            expect(activeBaggage.getEntry('capability')?.value).toBe('test');
            expect(activeBaggage.getEntry('step')?.value).toBe('preserve-baggage');

            // Should add redaction settings
            expect(activeBaggage.getEntry(BAGGAGE_KEYS.prompts)?.value).toBe('1');
            expect(activeBaggage.getEntry(BAGGAGE_KEYS.completions)?.value).toBe('1');
          }

          return 'success';
        },
        { redact: 'all' },
      );
    });

    it('should work correctly when no initial tracer is provided', async () => {
      resetAxiomAI(); // No tracer initialization

      // Should fall back to default tracer and not crash
      const result = await withSpan(
        { capability: 'test', step: 'no-tracer' },
        async (_span) => {
          // Should still be able to get redaction settings
          const settings = getCurrentRedactionSettings();
          expect(settings).toEqual({
            prompts: true,
            completions: true,
            toolArguments: true,
            toolMessages: true,
          });

          return 'no-tracer-success';
        },
        { redact: 'all' },
      );

      expect(result).toBe('no-tracer-success');
    });
  });

  describe('Redaction Function Integration', () => {
    it('should use redaction settings for setAttributeIfNotRedacted', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer, redact: 'none' });

      await withSpan(
        { capability: 'test', step: 'attr-redaction' },
        async (span) => {
          // Mock span setAttribute to track calls
          const setAttributeSpy = vi.spyOn(span, 'setAttribute');

          // Test with prompts redacted
          setAttributeIfNotRedacted(span, 'test.prompt', 'sensitive prompt', RedactionKind.Prompts);

          // Test with completions not redacted
          setAttributeIfNotRedacted(
            span,
            'test.completion',
            'public completion',
            RedactionKind.Completions,
          );

          // Prompts should be redacted (no setAttribute call)
          expect(setAttributeSpy).not.toHaveBeenCalledWith('test.prompt', 'sensitive prompt');

          // Completions should not be redacted (setAttribute called)
          expect(setAttributeSpy).toHaveBeenCalledWith('test.completion', 'public completion');

          return 'success';
        },
        { redact: { prompts: true, completions: false } },
      );
    });

    it('should handle redaction in complex scenarios', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer });

      await withSpan(
        { capability: 'complex', step: 'outer' },
        async (outerSpan) => {
          // Set some attributes in outer span (should be redacted)
          setAttributeIfNotRedacted(
            outerSpan,
            'outer.prompt',
            'outer prompt',
            RedactionKind.Prompts,
          );
          setAttributeIfNotRedacted(
            outerSpan,
            'outer.completion',
            'outer completion',
            RedactionKind.Completions,
          );

          await withSpan(
            { capability: 'complex', step: 'inner' },
            async (innerSpan) => {
              // Set some attributes in inner span (should not be redacted)
              setAttributeIfNotRedacted(
                innerSpan,
                'inner.prompt',
                'inner prompt',
                RedactionKind.Prompts,
              );
              setAttributeIfNotRedacted(
                innerSpan,
                'inner.completion',
                'inner completion',
                RedactionKind.Completions,
              );

              return 'inner-success';
            },
            { redact: 'none' }, // Override to not redact
          );

          return 'outer-success';
        },
        { redact: 'all' }, // Redact everything
      );

      // Verify spans were created
      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBeGreaterThanOrEqual(2);

      const outerSpan = spans.find((s) => s.name === 'gen_ai.call_llm');
      const innerSpan = spans.find(
        (s) =>
          s.name === 'gen_ai.call_llm' &&
          (s as any).parentSpanId === outerSpan?.spanContext().spanId,
      );

      // Outer span should have redacted attributes
      if (outerSpan) {
        const outerAttrValues = Object.values(outerSpan.attributes).join(' ');
        expect(outerAttrValues).not.toContain('outer prompt');
        expect(outerAttrValues).not.toContain('outer completion');
      }

      // Inner span should have non-redacted attributes
      if (innerSpan) {
        const innerAttrValues = Object.values(innerSpan.attributes).join(' ');
        expect(innerAttrValues).toContain('inner prompt');
        expect(innerAttrValues).toContain('inner completion');
      }
    });
  });

  describe('Default Behavior', () => {
    it('should default to no redaction when no settings provided', async () => {
      const tracer = trace.getTracer('axiom-ai-withspan-test');
      initAxiomAI({ tracer }); // No redact configuration

      await withSpan({ capability: 'test', step: 'default' }, async (_span) => {
        const settings = getCurrentRedactionSettings();
        expect(settings).toEqual({
          prompts: false,
          completions: false,
          toolArguments: false,
          toolMessages: false,
        });

        return 'success';
      });
    });
  });
});
