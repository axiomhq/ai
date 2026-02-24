const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const LEGACY_MATCH_METADATA_FIELDS = new Set(['_time', '_sysTime', '_rowId']);

const flattenLegacyEnvelope = (row: Record<string, unknown>): Record<string, unknown> => {
  const envelopeKey = ['data', 'fields', 'row'].find((key) => isObject(row[key]));
  if (!envelopeKey) {
    return row;
  }

  const nested = flattenLegacyEnvelope(row[envelopeKey] as Record<string, unknown>);
  const outerEntries = Object.entries(row).filter(
    ([key]) => key !== envelopeKey && !LEGACY_MATCH_METADATA_FIELDS.has(key),
  );

  if (outerEntries.length === 0) {
    return nested;
  }

  return {
    ...Object.fromEntries(outerEntries),
    ...nested,
  };
};

const objectRows = (rows: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((row): row is Record<string, unknown> => isObject(row))
    .map((row) => flattenLegacyEnvelope(row));
};

const rowsFromBucketEntries = (
  entries: unknown,
  aliases: string[],
): Record<string, unknown>[] => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((entry) => {
      const group = isObject(entry.group) ? entry.group : {};
      const aggregations = Array.isArray(entry.aggregations) ? entry.aggregations : [];
      const aggregateColumns = Object.fromEntries(
        aggregations.map((aggregation, index) => {
          if (!isObject(aggregation)) {
            return [`agg_${index}`, null];
          }
          const alias = aliases[index];
          const op = typeof aggregation.op === 'string' ? aggregation.op : `agg_${index}`;
          return [alias || op, aggregation.value ?? null];
        }),
      );
      return {
        ...group,
        ...aggregateColumns,
      };
    });
};

export const toQueryRows = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) {
    return objectRows(data);
  }

  if (!isObject(data)) {
    return [];
  }

  const matches = objectRows(data.matches);
  if (matches.length > 0) {
    return matches;
  }

  const rows = objectRows(data.rows);
  if (rows.length > 0) {
    return rows;
  }

  const request = isObject(data.request) ? data.request : {};
  const project = Array.isArray(request.project) ? request.project : [];
  const aliases = project
    .map((item) => (isObject(item) && typeof item.alias === 'string' ? item.alias : ''))
    .filter((item) => item.length > 0);

  const buckets = isObject(data.buckets) ? data.buckets : {};
  const totalsRows = rowsFromBucketEntries(buckets.totals, aliases);
  if (totalsRows.length > 0) {
    return totalsRows;
  }

  const series = Array.isArray(buckets.series) ? buckets.series : [];
  if (series.length > 0 && isObject(series[0])) {
    return rowsFromBucketEntries(series[0].groups, aliases);
  }

  return [];
};
