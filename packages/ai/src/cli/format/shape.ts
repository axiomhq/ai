export type ShapeResult<T> = {
  rows: T[];
  columns: string[];
  truncated: boolean;
  rowsShown: number;
  rowsTotal: number;
  columnsShown: number;
  columnsTotal: number;
};

export const applyColumnOrder = <T extends Record<string, unknown>>(
  rows: T[],
  columns: string[],
) => {
  const columnSet = new Set(columns);
  const ordered = columns.filter((column) => columnSet.has(column));
  return { rows, columns: ordered };
};

export const applyColumnsOverride = (columns: string[], override?: string) => {
  if (!override) {
    return columns;
  }
  return override
    .split(',')
    .map((column) => column.trim())
    .filter((column) => column.length > 0);
};

export const truncateToBudget = <T extends Record<string, unknown>>(
  rows: T[],
  columns: string[],
  maxCells: number,
): ShapeResult<T> => {
  const rowsTotal = rows.length;
  const columnsTotal = columns.length;
  const safeMaxCells = Math.max(1, maxCells);

  let rowsShown = rowsTotal;
  let columnsShown = columnsTotal;

  if (rowsShown * columnsShown > safeMaxCells) {
    rowsShown = Math.max(1, Math.floor(safeMaxCells / Math.max(columnsShown, 1)));
  }

  if (rowsShown * columnsShown > safeMaxCells) {
    columnsShown = Math.max(1, Math.floor(safeMaxCells / Math.max(rowsShown, 1)));
  }

  const truncated = rowsShown < rowsTotal || columnsShown < columnsTotal;
  const slicedRows = rows.slice(0, rowsShown);
  const keptColumns = columns.slice(0, Math.max(1, columnsShown));

  return {
    rows: slicedRows,
    columns: keptColumns,
    truncated,
    rowsShown,
    rowsTotal,
    columnsShown: keptColumns.length,
    columnsTotal,
  };
};

export const pickColumns = <T extends Record<string, unknown>>(
  rows: T[],
  columns: string[],
): Record<string, unknown>[] =>
  rows.map((row) => {
    const picked: Record<string, unknown> = {};
    columns.forEach((column) => {
      if (column in row) {
        picked[column] = row[column];
      } else {
        picked[column] = null;
      }
    });
    return picked;
  });

export const getColumnsFromRows = (rows: Record<string, unknown>[]) => {
  const columns = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      columns.add(key);
    });
  });
  return [...columns];
};
