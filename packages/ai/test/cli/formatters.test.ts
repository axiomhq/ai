import { describe, expect, it } from 'vitest';
import {
  formatCsv,
  formatJson,
  formatMcp,
  formatNdjson,
  formatTable,
} from '../../src/cli/format/formatters';

describe('cli formatters', () => {
  const rows = [
    { id: 'svc-a', value: 12, extra: 'alpha' },
    { id: 'svc-b', value: 7, extra: 'beta' },
    { id: 'svc-c', value: 3, extra: 'gamma' },
  ];
  const columns = ['id', 'value', 'extra'];

  it('formats table with truncation footer', () => {
    const result = formatTable(rows, columns, { maxCells: 4, terminalWidth: 40 });

    expect(result.stdout).toMatchInlineSnapshot(`
      "id     value  extra
      svc-a  12     alpha
      "
    `);
    expect(result.stderr).toMatchInlineSnapshot(
      `"\ntruncated: showing 1/3 rows (max-cells=4). rerun with --limit or --max-cells.\n"`,
    );
  });

  it('formats table without width truncation note by default', () => {
    const result = formatTable(
      [{ id: 'svc-a', value: 12, extra: 'alpha-beta-gamma-delta' }],
      columns,
      { maxCells: 100, terminalWidth: 20 },
    );

    expect(result.stdout).toContain('svc-a');
    expect(result.stderr).toBe('');
  });

  it('formats table with an explicit width truncation note', () => {
    const note = 'note: use --format [csv,json,jsonl] for complete values.';
    const result = formatTable(
      [{ id: 'svc-a', value: 12, extra: 'alpha-beta-gamma-delta' }],
      columns,
      { maxCells: 100, terminalWidth: 20, widthTruncationFooter: note },
    );

    expect(result.stdout).toContain('svc-a');
    expect(result.stderr).toBe(`\n${note}\n`);
  });

  it('formats csv with truncation footer', () => {
    const result = formatCsv(rows, columns, { maxCells: 4 });

    expect(result.stdout).toMatchInlineSnapshot(`
      "id,value,extra\nsvc-a,12,alpha\n"
    `);
    expect(result.stderr).toMatchInlineSnapshot(
      `"truncated: showing 1/3 rows (max-cells=4). rerun with --limit or --max-cells.\n"`,
    );
  });

  it('formats json wrapper', () => {
    const output = formatJson(
      {
        command: 'axiom datasets list',
        generated_at: '2026-01-01T00:00:00Z',
        truncated: false,
        rows_shown: 3,
        rows_total: 3,
      },
      rows,
    );

    expect(output).toMatchInlineSnapshot(`
      "{\n  \"meta\": {\n    \"command\": \"axiom datasets list\",\n    \"generated_at\": \"2026-01-01T00:00:00Z\",\n    \"truncated\": false,\n    \"rows_shown\": 3,\n    \"rows_total\": 3\n  },\n  \"data\": [\n    {\n      \"id\": \"svc-a\",\n      \"value\": 12,\n      \"extra\": \"alpha\"\n    },\n    {\n      \"id\": \"svc-b\",\n      \"value\": 7,\n      \"extra\": \"beta\"\n    },\n    {\n      \"id\": \"svc-c\",\n      \"value\": 3,\n      \"extra\": \"gamma\"\n    }\n  ]\n}\n"
    `);
  });

  it('formats ndjson', () => {
    expect(formatNdjson(rows)).toMatchInlineSnapshot(
      `"{\"id\":\"svc-a\",\"value\":12,\"extra\":\"alpha\"}\n{\"id\":\"svc-b\",\"value\":7,\"extra\":\"beta\"}\n{\"id\":\"svc-c\",\"value\":3,\"extra\":\"gamma\"}\n"`,
    );
  });

  it('formats mcp blocks', () => {
    const output = formatMcp('# Services', [
      {
        language: 'csv',
        content: 'id,value\nsvc-a,12',
      },
    ]);

    expect(output).toMatchInlineSnapshot(`
      "# Services\n\n\`\`\`csv\nid,value\nsvc-a,12\n\`\`\`\n"
    `);
  });
});
