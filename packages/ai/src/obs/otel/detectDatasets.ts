import { mapOtelFields, TRACE_FIELD_CANDIDATES } from './fieldMapping';
import type { DetectDatasetsResult, DatasetDetectionResult, OtelFieldMap } from './types';

const hasAny = (fields: Set<string>, candidates: string[]) =>
  candidates.some((candidate) => fields.has(candidate));

const hasAnyOf = (fields: Set<string>, candidates: string[]) =>
  candidates.some((candidate) => fields.has(candidate));

const scoreTraceDataset = (schemaFields: string[]) => {
  const fields = new Set(schemaFields);
  let score = 0;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.traceId)) score += 5;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.spanId)) score += 5;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.service)) score += 3;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.spanName)) score += 2;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.duration)) score += 2;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.status)) score += 1;
  return score;
};

const scoreLogsDataset = (schemaFields: string[]) => {
  const fields = new Set(schemaFields);
  let score = 0;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.service)) score += 4;
  if (hasAny(fields, TRACE_FIELD_CANDIDATES.traceId)) score += 4;
  if (hasAnyOf(fields, ['severity_text', 'severity'])) score += 1;
  if (hasAnyOf(fields, ['body', 'message'])) score += 1;
  return score;
};

const mapDataset = (
  dataset: string,
  score: number,
  schemaFields: string[],
): DatasetDetectionResult => ({
  dataset,
  score,
  fields: mapOtelFields(schemaFields),
});

const pickWinner = (
  entries: Array<{ dataset: string; score: number; schemaFields: string[] }>,
): { winner: DatasetDetectionResult; ties: string[] } | null => {
  if (entries.length === 0) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.dataset.localeCompare(b.dataset);
  });

  const topScore = sorted[0].score;
  const ties = sorted.filter((entry) => entry.score === topScore).map((entry) => entry.dataset);

  return {
    winner: mapDataset(sorted[0].dataset, sorted[0].score, sorted[0].schemaFields),
    ties,
  };
};

export const buildTraceTieWarning = (ties: string[], winner: string) => {
  if (ties.length < 2) {
    return null;
  }
  return `warning: multiple trace datasets detected: ${ties.join(', ')}. using ${winner}. set --dataset to override.`;
};

export const detectOtelDatasets = (
  schemasByDataset: Record<string, string[]>,
): DetectDatasetsResult => {
  const traceCandidates: Array<{ dataset: string; score: number; schemaFields: string[] }> = [];
  const logsCandidates: Array<{ dataset: string; score: number; schemaFields: string[] }> = [];

  for (const dataset of Object.keys(schemasByDataset)) {
    const schemaFields = schemasByDataset[dataset];
    const traceScore = scoreTraceDataset(schemaFields);
    if (traceScore >= 10) {
      traceCandidates.push({ dataset, score: traceScore, schemaFields });
    }

    const logsScore = scoreLogsDataset(schemaFields);
    if (logsScore >= 8) {
      logsCandidates.push({ dataset, score: logsScore, schemaFields });
    }
  }

  const tracePick = pickWinner(traceCandidates);
  const logsPick = pickWinner(logsCandidates);

  return {
    traces: tracePick?.winner ?? null,
    logs: logsPick?.winner ?? null,
    traceTies: tracePick?.ties ?? [],
  };
};

export const requireOtelFields = (
  dataset: string,
  fields: OtelFieldMap,
  required: Array<keyof Omit<OtelFieldMap, 'timestampField'>>,
) => {
  const missing = required.filter((key) => !fields[key]);
  if (missing.length === 0) {
    return;
  }

  throw new Error(
    `Dataset ${dataset} is missing required fields: ${missing.join(', ')}. Run \`axiom services detect --explain\` to inspect mappings.`,
  );
};
