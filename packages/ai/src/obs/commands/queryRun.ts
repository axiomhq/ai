import { readFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { createObsApiClient } from '../api/client';
import { withObsContext } from '../cli/withObsContext';
import { formatJson, formatMcp } from '../format/formatters';
import {
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  type OutputFormat,
} from '../format/output';
import { getColumnsFromRows } from '../format/shape';
import { buildJsonMeta } from '../format/meta';
import { resolveTimeRange } from '../time/range';

const requireAuth = (orgId?: string, token?: string) => {
  if (!orgId || !token) {
    throw new Error('Missing Axiom credentials. Run `axiom auth login`.');
  }
};

const readStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk).toString('utf8'));
  }
  return chunks.join('');
};

const resolveApl = async (options: {
  apl?: string;
  file?: string;
  stdin?: boolean;
}): Promise<string> => {
  if (options.apl) {
    return options.apl;
  }

  if (options.file) {
    return readFile(options.file, 'utf8');
  }

  if (options.stdin) {
    const content = await readStdin();
    if (content.trim().length === 0) {
      throw new Error('No APL provided on stdin');
    }
    return content;
  }

  throw new Error('Missing APL input. Use --apl, --file, or --stdin.');
};

const toRows = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) {
    return data.filter((row): row is Record<string, unknown> => typeof row === 'object' && !!row);
  }

  if (typeof data === 'object' && data) {
    const objectData = data as {
      matches?: unknown;
      rows?: unknown;
    };

    if (Array.isArray(objectData.matches)) {
      return objectData.matches.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && !!row,
      );
    }

    if (Array.isArray(objectData.rows)) {
      return objectData.rows.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && !!row,
      );
    }
  }

  return [];
};

const write = (stdout: string, stderr = '') => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

const shouldResolveTimeRange = (options: Record<string, unknown>) =>
  Boolean(options.since || options.until || options.start || options.end);

export const queryRun = withObsContext(
  async ({ config, explain }, ...args: unknown[]) => {
    requireAuth(config.orgId, config.token);
    const dataset = String(args[0] ?? '');
    const command = args[args.length - 1] as Command;

    const options = command.optsWithGlobals() as {
      apl?: string;
      file?: string;
      stdin?: boolean;
      maxBinAutoGroups?: number | string;
      columns?: string;
      limit?: number | string;
      since?: string;
      until?: string;
      start?: string;
      end?: string;
    };

    const apl = (await resolveApl(options)).trim();
    const maxBinAutoGroups =
      options.maxBinAutoGroups !== undefined ? Number(options.maxBinAutoGroups) : 40;

    const timeRange = shouldResolveTimeRange(options)
      ? resolveTimeRange({
          since: options.since,
          until: options.until,
          start: options.start,
          end: options.end,
        })
      : undefined;

    const queryOptions: {
      maxBinAutoGroups: number;
      startTime?: string;
      endTime?: string;
    } = {
      maxBinAutoGroups,
      startTime: timeRange?.start,
      endTime: timeRange?.end,
    };

    const client = createObsApiClient({
      url: config.url,
      orgId: config.orgId!,
      token: config.token!,
      explain,
    });

    const response = await client.queryApl(dataset, apl, queryOptions);
    let rows = toRows(response.data);

    const limit = options.limit !== undefined ? Number(options.limit) : undefined;
    if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
      rows = rows.slice(0, limit);
    }

    const columns = getColumnsFromRows(rows);
    const format = resolveOutputFormat(config.format as OutputFormat, 'query', columns.length > 0);

    if (format === 'json') {
      const meta = buildJsonMeta({
        command: 'axiom query run',
        timeRange,
        meta: {
          truncated: false,
          rowsShown: rows.length,
          rowsTotal: rows.length,
          columnsShown: columns.length,
          columnsTotal: columns.length,
        },
      });

      write(
        formatJson(
          {
            ...meta,
            dataset,
            apl,
          },
          { rows },
        ),
      );
      return;
    }

    if (format === 'ndjson') {
      const result = renderNdjson(rows, columns, {
        format,
        maxCells: config.maxCells,
        columnsOverride: options.columns,
      });
      write(result.stdout);
      return;
    }

    if (format === 'mcp') {
      const csvResult = renderTabular(rows, columns, {
        format: 'csv',
        maxCells: config.maxCells,
        columnsOverride: options.columns,
        quiet: true,
      });

      const headerLines = [
        '# Query Result',
        `Dataset: ${dataset}`,
        'APL:',
        '```apl',
        apl,
        '```',
      ];

      if (csvResult.meta.truncated) {
        headerLines.push(
          `Truncated to ${csvResult.meta.rowsShown}/${csvResult.meta.rowsTotal} rows (max-cells=${config.maxCells}).`,
        );
      }

      write(
        formatMcp(headerLines.join('\n'), [
          {
            language: 'csv',
            content: csvResult.stdout.trimEnd(),
          },
        ]),
      );
      return;
    }

    const result = renderTabular(rows, columns, {
      format,
      maxCells: config.maxCells,
      quiet: config.quiet,
      columnsOverride: options.columns,
    });
    write(result.stdout, result.stderr);
  },
);
