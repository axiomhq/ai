import { createProgram } from '../../src/cli/program';

type RunCliOptions = {
  env?: Record<string, string | undefined>;
  stdoutIsTTY?: boolean;
};

type RunCliResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

const DEFAULT_ENV: Record<string, string> = {
  NO_COLOR: '1',
  TERM: 'dumb',
  COLUMNS: '120',
  AXIOM_PAGER: 'cat',
  TZ: 'UTC',
};

export const runCli = async (args: string[], options: RunCliOptions = {}): Promise<RunCliResult> => {
  const { env = {}, stdoutIsTTY = false } = options;
  const mergedEnv = { ...DEFAULT_ENV, ...env };
  const previousEnv: Record<string, string | undefined> = {};

  for (const key of Object.keys(mergedEnv)) {
    previousEnv[key] = process.env[key];
    process.env[key] = mergedEnv[key];
  }

  const originalIsTTY = process.stdout.isTTY;
  const originalExitCode = process.exitCode;
  process.exitCode = undefined;
  Object.defineProperty(process.stdout, 'isTTY', {
    value: stdoutIsTTY,
    configurable: true,
  });

  let stdout = '';
  let stderr = '';
  let exitCode = 0;

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding) => {
    stdout += Buffer.isBuffer(chunk) ? chunk.toString(encoding) : chunk;
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array, encoding?: BufferEncoding) => {
    stderr += Buffer.isBuffer(chunk) ? chunk.toString(encoding) : chunk;
    return true;
  }) as typeof process.stderr.write;

  if (!(globalThis as { __SDK_VERSION__?: string }).__SDK_VERSION__) {
    (globalThis as { __SDK_VERSION__?: string }).__SDK_VERSION__ = 'test-version';
  }

  const program = createProgram();
  program.configureOutput({
    writeOut: (data) => {
      stdout += data;
    },
    writeErr: (data) => {
      stderr += data;
    },
  });

  program.exitOverride((error) => {
    exitCode = error.exitCode ?? 1;
    throw error;
  });

  try {
    await program.parseAsync(['node', 'axiom', ...args]);
  } catch (_error) {
    const commanderError = _error as { exitCode?: number } | undefined;
    if (exitCode === 0 && commanderError?.exitCode === undefined) {
      exitCode = 1;
    }
  }

  if (typeof process.exitCode === 'number') {
    exitCode = process.exitCode;
  }

  Object.defineProperty(process.stdout, 'isTTY', {
    value: originalIsTTY,
    configurable: true,
  });

  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  process.exitCode = originalExitCode;

  for (const key of Object.keys(mergedEnv)) {
    if (previousEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previousEnv[key];
    }
  }

  return { stdout, stderr, exitCode };
};
