'use client';

import { useTelemetry } from '@/components/telemetry-context';

export function TelemetryPanel() {
  const { traces, clearTraces, axiom } = useTelemetry();

  if (!axiom) {
    return null;
  }

  return (
    <div className="text-xs p-2 rounded space-y-3">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="relative">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="absolute inset-0 w-1 h-1 bg-green-500 rounded-full animate-ping [animation-duration:2s]"></div>
          </div>
          <div className="font-medium text-gray-700">Axiom</div>
        </div>
        <div className="ml-4 text-gray-600">
          <span className="font-mono text-xs">⌙ {axiom.dataset}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">
            Recent traces (<span className="font-mono">{traces.length}</span>)
          </span>
          {traces.length > 0 && (
            <button
              onClick={clearTraces}
              className="cursor-pointer text-gray-400 hover:text-gray-600 ml-2"
              title="Clear all traces"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-2 space-y-1">
          {traces.map((trace) => (
            <div key={trace.traceId}>
              <div className="text-xs break-all">
                <a
                  href={`${axiom.url?.replace('api.', 'app.')}/${axiom.orgId}/trace?traceId=${trace.traceId}&traceDataset=${axiom.dataset}`}
                >
                  <span className="font-mono text-gray-600">{trace.traceId}</span>
                </a>{' '}
                <span className="text-gray-400">({trace.timestamp.toLocaleTimeString()})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
