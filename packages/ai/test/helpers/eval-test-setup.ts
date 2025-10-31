export interface MockAxiomResponse {
  matches: any[];
  status?: number;
}

/**
 * Creates a baseline evaluation response for testing
 */
export function createMockBaseline(
  name: string,
  evalId: string,
  caseCount: number = 3,
): MockAxiomResponse {
  const baselineCases = Array.from({ length: caseCount }, (_, i) => ({
    _time: new Date().toISOString(),
    data: {
      name: `case ${i}`,
      span_id: `case-${i}`,
      trace_id: evalId,
      parent_span_id: evalId,
      duration: '0.5s',
      status: { code: 'OK' },
      attributes: {
        custom: {
          'eval.case.index': i,
          'eval.case.input': `test input ${i}`,
          'eval.case.output': `test output ${i}`,
          'eval.case.expected': `expected output ${i}`,
          'eval.case.scores': JSON.stringify({
            accuracy: { name: 'accuracy', value: 0.85 },
            relevance: { name: 'relevance', value: 0.9 },
          }),
        },
        gen_ai: {
          operation: {
            name: 'eval.case',
          },
        },
      },
    },
  }));

  const evalSpan = {
    _time: new Date().toISOString(),
    data: {
      name: `eval ${name}`,
      span_id: evalId,
      trace_id: evalId,
      duration: '2.5s',
      status: { code: 'OK' },
      attributes: {
        custom: {
          'eval.id': evalId,
          'eval.name': name,
          'eval.version': 'baseline-v1',
          'eval.type': 'regression',
          'eval.collection.name': 'test-collection',
          'eval.collection.size': caseCount,
          'eval.tags': '[]',
          'eval.user.name': 'test-user',
          'eval.user.email': 'test@example.com',
          'eval.config.flags': JSON.stringify({ feature: { enabled: true } }),
        },
        gen_ai: {
          operation: {
            name: 'eval',
          },
        },
      },
    },
  };

  return {
    matches: [evalSpan, ...baselineCases],
  };
}

/**
 * Captures console output during test execution
 */
export class ConsoleCapture {
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  private logs: string[] = [];
  private errors: string[] = [];

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
  }

  start() {
    this.logs = [];
    this.errors = [];
    this.originalLog = console.log;
    this.originalError = console.error;

    console.log = (...args: any[]) => {
      this.logs.push(args.map(String).join(' '));
    };

    console.error = (...args: any[]) => {
      this.errors.push(args.map(String).join(' '));
    };
  }

  stop() {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  getLogs(): string[] {
    return this.logs;
  }

  getErrors(): string[] {
    return this.errors;
  }

  getOutput(): string {
    return this.logs.join('\n');
  }

  clear() {
    this.logs = [];
    this.errors = [];
  }
}
