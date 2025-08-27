const datasetName = process.env.AXIOM_DATASET ?? '';
const url = process.env.AXIOM_URL ?? 'https://api.axiom.co';
const token = process.env.AXIOM_TOKEN;

export type Evaluation = {
  id: string;
  name: string;
  type: string;
  version: string;
  baseline: {
    id: string | undefined;
    name: string | undefined;
  };
  collection: {
    name: string;
    size: number;
  };
  prompt: {
    model: string;
    params: Record<string, unknown>;
  };
  duration: number;
  status: string;
  traceId: string;
  runAt: string;
  tags: string[];
  user: {
    name: string | undefined;
    email: string | undefined;
  };
  cases: Case[];
};

export type Case = {
  index: number;
  input: string;
  output: string;
  expected: string;
  duration: string;
  status: string;
  scores: Record<
    string,
    {
      name: string;
      value: number;
      passed: boolean;
      threshold: number;
      metadata: Record<string, any>;
    }
  >;
  runAt: string;
  spanId: string;
  traceId: string;
  task?: Task;
};

export type Chat = {
  operation: string;
  capability: string;
  step: string;
  request: {
    max_token: string;
    model: string;
    temperature: number;
  };
  response: {
    finish_reasons: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

export type Task = {
  name: string;
  output: string;
  trial: number;
  type: string;
  error?: string;
  chat: Chat;
};

/** Query axiom to find a baseline for en Eval */
export const findBaseline = async (evalName: string) => {
  try {
    const apl = `['${datasetName}'] | where ['attributes.custom']['eval.name'] == "${evalName}" and ['attributes.gen_ai.operation.name'] == 'eval' | order by _time | limit 1`;

    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const resp = await fetch(`${url}/v1/datasets/_apl?format=legacy`, {
      headers: headers,
      method: 'POST',
      body: JSON.stringify({ apl }),
    });
    const payload = await resp.json();
    if (!resp.ok) {
      console.log(payload);
      return undefined;
    }
    if (payload.matches.length) {
      return mapSpanToEval(payload.matches[0]);
    }
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const findEvaluationCases = async (evalId: string) => {
  try {
    const apl = `['${datasetName}'] | where trace_id == "${evalId}" | order by _time`;

    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const resp = await fetch(`${url}/v1/datasets/_apl?format=legacy`, {
      headers: headers,
      method: 'POST',
      body: JSON.stringify({ apl }),
    });
    const payload = await resp.json();
    if (!resp.ok) {
      console.log(payload);
      return undefined;
    }
    if (payload.matches.length) {
      return buildSpanTree(payload.matches);
    }
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const mapSpanToEval = (span: any): Evaluation => {
  return {
    id: span.data.attributes.custom['eval.id'],
    name: span.data.attributes.custom['eval.name'],
    type: span.data.attributes.custom['eval.type'],
    version: span.data.attributes.custom['eval.version'],
    collection: {
      name: span.data.attributes.custom['eval.collection.name'],
      size: span.data.attributes.custom['eval.collection.size'],
    },
    baseline: {
      id: span.data.attributes.custom['eval.baseline.id'],
      name: span.data.attributes.custom['eval.baseline.name'],
    },
    prompt: {
      model: span.data.attributes.custom['eval.prompt.model'],
      params: span.data.attributes.custom['eval.prompt.params'],
    },
    duration: span.data.duration,
    status: span.data.status.code,
    traceId: span.data.trace_id,
    runAt: span._time,
    tags: span.data.attributes.custom['eval.tags'].length
      ? JSON.parse(span.data.attributes.custom['eval.tags'])
      : [],
    user: {
      name: span.data.attributes.custom['eval.user.name'],
      email: span.data.attributes.custom['eval.user.email'],
    },
    cases: [],
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
    index: data.attributes.custom['eval.case.index'],
    input: data.attributes.custom['eval.case.input'],
    output: data.attributes.custom['eval.case.output'],
    expected: data.attributes.custom['eval.case.expected'],
    duration: duration,
    status: data.status.code,
    scores: JSON.parse(data.attributes.custom['eval.case.scores']),
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
    const caseData = mapSpanToCase({
      _time: caseSpan._time,
      data: caseSpan.data,
    });

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
      const name = score.data.attributes.custom['eval.score.name'] as string;
      caseData.scores[name] = {
        name,
        passed: score.data.attributes.custom['eval.score.passed'],
        threshold: score.data.attributes.custom['eval.score.threshold'],
        value: score.data.attributes.custom['eval.score.value'],
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
