import type { Case, Chat, Evaluation, Task } from './eval.types';
import { createFetcher, type Fetcher } from '../utils/fetcher';
import type { ResolvedAxiomConfig } from '../config/index';
import { resolveAxiomConnection } from '../config/resolver';
import { Attr } from '../otel';
import { AxiomCLIError } from '../cli/errors';

export interface EvaluationApiConfig {
  dataset?: string;
  region?: string;
  baseUrl?: string;
  apiUrl?: string;
  token?: string;
}

export type EvaluationStatus = 'running' | 'completed' | 'errored' | 'cancelled';

export interface EvaluationApiPayloadBase {
  id: string;
  name: string;
  capability: string;
  step?: string | undefined;
  dataset: string;
  baselineId?: string;
  totalCases?: number;
  config?: Record<string, unknown>;
  status: EvaluationStatus;
  successCases?: number;
  erroredCases?: number;
  durationMs?: number;
  scorerAvgs?: number[];
  version: string;
  runId: string;
  configTimeoutMs: number;
  metadata?: Record<string, any>;
}

export class EvaluationApiClient {
  private readonly fetcher: Fetcher;
  constructor(config: ResolvedAxiomConfig) {
    const { consoleEndpointUrl, token, orgId } = resolveAxiomConnection(config);

    this.fetcher = createFetcher({ baseUrl: consoleEndpointUrl, token: token ?? '', orgId });
  }

  async createEvaluation(evaluation: EvaluationApiPayloadBase) {
    const resp = await this.fetcher(`/api/v3/evaluations`, {
      method: 'POST',
      body: JSON.stringify(evaluation),
    });

    if (!resp.ok) {
      throw new AxiomCLIError(`Failed to create evaluation: ${resp.statusText}`);
    }

    return resp.json();
  }

  async updateEvaluation(evaluation: Partial<EvaluationApiPayloadBase>) {
    const resp = await this.fetcher(`/api/v3/evaluations/${evaluation.id}`, {
      method: 'PATCH',
      body: JSON.stringify(evaluation),
    });

    if (!resp.ok) {
      throw new AxiomCLIError(`Failed to update evaluation: ${resp.statusText}`);
    }

    return resp.json();
  }
}

export const findEvaluationCases = async (
  evalId: string,
  config: ResolvedAxiomConfig,
): Promise<Evaluation | null> => {
  const { dataset, url, token, orgId } = resolveAxiomConnection(config);

  const apl = `['${dataset}'] | where trace_id == "${evalId}" | order by _time`;

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(orgId ? { 'X-AXIOM-ORG-ID': orgId } : {}),
  });

  const resp = await fetch(`${url}/v1/datasets/_apl?format=legacy`, {
    headers: headers,
    method: 'POST',
    body: JSON.stringify({ apl }),
  });
  const payload = await resp.json();

  if (!resp.ok) {
    throw new Error(`Failed to query evaluation cases: ${payload.message || resp.statusText}`);
  }

  return payload.matches.length ? buildSpanTree(payload.matches) : null;
};

export const mapSpanToEval = (span: any): Evaluation => {
  const flagConfigRaw =
    span.data.attributes[Attr.Eval.Config.Flags] ??
    span.data.attributes.custom[Attr.Eval.Config.Flags];

  return {
    id: span.data.attributes.custom[Attr.Eval.ID],
    name: span.data.attributes.custom[Attr.Eval.Name],
    type: span.data.attributes.custom[Attr.Eval.Type],
    version: span.data.attributes.custom[Attr.Eval.Version],
    collection: {
      name: span.data.attributes.custom[Attr.Eval.Collection.Name],
      size: span.data.attributes.custom[Attr.Eval.Collection.Size],
    },
    baseline: {
      id: span.data.attributes.custom[Attr.Eval.Baseline.ID],
      name: span.data.attributes.custom[Attr.Eval.Baseline.Name],
    },
    prompt: {
      // TODO: do we still want this?
      model: span.data.attributes.custom['eval.prompt.model'],
      params: span.data.attributes.custom['eval.prompt.params'],
    },
    duration: span.data.duration,
    status: span.data.status.code,
    traceId: span.data.trace_id,
    runAt: span._time,
    tags: span.data.attributes.custom[Attr.Eval.Tags].length
      ? JSON.parse(span.data.attributes.custom[Attr.Eval.Tags])
      : [],
    user: {
      name: span.data.attributes.custom[Attr.Eval.User.Name],
      email: span.data.attributes.custom[Attr.Eval.User.Email],
    },
    cases: [],
    flagConfig: flagConfigRaw ? JSON.parse(flagConfigRaw) : undefined,
  };
};

export const mapSpanToCase = (item: { _time: string; data: any }): Case => {
  const data = item.data;
  // round duration
  const d = data.duration as string;
  let duration = '-';
  if (d.endsWith('s')) {
    duration = `${Number(d.replace('s', '')).toFixed(2)}s`;
  } else {
    duration = d;
  }

  return {
    index: data.attributes.custom[Attr.Eval.Case.Index],
    input: data.attributes.custom[Attr.Eval.Case.Input],
    output: data.attributes.custom[Attr.Eval.Case.Output],
    expected: data.attributes.custom[Attr.Eval.Case.Expected],
    duration: duration,
    status: data.status.code,
    scores: data.attributes.custom[Attr.Eval.Case.Scores]
      ? JSON.parse(data.attributes.custom[Attr.Eval.Case.Scores])
      : {},
    runAt: item._time,
    spanId: data.span_id,
    traceId: data.trace_id,
  };
};

// compute a root eval with its children spans, results in a usable object of eval, cases, scores and chats
export const buildSpanTree = (spans: any[]): Evaluation | null => {
  if (!spans.length) {
    return null;
  }

  // Find the root eval span
  const evalSpan = spans.find((span) => span.data.attributes.gen_ai.operation.name === 'eval');

  if (!evalSpan) {
    return null;
  }

  // Create the root eval structure
  const rootSpan: Evaluation = mapSpanToEval(evalSpan);

  // Find all case spans and build the tree structure
  const caseSpans = spans.filter((span) => span.data.name.startsWith('case'));

  for (const caseSpan of caseSpans) {
    // Convert case data
    const caseData = mapSpanToCase(caseSpan);

    // Find task spans that belong to this case
    const taskSpans = spans.filter(
      (span) =>
        span.data.name.startsWith('task') && span.data.parent_span_id === caseSpan.data.span_id,
    );

    if (taskSpans.length > 0) {
      const taskSpan = taskSpans[0]; // Assuming one task per case

      // Find chat spans that belong to this task
      const chatSpans = spans.filter(
        (span) =>
          span.data.name.startsWith('chat') && span.data.parent_span_id === taskSpan.data.span_id,
      );

      const chatData: Chat[] = chatSpans.map((chatSpan) => ({
        operation: chatSpan.data.attributes.custom?.operation || '',
        capability: chatSpan.data.attributes.custom?.capability || '',
        step: chatSpan.data.attributes.custom?.step || '',
        request: {
          max_token: chatSpan.data.attributes.custom?.['request.max_token'] || '',
          model: chatSpan.data.attributes.custom?.['request.model'] || '',
          temperature: chatSpan.data.attributes.custom?.['request.temperature'] || 0,
        },
        response: {
          finish_reasons: chatSpan.data.attributes.custom?.['response.finish_reasons'] || '',
        },
        usage: {
          input_tokens: chatSpan.data.attributes.gen_ai?.usage?.input_tokens || 0,
          output_tokens: chatSpan.data.attributes.gen_ai?.usage?.output_tokens || 0,
        },
      }));

      // Create task data with chat information
      const taskData: Task = {
        name: taskSpan.data.name,
        output: taskSpan.data.attributes.custom?.output || '',
        trial: taskSpan.data.attributes.custom?.trial || 0,
        type: taskSpan.data.attributes.custom?.type || '',
        error: taskSpan.data.attributes.custom?.error,
        chat: chatData[0] || {
          operation: '',
          capability: '',
          step: '',
          request: { max_token: '', model: '', temperature: 0 },
          response: { finish_reasons: '' },
          usage: { input_tokens: 0, output_tokens: 0 },
        },
      };

      caseData.task = taskData;
    }

    // Find task spans that belong to this case
    const scoreSpans = spans.filter(
      (span) =>
        span.data.attributes.gen_ai.operation.name === 'eval.score' &&
        span.data.parent_span_id === caseSpan.data.span_id,
    );

    caseData.scores = {};

    scoreSpans.forEach((score) => {
      const name = score.data.attributes.custom[Attr.Eval.Score.Name];
      caseData.scores[name] = {
        name,
        value: score.data.attributes.custom[Attr.Eval.Score.Value],
        metadata: {
          error: score.data.attributes.error,
        },
      };
    });

    rootSpan.cases.push(caseData);
  }

  rootSpan.cases.sort((a, b) => a.index - b.index);

  return rootSpan;
};
