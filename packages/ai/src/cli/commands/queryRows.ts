const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const LEGACY_MATCH_METADATA_FIELDS = new Set(['_time', '_sysTime', '_rowId']);

export type QueryRow = Record<string, unknown>;

export type QueryRows = {
  rows: QueryRow[];
  timeseries: QueryRow[];
  totals: QueryRow[];
};

const flattenLegacyEnvelope = (row: QueryRow): QueryRow => {
  const envelopeKey = ['data', 'fields', 'row'].find((key) => isObject(row[key]));
  if (!envelopeKey) {
    return row;
  }

  const nested = flattenLegacyEnvelope(row[envelopeKey] as QueryRow);
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

const objectRows = (rows: unknown): QueryRow[] => {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter((row): row is QueryRow => isObject(row))
    .map((row) => flattenLegacyEnvelope(row));
};

const getProjectColumns = (request: unknown): string[] => {
  if (!isObject(request)) {
    return [];
  }

  const project = Array.isArray(request.project) ? request.project : [];
  return project.reduce<string[]>((columns, item) => {
    if (!isObject(item)) {
      return columns;
    }

    const field = typeof item.field === 'string' ? item.field : null;
    const alias = typeof item.alias === 'string' ? item.alias : null;
    const column = alias && alias.length > 0 ? alias : field;
    if (column && column.length > 0) {
      columns.push(column);
    }
    return columns;
  }, []);
};

const withUniqueName = (name: string, used: Set<string>, fallback: string) => {
  const base = name.length > 0 ? name : fallback;
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}_${suffix}`;
  while (used.has(candidate)) {
    suffix += 1;
    candidate = `${base}_${suffix}`;
  }
  used.add(candidate);
  return candidate;
};

const getAggregationColumns = (projectColumns: string[], aggregationCount: number): string[] => {
  if (aggregationCount <= 0 || projectColumns.length === 0) {
    return [];
  }
  if (projectColumns.length <= aggregationCount) {
    return projectColumns;
  }
  return projectColumns.slice(projectColumns.length - aggregationCount);
};

type AggregationAliasMap = Map<string, string[]>;

const cloneAggregationAliasMap = (map: AggregationAliasMap): AggregationAliasMap =>
  new Map([...map.entries()].map(([key, aliases]) => [key, [...aliases]]));

const getAggregationAliasMap = (request: unknown): AggregationAliasMap => {
  if (!isObject(request)) {
    return new Map();
  }

  const aggregations = Array.isArray(request.aggregations) ? request.aggregations : [];
  const aliasMap: AggregationAliasMap = new Map();

  const appendAlias = (key: string, alias: string) => {
    const existing = aliasMap.get(key);
    if (existing) {
      existing.push(alias);
      return;
    }
    aliasMap.set(key, [alias]);
  };

  aggregations.forEach((aggregation) => {
    if (!isObject(aggregation)) {
      return;
    }

    const op = typeof aggregation.op === 'string' ? aggregation.op : '';
    const alias = typeof aggregation.alias === 'string' ? aggregation.alias : '';
    if (alias.length === 0) {
      return;
    }

    if (op.length > 0) {
      appendAlias(op, alias);
    }
    appendAlias(alias, alias);
  });

  return aliasMap;
};

const consumeAlias = (aliasMap: AggregationAliasMap, op: string) => {
  const aliases = aliasMap.get(op);
  if (!aliases || aliases.length === 0) {
    return '';
  }

  const alias = aliases.shift() ?? '';
  if (aliases.length === 0) {
    aliasMap.delete(op);
  }
  return alias;
};

const rowFromBucketEntry = (
  entry: unknown,
  projectColumns: string[],
  aggregationAliasMap: AggregationAliasMap,
): QueryRow | null => {
  if (!isObject(entry)) {
    return null;
  }

  const group = isObject(entry.group) ? entry.group : {};
  const aggregations = Array.isArray(entry.aggregations) ? entry.aggregations : [];
  const aggregationColumns = getAggregationColumns(projectColumns, aggregations.length);
  const usedColumns = new Set(Object.keys(group));
  const projectColumnSet = new Set(projectColumns);
  const aliasQueues = cloneAggregationAliasMap(aggregationAliasMap);
  const aggregateColumns: QueryRow = {};

  aggregations.forEach((aggregation, index) => {
    if (!isObject(aggregation)) {
      const fallback = `agg_${index}`;
      aggregateColumns[withUniqueName('', usedColumns, fallback)] = null;
      return;
    }

    const op = typeof aggregation.op === 'string' ? aggregation.op : `agg_${index}`;
    const aliasFromOp = consumeAlias(aliasQueues, op);
    const aliasFromProject = projectColumnSet.has(op) ? op : '';
    const alias = aliasFromOp || aliasFromProject || aggregationColumns[index] || '';
    const columnName = withUniqueName(alias, usedColumns, op);
    aggregateColumns[columnName] = aggregation.value ?? null;
  });

  return {
    ...group,
    ...aggregateColumns,
  };
};

const rowsFromBucketEntries = (
  entries: unknown,
  projectColumns: string[],
  aggregationAliasMap: AggregationAliasMap,
): QueryRow[] => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => rowFromBucketEntry(entry, projectColumns, aggregationAliasMap))
    .filter((row): row is QueryRow => row !== null);
};

const rowsFromBucketSeries = (
  series: unknown,
  projectColumns: string[],
  aggregationAliasMap: AggregationAliasMap,
): QueryRow[] => {
  if (!Array.isArray(series)) {
    return [];
  }

  return series.flatMap((item) => {
    if (!isObject(item)) {
      return [];
    }

    const seriesGroup = isObject(item.group) ? item.group : {};
    const seriesWindow: QueryRow = {};
    if (typeof item.startTime === 'string') {
      seriesWindow._time = item.startTime;
    }
    if (typeof item.endTime === 'string') {
      seriesWindow._time_end = item.endTime;
    }

    const groupedRows = rowsFromBucketEntries(item.groups, projectColumns, aggregationAliasMap).map((row) => ({
      ...seriesGroup,
      ...seriesWindow,
      ...row,
    }));
    if (groupedRows.length > 0) {
      return groupedRows;
    }

    const row = rowFromBucketEntry(item, projectColumns, aggregationAliasMap);
    return row ? [{ ...seriesWindow, ...row }] : [];
  });
};

export const toQueryRows = (data: unknown): QueryRows => {
  if (Array.isArray(data)) {
    return {
      rows: objectRows(data),
      timeseries: [],
      totals: [],
    };
  }

  if (!isObject(data)) {
    return {
      rows: [],
      timeseries: [],
      totals: [],
    };
  }

  const matches = objectRows(data.matches);
  const rows = objectRows(data.rows);

  const projectColumns = getProjectColumns(data.request);
  const aggregationAliasMap = getAggregationAliasMap(data.request);
  const buckets = isObject(data.buckets) ? data.buckets : {};
  const totalsRows = rowsFromBucketEntries(buckets.totals, projectColumns, aggregationAliasMap);
  const seriesRows = rowsFromBucketSeries(buckets.series, projectColumns, aggregationAliasMap);

  return {
    rows:
      matches.length > 0
        ? matches
        : rows.length > 0
          ? rows
          : seriesRows.length > 0
            ? seriesRows
            : totalsRows,
    timeseries: seriesRows,
    totals: totalsRows,
  };
};
