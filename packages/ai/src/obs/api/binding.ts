export type AxiomDataset = {
  name: string;
  description: string | null;
  kind?: string | null;
  created_at?: string | null;
  modified_at?: string | null;
};

export type AxiomDatasetField = {
  name: string;
  type: string;
  description?: string | null;
  unit?: string | null;
};

type DatasetInput = {
  name?: string;
  description?: string | null;
  kind?: string | null;
  created?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  modified?: string | null;
  modified_at?: string | null;
  modifiedAt?: string | null;
  dataset?: unknown;
  data?: unknown;
  metadata?: unknown;
};

type FieldInput = {
  name?: string;
  field?: string;
  type?: string;
  description?: string | null;
  unit?: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value === 'object' && value) {
    return value as Record<string, unknown>;
  }
  return undefined;
};

const pickFirstDefined = (records: Record<string, unknown>[], keys: string[]) => {
  for (const record of records) {
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) {
        continue;
      }
      const value = record[key];
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
};

const collectDatasetRecords = (input: DatasetInput) => {
  const root = asRecord(input);
  if (!root) {
    return [];
  }

  const records: Record<string, unknown>[] = [root];
  const nestedCandidates = [root.dataset, root.data, root.metadata];
  nestedCandidates.forEach((candidate) => {
    const record = asRecord(candidate);
    if (record && !records.includes(record)) {
      records.push(record);
    }
  });
  return records;
};

export const normalizeDataset = (input: DatasetInput): AxiomDataset => {
  const records = collectDatasetRecords(input);

  return {
    name: (pickFirstDefined(records, ['name']) as string | undefined) ?? '',
    description: (pickFirstDefined(records, ['description']) as string | null | undefined) ?? null,
    kind: (pickFirstDefined(records, ['kind']) as string | null | undefined) ?? null,
    created_at: (pickFirstDefined(records, ['created_at', 'createdAt', 'created']) as
      | string
      | null
      | undefined) ?? null,
    modified_at: (pickFirstDefined(records, ['modified_at', 'modifiedAt', 'modified']) as
      | string
      | null
      | undefined) ?? null,
  };
};

export const normalizeDatasetList = (input: unknown): AxiomDataset[] => {
  if (Array.isArray(input)) {
    return input
      .filter((entry): entry is DatasetInput => typeof entry === 'object' && !!entry)
      .map(normalizeDataset);
  }

  if (typeof input === 'object' && input) {
    const data = input as { datasets?: unknown };
    if (Array.isArray(data.datasets)) {
      return data.datasets
        .filter((entry): entry is DatasetInput => typeof entry === 'object' && !!entry)
        .map(normalizeDataset);
    }
  }

  return [];
};

export const normalizeDatasetField = (input: FieldInput): AxiomDatasetField => {
  const field: AxiomDatasetField = {
    name: input.name ?? input.field ?? '',
    type: input.type ?? '',
  };
  if (Object.prototype.hasOwnProperty.call(input, 'description')) {
    field.description = input.description ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(input, 'unit')) {
    field.unit = input.unit ?? null;
  }
  return field;
};

export const normalizeDatasetFields = (input: unknown): AxiomDatasetField[] => {
  if (Array.isArray(input)) {
    return input
      .filter((entry): entry is FieldInput => typeof entry === 'object' && !!entry)
      .map(normalizeDatasetField)
      .filter((field) => field.name.length > 0);
  }

  if (typeof input === 'object' && input) {
    const data = input as { fields?: unknown };
    if (Array.isArray(data.fields)) {
      return data.fields
        .filter((entry): entry is FieldInput => typeof entry === 'object' && !!entry)
        .map(normalizeDatasetField)
        .filter((field) => field.name.length > 0);
    }
  }

  return [];
};

export const fieldNamesFromDatasetFields = (fields: AxiomDatasetField[]): string[] =>
  fields.map((field) => field.name).filter((name) => name.length > 0);
