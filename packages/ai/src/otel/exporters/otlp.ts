import type { LocalSpanData } from '../localSpan';
import { localSpansToOtlpTraceData, otlpTraceDataToJson } from './otlpFormat';
import fetchRetry from 'fetch-retry';

export interface OtlpConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class OtlpLocalExporter {
  private readonly fetch: typeof fetch;
  private readonly config: Required<OtlpConfig>;

  constructor(config: OtlpConfig) {
    this.config = {
      url: config.url,
      headers: config.headers || {},
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000
    };

    // Create fetch with retry capability
    this.fetch = fetchRetry(globalThis.fetch, {
      retries: this.config.retries,
      retryDelay: (attempt) => {
        // Exponential backoff: 1s, 2s, 4s, etc.
        return this.config.retryDelay * Math.pow(2, attempt - 1);
      },
      retryOn: (_attempt, error, response) => {
        // Retry on network errors or 5xx responses
        if (error) return true;
        if (response && response.status >= 500) return true;
        return false;
      }
    });
  }

  async export(spans: LocalSpanData[]): Promise<void> {
    if (spans.length === 0) return;

    try {
      const otlpData = localSpansToOtlpTraceData(spans);
      const jsonData = otlpTraceDataToJson(otlpData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await this.fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.config.headers
        },
        body: jsonData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OTLP export failed: ${response.status} ${response.statusText}`);
      }

      console.log(`[AxiomAI Export] Successfully exported ${spans.length} spans to OTLP endpoint`);
    } catch (error) {
      // Log error but don't propagate - export failures shouldn't break the application
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`[AxiomAI Export] OTLP export timeout after ${this.config.timeout}ms`);
        } else {
          console.error(`[AxiomAI Export] OTLP export failed:`, error.message);
        }
      } else {
        console.error(`[AxiomAI Export] OTLP export failed:`, error);
      }
      throw error; // Re-throw for retry logic
    }
  }
}
