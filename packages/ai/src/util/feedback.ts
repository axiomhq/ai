export function getSuffix(baseUrl: string, dataset: string) {
  if (baseUrl.includes('edge.axiom')) {
    return `/v1/ingest/${dataset}`;
  }

  return `/v1/datasets/${dataset}/ingest`;
}
