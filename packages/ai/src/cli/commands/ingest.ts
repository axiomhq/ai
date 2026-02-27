import { readFile } from 'node:fs/promises';
import type { Command } from 'commander';
import {
  createAxiomApiClient,
  type IngestContentEncoding,
  type IngestContentType,
} from '../api/client';
import {
  renderJson,
  renderMcp,
  renderNdjson,
  renderTabular,
  resolveOutputFormat,
  UNLIMITED_MAX_CELLS,
} from '../format/output';
import { formatCsv } from '../format/formatters';
import { withCliContext } from '../withCliContext';

type IngestOptions = {
  file?: string | string[];
  timestampField?: string;
  timestampFormat?: string;
  delimiter?: string;
  contentType?: IngestContentType;
  contentEncoding?: IngestContentEncoding;
  label?: string | string[];
  csvFields?: string | string[];
  continueOnError?: boolean;
  edgeUrl?: string;
  apiToken?: string;
};

type IngestStatusShape = {
  ingested?: number;
  failed?: number;
  processedBytes?: number;
  failures?: unknown[];
};

type IngestInput = {
  source: string;
  payload: Buffer;
};

const SUPPORTED_CONTENT_TYPES = new Set(['json', 'ndjson', 'csv']);
const SUPPORTED_CONTENT_ENCODINGS = new Set(['identity', 'gzip', 'zstd']);

const writeOutput = (stdout: string, stderr = '') => {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
};

const asArray = (value: string | string[] | undefined) => {
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean);
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const readStdin = async () => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const collectInputs = async (files: string[]) => {
  if (files.length === 0) {
    if (process.stdin.isTTY) {
      throw new Error('Missing ingest input. Provide --file or pipe data on stdin.');
    }
    return [{ source: 'stdin', payload: await readStdin() }];
  }

  const inputs: IngestInput[] = [];
  let stdinBuffer: Buffer | null = null;

  for (const file of files) {
    if (file === '-') {
      if (stdinBuffer === null) {
        if (process.stdin.isTTY) {
          throw new Error('Input file "-" requires piped stdin.');
        }
        stdinBuffer = await readStdin();
      }
      inputs.push({ source: 'stdin', payload: stdinBuffer });
      continue;
    }

    inputs.push({
      source: file,
      payload: await readFile(file),
    });
  }

  return inputs;
};

const detectContentType = (payload: Buffer, source: string): IngestContentType => {
  const lowerSource = source.toLowerCase();
  if (lowerSource.endsWith('.ndjson') || lowerSource.endsWith('.jsonl')) {
    return 'ndjson';
  }
  if (lowerSource.endsWith('.csv')) {
    return 'csv';
  }
  if (lowerSource.endsWith('.json')) {
    return 'json';
  }

  const sample = payload.toString('utf8', 0, Math.min(payload.length, 4096)).trimStart();
  if (sample.startsWith('[')) {
    return 'json';
  }
  if (sample.startsWith('{')) {
    const lines = sample.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every((line) => line.startsWith('{'))) {
      return 'ndjson';
    }
    return 'json';
  }

  const [firstLine = '', secondLine = ''] = sample.split(/\r?\n/);
  if (firstLine.includes(',') && secondLine.includes(',')) {
    return 'csv';
  }

  return 'ndjson';
};

const parseLabels = (values: string[]) => {
  const labels: Record<string, string> = {};
  values.forEach((value) => {
    const separatorIndex = value.indexOf(':');
    if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
      throw new Error(`Invalid label '${value}'. Expected key:value.`);
    }
    const key = value.slice(0, separatorIndex).trim();
    const labelValue = value.slice(separatorIndex + 1).trim();
    if (!key || !labelValue) {
      throw new Error(`Invalid label '${value}'. Expected key:value.`);
    }
    labels[key] = labelValue;
  });
  return labels;
};

const normalizeIngestStatus = (status: IngestStatusShape) => {
  const ingested = typeof status.ingested === 'number' ? status.ingested : 0;
  const failed = typeof status.failed === 'number' ? status.failed : 0;
  const processedBytes = typeof status.processedBytes === 'number' ? status.processedBytes : 0;
  const failures = Array.isArray(status.failures) ? status.failures.length : 0;

  return {
    ingested,
    failed,
    processed_bytes: processedBytes,
    failures,
  };
};

const buildMcpHeader = (dataset: string, rowsShown: number, rowsTotal: number) => {
  if (rowsShown < rowsTotal) {
    return `# Ingest ${dataset}\nShowing ${rowsShown}/${rowsTotal} rows.`;
  }
  return `# Ingest ${dataset}\nShowing ${rowsShown} rows.`;
};

export const ingestRun = withCliContext(async ({ config, explain }, ...args: unknown[]) => {
  const dataset = String(args[0] ?? '');
  const command = args[args.length - 1] as Command;
  const options = command.optsWithGlobals() as IngestOptions;
  const apiToken = options.apiToken?.trim();
  const token = apiToken || config.token;
  if (!token) {
    throw new Error('Missing API token. Provide --token or --api-token.');
  }

  const contentEncoding = options.contentEncoding ?? 'identity';
  if (!SUPPORTED_CONTENT_ENCODINGS.has(contentEncoding)) {
    throw new Error(`Unsupported content encoding '${contentEncoding}'. Use identity, gzip, or zstd.`);
  }

  if (contentEncoding !== 'identity' && !options.contentType) {
    throw new Error('Content encoding requires --content-type.');
  }

  if (options.contentType && !SUPPORTED_CONTENT_TYPES.has(options.contentType)) {
    throw new Error(`Unsupported content type '${options.contentType}'. Use json, ndjson, or csv.`);
  }

  const files = asArray(options.file);
  const labels = parseLabels(asArray(options.label));
  const csvFields = asArray(options.csvFields);
  const inputs = await collectInputs(files);

  const client = createAxiomApiClient({
    url: config.url,
    orgId: config.orgId,
    token,
    explain,
  });

  const rows: Record<string, unknown>[] = [];
  let errors = 0;

  for (const input of inputs) {
    const contentType = options.contentType ?? detectContentType(input.payload, input.source);
    if (options.delimiter && contentType !== 'csv') {
      throw new Error('--delimiter is only valid when content type is csv.');
    }

    try {
      const response = await client.ingestDataset<IngestStatusShape>(
        dataset,
        new Uint8Array(input.payload),
        {
          contentType,
          contentEncoding,
          timestampField: options.timestampField,
          timestampFormat: options.timestampFormat,
          delimiter: options.delimiter,
          labels,
          csvFields,
          edgeUrl: options.edgeUrl,
          apiToken,
        },
      );
      rows.push({
        source: input.source,
        content_type: contentType,
        ...normalizeIngestStatus(response.data),
      });
    } catch (error) {
      errors += 1;
      if (!options.continueOnError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`warning: failed ingest for ${input.source}: ${message}\n`);
    }
  }

  if (rows.length === 0 && errors > 0) {
    throw new Error('All ingest operations failed.');
  }

  const columns = ['source', 'content_type', 'ingested', 'failed', 'failures', 'processed_bytes'];
  const format = resolveOutputFormat(config.format as any, 'get', true);

  if (format === 'json') {
    const result = renderJson('axiom ingest', rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'ndjson') {
    const result = renderNdjson(rows, columns, {
      format,
      maxCells: UNLIMITED_MAX_CELLS,
    });
    writeOutput(result.stdout);
    return;
  }

  if (format === 'mcp') {
    const csvResult = formatCsv(rows, columns, {
      maxCells: UNLIMITED_MAX_CELLS,
      quiet: true,
    });
    const output = renderMcp(buildMcpHeader(dataset, csvResult.meta.rowsShown, csvResult.meta.rowsTotal), [
      { language: 'csv', content: csvResult.stdout.trimEnd() },
    ]);
    writeOutput(output.stdout);
    return;
  }

  const result = renderTabular(rows, columns, {
    format: format === 'csv' ? 'csv' : 'table',
    maxCells: UNLIMITED_MAX_CELLS,
    quiet: format === 'csv' ? true : config.quiet,
  });
  writeOutput(result.stdout, result.stderr);
});
