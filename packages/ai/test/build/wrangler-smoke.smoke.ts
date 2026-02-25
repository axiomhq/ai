import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = fileURLToPath(new URL('.', import.meta.url));
const packageDir = resolve(testDir, '..', '..');
const fixtureDir = resolve(testDir, 'fixtures', 'wrangler-smoke');
const isWindows = process.platform === 'win32';
const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function runOrThrow(command: string, args: string[], cwd: string): void {
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: {
      ...process.env,
      NO_COLOR: '1',
      WRANGLER_SEND_METRICS: 'false',
    },
  });
}

function pickPort(): number {
  return 20000 + Math.floor(Math.random() * 20000);
}

async function waitForWorkerResponse(
  workerUrl: string,
  wranglerProc: ChildProcess,
  getLogs: () => string,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  const start = Date.now();
  let lastError = '';

  while (Date.now() - start < timeoutMs) {
    if (wranglerProc.exitCode !== null) {
      throw new Error(
        `Wrangler exited before serving requests (exit code ${wranglerProc.exitCode}).\n` +
          `Logs:\n${getLogs()}`,
      );
    }

    try {
      const response = await fetch(workerUrl);
      const body = await response.text();
      return { status: response.status, body };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await delay(250);
  }

  throw new Error(
    `Timed out waiting for worker response (${timeoutMs}ms). Last error: ${lastError}`,
  );
}

async function stopProcess(proc: ChildProcess): Promise<void> {
  if (proc.exitCode !== null) {
    return;
  }

  proc.kill('SIGTERM');
  try {
    await Promise.race([once(proc, 'exit'), delay(5000)]);
  } catch {
    // Ignore and force kill below.
  }

  if (proc.exitCode === null) {
    proc.kill('SIGKILL');
    await Promise.race([once(proc, 'exit'), delay(5000)]);
  }
}

describe('wrangler smoke test for axiom/ai', () => {
  it('boots in Cloudflare Workers local runtime and serves one request', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'axiom-wrangler-smoke-'));
    const packDir = join(tempRoot, 'pack');
    const appDir = join(tempRoot, 'app');
    let wranglerProc: ChildProcess | undefined;

    try {
      await mkdir(packDir, { recursive: true });
      await cp(fixtureDir, appDir, { recursive: true });

      runOrThrow(pnpmCmd, ['pack', '--pack-destination', packDir], packageDir);
      const files = await readdir(packDir);
      const tarballName = files.find((file) => file.endsWith('.tgz'));
      if (!tarballName) {
        throw new Error(`No packed tarball found in ${packDir}`);
      }

      const tarballPath = join(packDir, tarballName);
      runOrThrow(
        npmCmd,
        ['install', '--silent', 'wrangler@4.47.0', tarballPath, '@opentelemetry/api', 'zod'],
        appDir,
      );

      const wranglerBin = join(
        appDir,
        'node_modules',
        '.bin',
        isWindows ? 'wrangler.cmd' : 'wrangler',
      );
      const port = pickPort();
      const logs: string[] = [];

      wranglerProc = spawn(
        wranglerBin,
        [
          'dev',
          '--local',
          '--ip',
          '127.0.0.1',
          '--port',
          String(port),
          '--log-level',
          'error',
          '--show-interactive-dev-session=false',
        ],
        {
          cwd: appDir,
          env: {
            ...process.env,
            NO_COLOR: '1',
            WRANGLER_SEND_METRICS: 'false',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      wranglerProc.stdout?.on('data', (data) => logs.push(String(data)));
      wranglerProc.stderr?.on('data', (data) => logs.push(String(data)));

      const { status, body } = await waitForWorkerResponse(
        `http://127.0.0.1:${port}/`,
        wranglerProc,
        () => logs.join(''),
        30_000,
      );

      expect(status).toBe(200);
      const parsed = JSON.parse(body) as {
        withSpanType?: string;
        middlewareType?: string;
        result?: string;
      };
      expect(parsed.withSpanType).toBe('function');
      expect(parsed.middlewareType).toBe('function');
      expect(parsed.result).toBe('ok');
    } finally {
      if (wranglerProc) {
        await stopProcess(wranglerProc);
      }
      await rm(tempRoot, { recursive: true, force: true });
    }
  }, 180_000);
});
