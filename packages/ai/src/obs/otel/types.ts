export type OtelFieldMap = {
  serviceField: string | null;
  traceIdField: string | null;
  spanIdField: string | null;
  parentSpanIdField: string | null;
  spanNameField: string | null;
  spanKindField: string | null;
  statusField: string | null;
  durationField: string | null;
  timestampField: string;
};

export type DatasetDetectionResult = {
  dataset: string;
  score: number;
  fields: OtelFieldMap;
};

export type DetectDatasetsResult = {
  traces: DatasetDetectionResult | null;
  logs: DatasetDetectionResult | null;
  traceTies: string[];
};
