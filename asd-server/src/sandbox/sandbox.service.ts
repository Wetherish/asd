import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';

export type SandboxFile = { name: string; mime: string; data: string };
export type SandboxResult = { exitCode: number; stdout: string; stderr: string; files: SandboxFile[] };

// Runs the submitted code in a child Node process with a restricted `vm` context:
// no require/process/fs/fetch, so no filesystem or network access — the code can
// only compute and emit files via `save`/`saveJSON`. This is the *local dev*
// sandbox; in production this is replaced by a dedicated Lambda (see
// design/05-tools.md §4) behind the same `SandboxService.run` interface.
const WRAPPER = `
const { createContext, runInContext } = require('node:vm');
const code = Buffer.from(process.env.SANDBOX_CODE || '', 'base64').toString('utf8');
const timeoutMs = parseInt(process.env.SANDBOX_TIMEOUT || '10000', 10);

const logs = [];
const files = [];
function fmt(v) {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return v.stack || String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}
function mimeFor(name) {
  const n = name.toLowerCase();
  if (n.endsWith('.svg')) return 'image/svg+xml';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.csv')) return 'text/csv';
  if (n.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}
const context = createContext({
  console: {
    log: (...a) => logs.push(a.map(fmt).join(' ')),
    warn: (...a) => logs.push(a.map(fmt).join(' ')),
    error: (...a) => logs.push(a.map(fmt).join(' ')),
  },
  save: (name, content) => {
    if (typeof name !== 'string' || typeof content !== 'string') throw new Error('save(name, content) expects two strings');
    files.push({ name, content });
  },
  saveJSON: (name, value) => files.push({ name, content: JSON.stringify(value, null, 2) }),
  JSON, Math, Date, Number, String, Boolean, Array, Object, isNaN, parseInt, parseFloat, RegExp,
});

let exitCode = 0;
let stderr = '';
try {
  runInContext(code, context, { timeout: timeoutMs, displayErrors: true });
} catch (err) {
  exitCode = 1;
  stderr = String((err && err.stack) || err);
}
process.stdout.write(JSON.stringify({
  exitCode,
  stdout: logs.join('\\n'),
  stderr,
  files: files.map((f) => ({ name: f.name, mime: mimeFor(f.name), data: f.content })),
}));
`;

@Injectable()
export class SandboxService {
  private readonly timeoutMs: number;
  private readonly maxOutputBytes: number;

  constructor(config: ConfigService) {
    this.timeoutMs = Number(config.get<string>('SANDBOX_TIMEOUT_MS') ?? 10000);
    this.maxOutputBytes = Number(config.get<string>('SANDBOX_MAX_OUTPUT_BYTES') ?? 1024 * 1024);
  }

  async run(code: string, opts?: { timeoutSec?: number }): Promise<SandboxResult> {
    const timeoutMs = (opts?.timeoutSec ?? Math.round(this.timeoutMs / 1000)) * 1000;
    return this.runLocal(code, timeoutMs);
  }

  private runLocal(code: string, timeoutMs: number): Promise<SandboxResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', WRAPPER], {
        env: {
          ...process.env,
          SANDBOX_CODE: Buffer.from(code, 'utf8').toString('base64'),
          SANDBOX_TIMEOUT: String(timeoutMs),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        if (!settled) {
          settled = true;
          reject(new Error('Sandbox execution timed out'));
        }
      }, timeoutMs + 2000);

      child.stdout.on('data', (d: Buffer) => {
        stdout += d.toString('utf8');
        if (stdout.length > this.maxOutputBytes) child.kill('SIGKILL');
      });
      child.stderr.on('data', (d: Buffer) => {
        stderr += d.toString('utf8');
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (settled) return;
        settled = true;
        try {
          const parsed = JSON.parse(stdout) as SandboxResult;
          resolve({ ...parsed, stderr: stderr || parsed.stderr || '' });
        } catch {
          resolve({
            exitCode: code ?? 1,
            stdout: stdout.slice(0, this.maxOutputBytes),
            stderr: stderr || 'Sandbox produced no result',
            files: [],
          });
        }
      });
    });
  }
}
