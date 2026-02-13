export type ExplainRequest = {
  method: string;
  path: string;
  status?: number;
  requestId?: string;
};

export type ExplainQuery = {
  dataset?: string;
  apl: string;
  options?: Record<string, unknown>;
};

export type ExplainContext = {
  requests: ExplainRequest[];
  queries: ExplainQuery[];
};

export const createExplainContext = (): ExplainContext => ({
  requests: [],
  queries: [],
});

export const recordRequest = (ctx: ExplainContext, request: ExplainRequest) => {
  ctx.requests.push(request);
};

export const recordQuery = (ctx: ExplainContext, query: ExplainQuery) => {
  ctx.queries.push(query);
};

const formatRequest = (request: ExplainRequest) => {
  const details = [
    request.status !== undefined ? `status=${request.status}` : null,
    request.requestId ? `request_id=${request.requestId}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return `  - ${request.method} ${request.path}${details ? ` ${details}` : ''}`;
};

const formatQuery = (query: ExplainQuery) => {
  const dataset = query.dataset ? `dataset=${query.dataset} ` : '';
  const options = query.options ? ` options=${JSON.stringify(query.options)}` : '';
  return `  - ${dataset}apl=${JSON.stringify(query.apl)}${options}`;
};

const writeLine = (line: string) => {
  process.stderr.write(`${line}\n`);
};

export const emitExplainToStderr = (ctx: ExplainContext) => {
  writeLine('explain:');
  writeLine('requests:');
  if (ctx.requests.length === 0) {
    writeLine('  (none)');
  } else {
    ctx.requests.forEach((request) => {
      writeLine(formatRequest(request));
    });
  }
  writeLine('queries:');
  if (ctx.queries.length === 0) {
    writeLine('  (none)');
  } else {
    ctx.queries.forEach((query) => {
      writeLine(formatQuery(query));
    });
  }
};
