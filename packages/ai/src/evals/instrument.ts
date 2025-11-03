import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  context,
  trace,
  type Context,
  type Span,
  type SpanOptions,
  SpanStatusCode,
  type Tracer,
  type TracerProvider,
} from '@opentelemetry/api';
import { initAxiomAI } from '../../src/otel/initAxiomAI';
import type {
  AxiomEvalInstrumentationHook,
  AxiomEvalInstrumentationOptions,
  AxiomEvalInstrumentationResult,
  ResolvedAxiomConfig,
} from '../config/index';
import { resolveAxiomConnection } from '../config/resolver';
import { AxiomCLIError, errorToString } from '../cli/errors';
import { loadConfig } from '../config/loader';

// Lazily initialized tracer provider and exporter
let axiomProvider: NodeTracerProvider | undefined;
let axiomTracer: Tracer | undefined;
let userProvider: TracerProvider | undefined;

let initializationPromise: Promise<void> | null = null;
let initialized = false;

async function resolveInstrumentationHook(
  config: ResolvedAxiomConfig,
): Promise<AxiomEvalInstrumentationHook | null> {
  if (config.eval.instrumentation) {
    return config.eval.instrumentation;
  }

  try {
    const { config: loadedConfig } = await loadConfig(process.cwd());
    return (loadedConfig.eval.instrumentation ?? null) as AxiomEvalInstrumentationHook | null;
  } catch (error) {
    throw new AxiomCLIError(
      `Failed to reload instrumentation from config: ${errorToString(error)}`,
    );
  }
}

async function runInstrumentationHook(
  hook: AxiomEvalInstrumentationHook,
  options: AxiomEvalInstrumentationOptions,
): Promise<AxiomEvalInstrumentationResult | void> {
  try {
    return await hook(options);
  } catch (error) {
    throw new AxiomCLIError(`Failed to execute instrumentation hook: ${errorToString(error)}`);
  }
}

function setupEvalProvider(connection: ReturnType<typeof resolveAxiomConnection>) {
  const headers: Record<string, string> = {
    'X-Axiom-Dataset': connection.dataset,
  };

  if (connection.token) {
    headers.Authorization = `Bearer ${connection.token}`;
  }

  const collectorOptions = {
    url: `${connection.url}/v1/traces`,
    headers,
    concurrencyLimit: 10,
  };

  const exporter = new OTLPTraceExporter(collectorOptions);

  const processor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  });

  axiomProvider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      ['service.name']: 'axiom',
      ['service.version']: __SDK_VERSION__,
    }),
    spanProcessors: [processor],
  });

  axiomTracer = axiomProvider.getTracer('axiom', __SDK_VERSION__);
}

export async function initInstrumentation(config: {
  enabled: boolean;
  config: ResolvedAxiomConfig;
}): Promise<void> {
  if (initialized) {
    return;
  }

  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  initializationPromise = (async () => {
    if (!config.enabled) {
      axiomTracer = trace.getTracer('axiom', __SDK_VERSION__);
      initialized = true;
      return;
    }

    const connection = resolveAxiomConnection(config.config);
    const hook = await resolveInstrumentationHook(config.config);
    let hookResult: AxiomEvalInstrumentationResult | void = undefined;

    if (hook) {
      config.config.eval.instrumentation = hook;
      hookResult = await runInstrumentationHook(hook, {
        dataset: connection.dataset,
        token: connection.token,
        url: connection.url,
      });

      userProvider = hookResult?.provider ?? userProvider;
    }

    setupEvalProvider(connection);

    if (!hook) {
      // Fall back to default behaviour by registering our provider globally
      axiomProvider?.register();
      if (axiomTracer) {
        initAxiomAI({ tracer: axiomTracer });
      }
    }

    initialized = true;
  })();

  try {
    await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}

export const flush = async () => {
  if (initializationPromise) {
    await initializationPromise;
  }

  const tasks: Array<Promise<unknown>> = [];

  if (axiomProvider) {
    tasks.push(axiomProvider.forceFlush());
  }

  const candidateProviders = new Set<TracerProvider>();
  if (userProvider) {
    candidateProviders.add(userProvider);
  }

  const globalProvider = trace.getTracerProvider();
  if (globalProvider) {
    candidateProviders.add(globalProvider);
  }

  for (const provider of candidateProviders) {
    const flushFn = (provider as any).forceFlush;
    if (typeof flushFn === 'function') {
      tasks.push(
        flushFn.call(provider).catch((error: unknown) => {
          console.warn('[AxiomAI] Failed to flush tracer provider:', errorToString(error));
        }),
      );
    }
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
};

/**
 * Ensure instrumentation is initialized with the given config.
 * Call this from within test context before using startSpan.
 */
export async function ensureInstrumentationInitialized(config: ResolvedAxiomConfig): Promise<void> {
  if (initialized) {
    return;
  }

  await initInstrumentation({ enabled: true, config });
}

const getEvalTracer = (): Tracer => {
  if (!axiomTracer) {
    throw new Error(
      'Eval tracer not initialized. Ensure ensureInstrumentationInitialized() was awaited before starting spans.',
    );
  }

  return axiomTracer;
};

export const startSpan = (name: string, opts: SpanOptions, context?: Context) => {
  if (!initialized || !axiomTracer) {
    throw new Error(
      'Instrumentation not initialized. This is likely a bug - instrumentation should be initialized before startSpan is called.',
    );
  }
  return getEvalTracer().startSpan(name, opts, context);
};

export const startActiveSpan = async <T>(
  name: string,
  options: SpanOptions,
  fn: (span: Span) => Promise<T>,
  parentContext?: Context,
): Promise<T> => {
  const span = startSpan(name, options, parentContext);

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
};
