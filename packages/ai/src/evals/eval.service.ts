import type { Case, Chat, Evaluation, Task } from './eval.types';
import { createFetcher, type Fetcher } from '../utils/fetcher';
import type { ResolvedAxiomConfig } from '../config/index';
import { resolveAxiomConnection } from '../config/resolver';
import { Attr } from '../otel';
import { AxiomCLIError } from '../util/errors';
import {
  getCustomOrRegularAttribute,
  getCustomOrRegularNumber,
  getCustomOrRegularString,
} from '../util/traces';

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
  summary?: {
    averages?: {
      scores?: Record<string, number>;
    };
  };
}

export class EvaluationApiClient {
  private readonly fetcher: Fetcher;
  constructor(config: ResolvedAxiomConfig, consoleUrl?: string) {
    const { consoleEndpointUrl, token, orgId } = resolveAxiomConnection(config, consoleUrl);

    this.fetcher = createFetcher({ baseUrl: consoleEndpointUrl, token: token ?? '', orgId });
  }

  async createEvaluation(evaluation: EvaluationApiPayloadBase) {
    const resp = await this.fetcher(`/api/v3/evaluations`, {
      method: 'POST',
      body: JSON.stringify(evaluation),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new AxiomCLIError(`Failed to create evaluation: ${resp.statusText}${text ? ` - ${text}` : ''}`);
    }

    return resp.json();
  }

  async updateEvaluation(evaluation: Partial<EvaluationApiPayloadBase>) {
    const resp = await this.fetcher(`/api/v3/evaluations/${evaluation.id}`, {
      method: 'PATCH',
      body: JSON.stringify(evaluation),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new AxiomCLIError(`Failed to update evaluation: ${resp.statusText}${text ? ` - ${text}` : ''}`);
    }

    // API may return HTTP 200 with an error in the response body
    const body = await resp.json();
    if (body.error) {
      throw new AxiomCLIError(
        `Failed to update evaluation ${evaluation.id}: ${JSON.stringify(body.error)}`,
      );
    }

    return body;
  }
}

export const findEvaluationCases = async (
  evalId: string,
  config: ResolvedAxiomConfig,
): Promise<Evaluation | null> => {
  const { dataset, edgeUrl, token, orgId } = resolveAxiomConnection(config);

  const apl = `['${dataset}'] | where trace_id == "${evalId}" | order by _time`;

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(orgId ? { 'X-AXIOM-ORG-ID': orgId } : {}),
  });

  // Use edgeUrl for query operations
  const resp = await fetch(`${edgeUrl}/v1/datasets/_apl?format=legacy`, {
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

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export const mapSpanToEval = (span: any): Evaluation => {
  const flagConfigRaw = getCustomOrRegularAttribute(span.data.attributes, Attr.Eval.Config.Flags);
  const tagsRaw = getCustomOrRegularAttribute(span.data.attributes, Attr.Eval.Tags);

  const evaluation: DeepPartial<Evaluation> = {
    id: getCustomOrRegularString(span.data.attributes, Attr.Eval.ID),
    name: getCustomOrRegularString(span.data.attributes, Attr.Eval.Name),
    type: getCustomOrRegularString(span.data.attributes, Attr.Eval.Type),
    version: getCustomOrRegularString(span.data.attributes, Attr.Eval.Version),
    collection: {
      name: getCustomOrRegularString(span.data.attributes, Attr.Eval.Collection.Name),
      size: getCustomOrRegularNumber(span.data.attributes, Attr.Eval.Collection.Size),
    },
    baseline: {
      id: getCustomOrRegularString(span.data.attributes, Attr.Eval.Baseline.ID),
      name: getCustomOrRegularString(span.data.attributes, Attr.Eval.Baseline.Name),
    },
    duration: span.data.duration,
    status: span.data.status.code,
    traceId: span.data.trace_id,
    runAt: span._time,
    tags: tagsRaw ? (typeof tagsRaw === 'string' ? JSON.parse(tagsRaw) : tagsRaw) : [],
    user: {
      name: getCustomOrRegularString(span.data.attributes, Attr.Eval.User.Name),
      email: getCustomOrRegularString(span.data.attributes, Attr.Eval.User.Email),
    },
    cases: [],
    flagConfig: flagConfigRaw
      ? typeof flagConfigRaw === 'string'
        ? JSON.parse(flagConfigRaw)
        : flagConfigRaw
      : undefined,
  };

  // TODO: this is very optimistic!
  return evaluation as Evaluation;
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

  const scoresRaw = getCustomOrRegularAttribute(data.attributes, Attr.Eval.Case.Scores);
  const scoresParsed = scoresRaw
    ? typeof scoresRaw === 'string'
      ? JSON.parse(scoresRaw)
      : scoresRaw
    : {};

  // Normalize scores: convert .score to .value if needed (ScoreWithName uses .score, Case uses .value)
  // FUTURE: find a better way of handling this
  const scores: Case['scores'] = {};
  for (const [name, scoreData] of Object.entries(scoresParsed)) {
    const s = scoreData as { score?: number; value?: number; metadata?: Record<string, any> };
    scores[name] = {
      name,
      value: s.value ?? s.score ?? 0,
      metadata: s.metadata ?? {},
    };
  }

  const caseData: DeepPartial<Case> = {
    index: getCustomOrRegularNumber(data.attributes, Attr.Eval.Case.Index),
    input: getCustomOrRegularString(data.attributes, Attr.Eval.Case.Input),
    output: getCustomOrRegularString(data.attributes, Attr.Eval.Case.Output),
    expected: getCustomOrRegularString(data.attributes, Attr.Eval.Case.Expected),
    duration: duration,
    status: data.status.code,
    scores,
    runAt: item._time,
    spanId: data.span_id,
    traceId: data.trace_id,
  };

  // TODO: this is very optimistic!
  return caseData as Case;
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

    // Find trial spans for this case (added in SDK 0.42.0)
    const trialSpans = spans.filter(
      (span) =>
        span.data.name.startsWith('trial') && span.data.parent_span_id === caseSpan.data.span_id,
    );

    // Look for tasks/scores under trial spans, falling back to case for pre-trial compatibility
    const trialSpanIds = trialSpans.map((s) => s.data.span_id);
    const parentIds = trialSpanIds.length > 0 ? trialSpanIds : [caseSpan.data.span_id];

    // Find task spans that belong to this case (via trial spans or directly)
    const taskSpans = spans.filter(
      (span) =>
        span.data.name.startsWith('task') && parentIds.includes(span.data.parent_span_id),
    );

    if (taskSpans.length > 0) {
      const taskSpan = taskSpans[0]; // Assuming one task per case

      // Find chat spans that belong to this task
      const chatSpans = spans.filter(
        (span) =>
          span.data.name.startsWith('chat') && span.data.parent_span_id === taskSpan.data.span_id,
      );

      const chatData: Chat[] = chatSpans.map((chatSpan) => ({
        operation: getCustomOrRegularString(chatSpan.data.attributes, 'operation') ?? '',
        capability: getCustomOrRegularString(chatSpan.data.attributes, 'capability') ?? '',
        step: getCustomOrRegularString(chatSpan.data.attributes, 'step') ?? '',
        request: {
          max_token: getCustomOrRegularString(chatSpan.data.attributes, 'request.max_token') ?? '',
          model: getCustomOrRegularString(chatSpan.data.attributes, 'request.model') ?? '',
          temperature:
            getCustomOrRegularNumber(chatSpan.data.attributes, 'request.temperature') ?? 0,
        },
        response: {
          finish_reasons:
            getCustomOrRegularString(chatSpan.data.attributes, 'response.finish_reasons') ?? '',
        },
        usage: {
          input_tokens:
            getCustomOrRegularNumber(chatSpan.data.attributes, 'usage.input_tokens') ?? 0,
          output_tokens:
            getCustomOrRegularNumber(chatSpan.data.attributes, 'usage.output_tokens') ?? 0,
        },
      }));

      // Create task data with chat information
      const taskData: Task = {
        name: taskSpan.data.name,
        output: getCustomOrRegularString(taskSpan.data.attributes, 'output') || '',
        trial: getCustomOrRegularNumber(taskSpan.data.attributes, 'trial') || 0,
        type: getCustomOrRegularString(taskSpan.data.attributes, 'type') || '',
        error: getCustomOrRegularString(taskSpan.data.attributes, 'error') || '',
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

    // Find score spans that belong to this case (via trial spans or directly)
    const scoreSpans = spans.filter(
      (span) =>
        span.data.attributes.gen_ai.operation.name === 'eval.score' &&
        parentIds.includes(span.data.parent_span_id),
    );

    if (scoreSpans.length > 0) {
      caseData.scores = {};

      scoreSpans.forEach((score) => {
        const name = getCustomOrRegularString(score.data.attributes, Attr.Eval.Score.Name) ?? '';
        const value = getCustomOrRegularNumber(score.data.attributes, Attr.Eval.Score.Value) ?? 0;
        const metadataRaw = getCustomOrRegularString(
          score.data.attributes,
          Attr.Eval.Score.Metadata,
        );
        let metadata = {};
        try {
          metadata = metadataRaw ? JSON.parse(metadataRaw) : {};
        } catch {
          // Ignore error
        }

        caseData.scores[name] = {
          name,
          value,
          metadata: {
            error: score.data.attributes.error,
            ...metadata,
          },
        };
      });
    }

    rootSpan.cases.push(caseData);
  }

  rootSpan.cases.sort((a, b) => a.index - b.index);

  return rootSpan;
};
