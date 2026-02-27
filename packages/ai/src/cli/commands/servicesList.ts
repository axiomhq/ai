import type { Command } from 'commander';
import { withCliContext } from '../withCliContext';
import { formatJson, formatMcp } from '../format/formatters';
import {
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  UNLIMITED_MAX_CELLS,
  type OutputFormat,
} from '../format/output';
import { buildJsonMeta } from '../format/meta';
import { resolveTimeRange } from '../time/range';
import { SERVICE_LIST_APL_TEMPLATE } from '../otel/aplTemplates';
import { aplFieldRef, requireAuth, resolveTraceDatasets, toRows, write } from './servicesCommon';

const expandTemplate = (template: string, replacements: Record<string, string>) => {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(`\${${key}}`).join(value);
  }
  return output;
};

type ServiceListRow = {
  service: string;
  total: number;
  errored: number;
  error_rate: number;
  avg_duration_ns: number | null;
};

const hasService = (row: Record<string, unknown>) => {
  const service = row.service;
  return typeof service === 'string' && service.trim().length > 0;
};

const sortRows = (rows: ServiceListRow[]) =>
  [...rows].sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }
    if (right.errored !== left.errored) {
      return right.errored - left.errored;
    }
    return left.service.localeCompare(right.service);
  });

const durationMultiplierNs = (durationField: string) => {
  const normalized = durationField.toLowerCase();
  if (normalized.endsWith('_ms') || normalized.endsWith('.ms')) {
    return 1_000_000;
  }
  if (normalized.endsWith('_us') || normalized.endsWith('.us')) {
    return 1_000;
  }
  if (normalized.endsWith('_s') || normalized.endsWith('.s')) {
    return 1_000_000_000;
  }
  return 1;
};

const groupByRegion = <T extends { dataset: string; region?: string }>(datasets: T[]) => {
  const groups = new Map<string, T[]>();
  datasets.forEach((dataset) => {
    const key = dataset.region ? `region:${dataset.region}` : `dataset:${dataset.dataset}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(dataset);
      return;
    }
    groups.set(key, [dataset]);
  });
  return [...groups.values()].map((group) => [...group].sort((left, right) => left.dataset.localeCompare(right.dataset)));
};

const buildSourceProjection = (dataset: {
  dataset: string;
  fields: { serviceField?: string | null; statusField?: string | null; durationField?: string | null };
}) => {
  const statusExpr = dataset.fields.statusField ? aplFieldRef(dataset.fields.statusField) : '""';
  const durationExpr = `toreal(${aplFieldRef(dataset.fields.durationField!)}) * ${durationMultiplierNs(dataset.fields.durationField!)}`;
  return `(${aplFieldRef(dataset.dataset)} | project service=${aplFieldRef(dataset.fields.serviceField!)}, __status=${statusExpr}, __duration_ns=${durationExpr})`;
};

const toNumberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwoDecimals = (value: number) => Number(value.toFixed(2));

const aggregateRowsByService = (rows: Record<string, unknown>[]): ServiceListRow[] => {
  const byService = new Map<
    string,
    {
      total: number;
      errored: number;
      weightedDurationNs: number;
      durationWeight: number;
    }
  >();

  rows.forEach((row) => {
    const service = String(row.service ?? '').trim();
    if (!service) {
      return;
    }

    const total = toNumberOrZero(row.total);
    const errored = toNumberOrZero(row.errored);
    const averageDurationNs = toNumberOrNull(row.avg_duration_ns);

    const existing = byService.get(service) ?? {
      total: 0,
      errored: 0,
      weightedDurationNs: 0,
      durationWeight: 0,
    };

    existing.total += total;
    existing.errored += errored;
    if (averageDurationNs !== null && total > 0) {
      existing.weightedDurationNs += averageDurationNs * total;
      existing.durationWeight += total;
    }

    byService.set(service, existing);
  });

  return [...byService.entries()].map(([service, aggregate]) => ({
    service,
    total: aggregate.total,
    errored: aggregate.errored,
    error_rate: aggregate.total > 0 ? roundToTwoDecimals(aggregate.errored / aggregate.total) : 0,
    avg_duration_ns:
      aggregate.durationWeight > 0 ? aggregate.weightedDurationNs / aggregate.durationWeight : null,
  }));
};

const trimFraction = (value: number) => value.toFixed(2).replace(/\.?0+$/, '');

const formatDurationNs = (value: unknown) => {
  const ns = Number(value);
  if (!Number.isFinite(ns)) {
    return 'n/a';
  }

  const abs = Math.abs(ns);
  if (abs >= 60 * 1_000_000_000) {
    return `${trimFraction(ns / (60 * 1_000_000_000))}m`;
  }
  if (abs >= 1_000_000_000) {
    return `${trimFraction(ns / 1_000_000_000)}s`;
  }
  if (abs >= 1_000_000) {
    return `${trimFraction(ns / 1_000_000)}ms`;
  }
  if (abs >= 1_000) {
    return `${trimFraction(ns / 1_000)}us`;
  }
  return `${trimFraction(ns)}ns`;
};

const toTableRows = (rows: ServiceListRow[]) =>
  rows.map((row) => ({
    service: row.service,
    total: row.total,
    errored: row.errored,
    error_rate: row.error_rate,
    avg_duration: formatDurationNs(row.avg_duration_ns),
  }));

export const serviceList = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  requireAuth(config.orgId, config.token);

  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as {
    dataset?: string;
    since?: string;
    until?: string;
    start?: string;
    end?: string;
  };

  const timeRange = resolveTimeRange(
    {
      since: options.since,
      until: options.until,
      start: options.start,
      end: options.end,
    },
    new Date(),
    'now-30m',
    'now',
  );

  const { client, datasets } = await resolveTraceDatasets({
    url: config.url,
    orgId: config.orgId!,
    token: config.token!,
    explain,
    overrideDataset: options.dataset,
    requiredFields: ['serviceField', 'durationField'],
  });

  const datasetsByRegion = groupByRegion(datasets);
  const rawRows = (
    await Promise.all(
      datasetsByRegion.map(async (regionDatasets) => {
        const apl = expandTemplate(SERVICE_LIST_APL_TEMPLATE, {
          UNION_SOURCES: regionDatasets.map(buildSourceProjection).join(', '),
        });

        const queryResponse = await client.queryApl(undefined, apl, {
          startTime: timeRange.start,
          endTime: timeRange.end,
          maxBinAutoGroups: 40,
        });

        return toRows(queryResponse.data).filter(hasService);
      }),
    )
  ).flat();

  const rows = sortRows(aggregateRowsByService(rawRows));

  const columns = ['service', 'total', 'errored', 'error_rate', 'avg_duration_ns'];
  const tableColumns = ['service', 'total', 'errored', 'error_rate', 'avg_duration'];
  const tableRows = toTableRows(rows);

  const format = resolveOutputFormat(config.format as OutputFormat, 'list', true);

  if (format === 'json') {
    const meta = buildJsonMeta({
      command: 'axiom services list',
      timeRange,
      meta: {
        truncated: false,
        rowsShown: rows.length,
        rowsTotal: rows.length,
        columnsShown: columns.length,
        columnsTotal: columns.length,
      },
    });
    write(formatJson(meta, rows));
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, { format, maxCells: UNLIMITED_MAX_CELLS });
    write(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = renderTabular(rows, columns, {
      format: 'csv',
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });
    write(
      formatMcp('# Services (last 30m)', [
        {
          language: 'csv',
          content: csvResult.stdout.trimEnd(),
        },
      ]),
    );
    return;
  }

  const tabularRows = format === 'table' ? tableRows : rows;
  const tabularColumns = format === 'table' ? tableColumns : columns;

  const result = renderTabular(tabularRows, tabularColumns, {
    format,
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: config.quiet,
  });
  write(result.stdout, result.stderr);
});
