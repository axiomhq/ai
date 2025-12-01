'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AxiomConfig {
  dataset: string;
  url?: string;
  orgId?: string;
}

interface TraceEntry {
  traceId: string;
  timestamp: Date;
}

interface TelemetryContextType {
  traces: TraceEntry[];
  clearTraces: () => void;
  axiom?: AxiomConfig;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

function getAxiomConfig(): AxiomConfig | undefined {
  if (process.env.NEXT_PUBLIC_AXIOM_ENABLED === 'true' && process.env.NEXT_PUBLIC_AXIOM_DATASET) {
    return {
      dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET,
      url: process.env.NEXT_PUBLIC_AXIOM_URL,
      orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
    };
  }
  return undefined;
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const [axiom, setAxiom] = useState<AxiomConfig | undefined>(undefined);

  const addTrace = (traceId: string, timestamp: Date) => {
    const newTrace = { traceId, timestamp };
    setTraces((prev) => [newTrace, ...prev]);
  };

  const clearTraces = () => setTraces([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAxiom(getAxiomConfig());

    // Keyboard shortcut for clearing traces
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        clearTraces();
      }
    };

    const originalFetch = window.fetch;

    const customFetch = Object.assign(async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      const traceId = response.headers.get('X-Trace-Id');
      const dateHeader = response.headers.get('Date');
      if (traceId) {
        addTrace(traceId, dateHeader ? new Date(dateHeader) : new Date());
      }
      return response;
    }, originalFetch);

    window.fetch = customFetch;
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <TelemetryContext.Provider value={{ traces, clearTraces, axiom }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
