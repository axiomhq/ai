export const isStdoutTty = () => Boolean(process.stdout.isTTY);

export const getStdoutColumns = (): number => {
  if (typeof process.stdout.columns === 'number') {
    return process.stdout.columns;
  }
  const envColumns = process.env.COLUMNS ? Number(process.env.COLUMNS) : undefined;
  if (typeof envColumns === 'number' && Number.isFinite(envColumns)) {
    return envColumns;
  }
  return 120;
};
