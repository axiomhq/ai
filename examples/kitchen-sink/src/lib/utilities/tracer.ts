import { trace } from '@opentelemetry/api';

export const tracer = trace.getTracer('axiom-ai-kitchen-sink-tracer');
