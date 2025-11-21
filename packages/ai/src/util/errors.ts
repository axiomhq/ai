export class AxiomCLIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AxiomCLIError';
  }
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (_k: string, v: any) => {
    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) return '[Circular]';
      seen.add(v);
    }
    return v;
  };
}

function safeJson(x: any) {
  try {
    return JSON.stringify(x, getCircularReplacer());
  } catch {
    return String(x);
  }
}

export function errorToString(err: unknown) {
  try {
    if (typeof err === 'string') return err;

    if (err instanceof Error) {
      return err.stack ?? err.message;
    }

    if (typeof err === 'object' && err !== null) {
      const msg = (err as any).message;
      const json = safeJson(err);
      return msg ? `${msg} (${json})` : json;
    }

    return String(err);
  } catch {
    return '[unserializable error]';
  }
}
