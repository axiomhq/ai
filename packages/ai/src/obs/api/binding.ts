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
  description: string | null;
  nullable?: boolean;
};

type DatasetInput = {
  name?: string;
  description?: string | null;
  kind?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  modified_at?: string | null;
  modifiedAt?: string | null;
};

type FieldInput = {
  name?: string;
  field?: string;
  type?: string;
  description?: string | null;
  nullable?: boolean;
};

export const normalizeDataset = (input: DatasetInput): AxiomDataset => ({
  name: input.name ?? '',
  description: input.description ?? null,
  kind: input.kind ?? null,
  created_at: input.created_at ?? input.createdAt ?? null,
  modified_at: input.modified_at ?? input.modifiedAt ?? null,
});

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

export const normalizeDatasetField = (input: FieldInput): AxiomDatasetField => ({
  name: input.name ?? input.field ?? '',
  type: input.type ?? '',
  description: input.description ?? null,
  nullable: input.nullable ?? false,
});

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
