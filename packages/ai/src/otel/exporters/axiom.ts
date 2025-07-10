import type { LocalSpanData } from '../localSpan';
import { localSpansToOtlpTraceData, otlpTraceDataToJson } from './otlpFormat';
import fetchRetry from 'fetch-retry';

export interface AxiomConfig {
  url: string;
  token: string;
  dataset: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class AxiomLocalExporter {
  private readonly fetch: typeof fetch;
  private readonly config: Required<AxiomConfig>;
  private readonly otlpEndpoint: string;

  constructor(config: AxiomConfig) {
    this.config = {
      url: config.url,
      token: config.token,
      dataset: config.dataset,
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000
    };

    // Construct OTLP endpoint URL for Axiom
    // Axiom accepts OTLP traces at /v1/traces endpoint
    this.otlpEndpoint = `${this.config.url.replace(/\/$/, '')}/v1/traces`;

    // Create fetch with retry capability
    this.fetch = fetchRetry(globalThis.fetch, {
      retries: this.config.retries,
      retryDelay: (attempt) => {
        // Exponential backoff: 1s, 2s, 4s, etc.
        return this.config.retryDelay * Math.pow(2, attempt - 1);
      },
      retryOn: (_attempt, error, response) => {
        // Retry on network errors, 5xx responses, or 429 (rate limit)
        if (error) return true;
        if (response && (response.status >= 500 || response.status === 429)) return true;
        return false;
      }
    });
  }

  async export(spans: LocalSpanData[]): Promise<void> {
    if (spans.length === 0) return;

    try {
      const otlpData = localSpansToOtlpTraceData(spans);
      
      // Add Axiom-specific resource attributes
      if (otlpData.resourceSpans[0]) {
        otlpData.resourceSpans[0].resource.attributes.push(
          { key: 'axiom.dataset', value: { stringValue: this.config.dataset } }
        );
      }

      const jsonData = otlpTraceDataToJson(otlpData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await this.fetch(this.otlpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.token}`,
          'X-Axiom-Dataset': this.config.dataset,
          'User-Agent': 'axiom-ai/0.0.1'
        },
        body: jsonData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Axiom export failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`[AxiomAI Export] Successfully exported ${spans.length} spans to Axiom dataset '${this.config.dataset}'`);
    } catch (error) {
      // Log error but don't propagate - export failures shouldn't break the application
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`[AxiomAI Export] Axiom export timeout after ${this.config.timeout}ms`);
        } else {
          console.error(`[AxiomAI Export] Axiom export failed:`, error.message);
        }
      } else {
        console.error(`[AxiomAI Export] Axiom export failed:`, error);
      }
      throw error; // Re-throw for retry logic
    }
  }
}
