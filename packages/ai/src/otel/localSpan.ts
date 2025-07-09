import {
  type Span,
  type SpanContext,
  type SpanStatus,
  type SpanKind,
  type TimeInput,
  type Link,
  type Attributes,
  type SpanAttributeValue,
  type Exception,
  type Tracer,
  type Context,
} from '@opentelemetry/api';

interface LocalSpanData {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Attributes;
  status?: SpanStatus;
  kind: SpanKind;
  parentSpanId?: string;
  spanId: string;
  traceId: string;
  events: Array<{
    name: string;
    time: number;
    attributes?: Attributes;
  }>;
  links: Link[];
  exceptions: Array<{
    name: string;
    message: string;
    stack?: string;
    time: number;
  }>;
}

type FlushHandler = (spans: LocalSpanData[]) => void;

class LocalSpanBuffer {
  private spans: LocalSpanData[] = [];
  private flushTimer?: NodeJS.Timeout;
  private readonly maxSpans = 1000;
  private readonly flushInterval = 1000; // 1 second
  private flushHandlers: FlushHandler[] = [];
  private debugEnabled = process.env.AXIOM_AI_DEBUG === 'true';

  constructor() {
    this.setupShutdownHandler();
    this.setupDefaultFlushHandler();
  }

  private setupDefaultFlushHandler(): void {
    this.flushHandlers.push(this.defaultFlushHandler.bind(this));
  }

  private defaultFlushHandler(spans: LocalSpanData[]): void {
    if (spans.length === 0) return;

    const batchInfo = {
      timestamp: new Date().toISOString(),
      spanCount: spans.length,
      spans: spans.map(span => ({
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        name: span.name,
        kind: span.kind,
        startTime: new Date(span.startTime).toISOString(),
        endTime: span.endTime ? new Date(span.endTime).toISOString() : undefined,
        duration: span.endTime ? span.endTime - span.startTime : undefined,
        status: span.status,
        attributes: span.attributes,
        events: span.events.map(event => ({
          name: event.name,
          time: new Date(event.time).toISOString(),
          attributes: event.attributes,
        })),
        exceptions: span.exceptions.map(exc => ({
          name: exc.name,
          message: exc.message,
          stack: exc.stack,
          time: new Date(exc.time).toISOString(),
        })),
        links: span.links,
      })),
    };

    if (this.debugEnabled) {
      console.log(`[AxiomAI LocalSpans] Flushing ${spans.length} spans:`);
      console.log(JSON.stringify(batchInfo, null, 2));
    } else {
      console.log(`[AxiomAI LocalSpans] Flushed ${spans.length} spans at ${batchInfo.timestamp}`);
    }
  }

  /**
   * Add a custom flush handler for future extensibility
   * @param handler Function to handle flushed spans
   */
  addFlushHandler(handler: FlushHandler): void {
    this.flushHandlers.push(handler);
  }

  /**
   * Remove a custom flush handler
   * @param handler Function to remove
   */
  removeFlushHandler(handler: FlushHandler): void {
    const index = this.flushHandlers.indexOf(handler);
    if (index !== -1) {
      this.flushHandlers.splice(index, 1);
    }
  }

  addSpan(span: LocalSpanData): void {
    this.spans.push(span);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.spans.length >= this.maxSpans) {
      if (this.debugEnabled) {
        console.log(`[AxiomAI LocalSpans] Triggering flush due to max spans (${this.maxSpans})`);
      }
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        if (this.debugEnabled) {
          console.log(`[AxiomAI LocalSpans] Triggering flush due to timeout (${this.flushInterval}ms)`);
        }
        this.flush();
      }, this.flushInterval);
    }
  }

  private flush(): void {
    if (this.spans.length === 0) return;

    const spansToFlush = this.spans.splice(0);
    this.clearFlushTimer();

    // Call all registered flush handlers
    this.flushHandlers.forEach(handler => {
      try {
        handler(spansToFlush);
      } catch (error) {
        console.error('[AxiomAI LocalSpans] Error in flush handler:', error);
      }
    });
  }

  private clearFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private setupShutdownHandler(): void {
    const handleShutdown = () => {
      if (this.debugEnabled) {
        console.log('[AxiomAI LocalSpans] Graceful shutdown - flushing remaining spans');
      }
      this.flush();
    };

    // Handle various exit scenarios
    process.on('exit', handleShutdown);
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    process.on('uncaughtException', handleShutdown);
    process.on('unhandledRejection', handleShutdown);
  }

  // Force flush for testing or manual triggers
  forceFlush(): void {
    this.flush();
  }

  // Get current buffer stats for debugging
  getStats(): { spanCount: number; maxSpans: number; flushInterval: number } {
    return {
      spanCount: this.spans.length,
      maxSpans: this.maxSpans,
      flushInterval: this.flushInterval,
    };
  }
}

// Global buffer instance
const spanBuffer = new LocalSpanBuffer();

export class LocalSpan implements Span {
  private data: LocalSpanData;
  private ended = false;

  constructor(
    name: string,
    kind: SpanKind,
    parentSpanId?: string,
    links?: Link[],
  ) {
    this.data = {
      name,
      startTime: Date.now(),
      attributes: {},
      kind,
      parentSpanId,
      spanId: this.generateSpanId(),
      traceId: this.generateTraceId(),
      events: [],
      links: links || [],
      exceptions: [],
    };
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  spanContext(): SpanContext {
    return {
      traceId: this.data.traceId,
      spanId: this.data.spanId,
      traceFlags: 0,
    };
  }

  setAttribute(key: string, value: SpanAttributeValue): this {
    if (!this.ended) {
      this.data.attributes[key] = value;
    }
    return this;
  }

  setAttributes(attributes: Attributes): this {
    if (!this.ended) {
      Object.assign(this.data.attributes, attributes);
    }
    return this;
  }

  addEvent(name: string, attributes?: Attributes): this {
    if (!this.ended) {
      this.data.events.push({
        name,
        time: Date.now(),
        attributes,
      });
    }
    return this;
  }

  addLink(link: Link): this {
    if (!this.ended) {
      this.data.links.push(link);
    }
    return this;
  }

  addLinks(links: Link[]): this {
    if (!this.ended) {
      this.data.links.push(...links);
    }
    return this;
  }

  setStatus(status: SpanStatus): this {
    if (!this.ended) {
      this.data.status = status;
    }
    return this;
  }

  updateName(name: string): this {
    if (!this.ended) {
      this.data.name = name;
    }
    return this;
  }

  end(endTime?: TimeInput): void {
    if (this.ended) return;

    this.ended = true;
    this.data.endTime = typeof endTime === 'number' ? endTime : Date.now();
    
    // Add to buffer for flushing
    spanBuffer.addSpan(this.data);
  }

  isRecording(): boolean {
    return !this.ended;
  }

  recordException(exception: Exception): this {
    if (!this.ended) {
      let name: string;
      let message: string;
      let stack: string | undefined;

      if (exception instanceof Error) {
        name = exception.name;
        message = exception.message;
        stack = exception.stack;
      } else if (typeof exception === 'string') {
        name = 'Exception';
        message = exception;
      } else {
        name = 'Exception';
        message = String(exception);
      }

      this.data.exceptions.push({
        name,
        message,
        stack,
        time: Date.now(),
      });
    }
    return this;
  }
}

export class LocalTracer implements Tracer {
  startSpan(name: string, options?: any): Span {
    const kind = options?.kind || 0; // SpanKind.INTERNAL
    const links = options?.links;
    return new LocalSpan(name, kind, undefined, links);
  }

  startActiveSpan<F extends (span: Span) => any>(
    name: string,
    fn: F,
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => any>(
    name: string,
    options: any,
    fn: F,
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => any>(
    name: string,
    options: any,
    context: Context,
    fn: F,
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => any>(
    name: string,
    arg1?: any,
    arg2?: any,
    arg3?: any,
  ): ReturnType<F> {
    let fn: F;
    let options: any = {};

    // Handle different overloads
    if (typeof arg1 === 'function') {
      fn = arg1;
    } else if (typeof arg2 === 'function') {
      options = arg1;
      fn = arg2;
    } else if (typeof arg3 === 'function') {
      options = arg1;
      // Context parameter not used in local implementation
      fn = arg3;
    } else {
      throw new Error('Invalid arguments to startActiveSpan');
    }

    const span = this.startSpan(name, options);
    
    try {
      const result = fn(span);
      
      // Handle both sync and async functions
      if (result && typeof result.then === 'function') {
        return result.then(
          (value: any) => {
            span.end();
            return value;
          },
          (error: any) => {
            span.recordException(error as Exception);
            span.setStatus({ code: 2 /* ERROR */ });
            span.end();
            throw error;
          }
        ) as ReturnType<F>;
      } else {
        span.end();
        return result;
      }
    } catch (error) {
      span.recordException(error as Exception);
      span.setStatus({ code: 2 /* ERROR */ });
      span.end();
      throw error;
    }
  }
}

// Export buffer for testing and configuration
export const getSpanBuffer = () => spanBuffer;

// Export flush handler type for extensibility
export type { FlushHandler };
