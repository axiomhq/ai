// ✨ New Robust Table Formatter Utility
/**
 * A robust, dynamic table formatter for CLI output.
 * @param config - The table configuration.
 * @returns A formatted string representing the table.
 */
export function formatTable(config: {
  headers: string[];
  rows: string[][];
  padding?: number;
  align?: ('left' | 'right')[];
  uppercaseHeaders?: boolean;
}): string {
  const { headers, rows, padding = 2, align = [], uppercaseHeaders = true } = config;
  const colCount = headers.length;

  // 1. Calculate the maximum width needed for each column
  const colWidths = headers.map((header) => header.length);
  for (const row of rows) {
    for (let i = 0; i < colCount; i++) {
      const cellLength = row[i]?.length || 0;
      if (cellLength > colWidths[i]) {
        colWidths[i] = cellLength;
      }
    }
  }

  // Helper to render a single row with correct padding
  const renderRow = (items: string[], isHeader = false) => {
    const cells = items.map((rawItem, i) => {
      const item = isHeader && uppercaseHeaders ? rawItem.toUpperCase() : rawItem;
      const totalWidth = colWidths[i] + padding * 2;
      const isRight = align[i] === 'right';
      const inner = isRight
        ? ' '.repeat(padding) + item.padStart(colWidths[i]) + ' '.repeat(padding)
        : ' '.repeat(padding) + item.padEnd(colWidths[i]) + ' '.repeat(padding);
      return inner.padEnd(totalWidth);
    });
    return `|${cells.join('|')}|`;
  };

  // 2. Build the table string
  const output = [
    renderRow(headers, true),
    renderSeparator(colWidths, padding),
    ...rows.map((row) =>
      // Check if the row is a separator row
      row.every((cell) => cell === '---') ? renderSeparator(colWidths, padding) : renderRow(row),
    ),
  ];

  return output.join('\n');
}

export const renderSeparator = (colWidths: number[], padding: number) => {
  const segments = colWidths.map((width) => '-'.repeat(width + padding * 2));
  return `|${segments.join('|')}|`;
};

export const renderLine = () => {
  console.log('='.repeat(80));
};

export const truncateText = (text: string): string => {
  return text.length > 24 ? text.slice(0, 24) + '...' : text;
};

// Utility to analyze differences between two configs
function analyzeConfigDiff(baseConfig: any, compConfig: any) {
  const additions: Array<{ path: string; value: any }> = [];
  const modifications: Array<{ path: string; from: any; to: any }> = [];
  const deletions: Array<{ path: string; value: any }> = [];

  function compareObjects(base: any, comp: any, path = '') {
    const baseKeys = new Set(Object.keys(base || {}));
    const compKeys = new Set(Object.keys(comp || {}));
    const allKeys = new Set([...baseKeys, ...compKeys]);

    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key;
      const baseVal = base?.[key];
      const compVal = comp?.[key];

      if (!baseKeys.has(key)) {
        additions.push({ path: fullPath, value: compVal });
      } else if (!compKeys.has(key)) {
        deletions.push({ path: fullPath, value: baseVal });
      } else if (JSON.stringify(baseVal) !== JSON.stringify(compVal)) {
        if (
          typeof baseVal === 'object' &&
          typeof compVal === 'object' &&
          baseVal !== null &&
          compVal !== null
        ) {
          compareObjects(baseVal, compVal, fullPath);
        } else {
          modifications.push({ path: fullPath, from: baseVal, to: compVal });
        }
      }
    }
  }

  compareObjects(baseConfig, compConfig);
  return { additions, modifications, deletions };
}

// Utility to format config diff for display
export function formatConfigDiff(baseConfig: Record<string, any>, compConfig: Record<string, any>) {
  const diff = analyzeConfigDiff(baseConfig, compConfig);
  const rows: string[][] = [];

  const truncate = (value: any) => {
    const str = JSON.stringify(value);
    return str.length > 25 ? str.substring(0, 22) + '...' : str;
  };

  diff.modifications.forEach((mod) => {
    rows.push([`- ${mod.path}: ${truncate(mod.from)}`, `+ ${mod.path}: ${truncate(mod.to)}`]);
  });

  diff.additions.forEach((add) => {
    rows.push([`  ${add.path}: NULL`, `+ ${add.path}: ${truncate(add.value)}`]);
  });

  diff.deletions.forEach((del) => {
    rows.push([`- ${del.path}: ${truncate(del.value)}`, `  ${del.path}: NULL`]);
  });

  const getSameValues = (base: any, comp: any, path = '') => {
    Object.keys(base || {}).forEach((key) => {
      const fullPath = path ? `${path}.${key}` : key;
      if (
        comp &&
        Object.prototype.hasOwnProperty.call(comp, key) &&
        JSON.stringify(base[key]) === JSON.stringify(comp[key])
      ) {
        if (typeof base[key] === 'object' && base[key] !== null) {
          getSameValues(base[key], comp[key], fullPath);
        } else {
          rows.push([`  ${fullPath}: <SAME>`, `  ${fullPath}: <SAME>`]);
        }
      }
    });
  };

  getSameValues(baseConfig, compConfig);

  const summary = `${diff.additions.length} ADDITIONS, ${diff.modifications.length} MODIFICATIONS, ${diff.deletions.length} DELETIONS`;
  return { rows, summary };
}
