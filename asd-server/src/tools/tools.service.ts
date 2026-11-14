import { Injectable } from '@nestjs/common';
import { BlobService } from '../blob/blob.service';
import { SandboxService } from '../sandbox/sandbox.service';
import { Tool, ToolId } from '../shared/contract';

// Registry of executable tools. The engine runs tool invocations through here;
// `TOOLS` is also what the LLM system prompt advertises, so only tools the agent
// actually has are offered to the model.
export const TOOLS: Record<ToolId, Tool> = {
  create_list: {
    id: 'create_list',
    name: 'Create list',
    description: 'Turn prose (a recipe, a plan, requirements) into a checkable list.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, items: { type: 'array', items: { type: 'string' } } } },
    produces: ['list'],
    needsApproval: false,
  },
  run_code: {
    id: 'run_code',
    name: 'Run code',
    description: 'Execute a small JavaScript program (synchronous) and return its output files: an SVG/PNG plot and/or CSV/JSON data.',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['javascript'] },
        code: { type: 'string' },
        timeoutSec: { type: 'number' },
      },
    },
    produces: ['image', 'data'],
    needsApproval: true,
  },
  // build_app / fetch_url land in M3 / later.
  build_app: {
    id: 'build_app',
    name: 'Build app',
    description: 'Generate a self-contained static web app and serve it at a link.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
      },
    },
    produces: ['app'],
    needsApproval: true,
  },
  fetch_url: {
    id: 'fetch_url',
    name: 'Fetch URL',
    description: 'Fetch a public URL and return its contents.',
    inputSchema: { type: 'object' },
    produces: ['data'],
    needsApproval: true,
    needsConnection: 'network',
  },
};

export type ToolResult = {
  artifacts: { kind: string; name: string; content: unknown }[];
  text?: string;
};

@Injectable()
export class ToolsService {
  constructor(
    private readonly sandbox: SandboxService,
    private readonly blobs: BlobService,
  ) {}

  // Runs a tool and returns the artifact specs it produced (possibly empty).
  // Throws for unknown tools.
  async run(toolId: string, args: unknown): Promise<ToolResult> {
    switch (toolId) {
      case 'create_list':
        return this.createList(args);
      case 'run_code':
        return this.runCode(args);
      case 'build_app':
        return this.buildApp(args);
      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }
  }

  private createList(args: unknown): ToolResult {
    const a = (args ?? {}) as { title?: unknown; items?: unknown };
    const title = typeof a.title === 'string' && a.title.trim() ? a.title.trim() : 'List';
    const items = (Array.isArray(a.items) ? a.items : [])
      .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      .map((text, i) => ({ id: `i${i + 1}`, text, checked: false }));
    return { artifacts: [{ kind: 'list', name: title, content: { kind: 'list', items } }] };
  }

  private async runCode(args: unknown): Promise<ToolResult> {
    const a = (args ?? {}) as { code?: unknown; timeoutSec?: unknown };
    const code = typeof a.code === 'string' ? a.code : '';
    if (!code.trim()) return { artifacts: [] };

    const result = await this.sandbox.run(code, {
      timeoutSec: typeof a.timeoutSec === 'number' ? a.timeoutSec : undefined,
    });

    const artifacts: ToolResult['artifacts'] = [];
    for (const file of result.files) {
      const blob = await this.blobs.put(file.data, file.mime, file.name);
      if (file.mime === 'image/svg+xml' || file.mime === 'image/png') {
        artifacts.push({
          kind: 'image',
          name: file.name,
          content: { kind: 'image', mime: file.mime, blobKey: blob.blobKey, url: blob.url, alt: file.name },
        });
      } else if (file.mime === 'text/csv' || file.mime === 'application/json') {
        artifacts.push({
          kind: 'data',
          name: file.name,
          content: {
            kind: 'data',
            format: file.mime === 'text/csv' ? 'csv' : 'json',
            blobKey: blob.blobKey,
            url: blob.url,
            preview: this.previewFor(file),
          },
        });
      }
    }
    return { artifacts, text: result.stdout || undefined };
  }

  // build_app: generate a single self-contained static `index.html` (a working
  // todo app) and serve it as a blob. Deterministic template for now — the LLM
  // generation path is a later addition.
  private async buildApp(args: unknown): Promise<ToolResult> {
    const a = (args ?? {}) as { title?: unknown; description?: unknown };
    const title = typeof a.title === 'string' && a.title.trim() ? a.title.trim() : 'Todo';
    const description =
      typeof a.description === 'string' && a.description.trim()
        ? a.description.trim()
        : 'A simple todo list — add, check off, and delete items.';
    const html = todoAppHtml(title, description);
    const blob = await this.blobs.put(html, 'text/html', 'index.html');
    return {
      artifacts: [
        {
          kind: 'app',
          name: title,
          content: {
            kind: 'app',
            entry: 'index.html',
            files: [{ path: 'index.html', body: html, language: 'html' }],
            blobKey: blob.blobKey,
            url: blob.url,
          },
        },
      ],
    };
  }

  // Best-effort inline preview for the `data` artifact: a small table of the
  // leading rows so the viewer doesn't have to download the file.
  private previewFor(file: { name: string; mime: string; data: string }): { columns: string[]; rows: string[][] } | undefined {
    try {
      if (file.mime === 'text/csv') {
        const lines = file.data.split(/\r?\n/).filter((l) => l.length);
        const rows = lines.slice(0, 6).map((l) => l.split(','));
        if (!rows.length) return undefined;
        return { columns: rows[0], rows: rows.slice(1) };
      }
      const parsed = JSON.parse(file.data) as unknown;
      if (Array.isArray(parsed) && parsed.length && parsed.every((r) => r && typeof r === 'object')) {
        const columns = Array.from(new Set(parsed.flatMap((r) => Object.keys(r as Record<string, unknown>)))).slice(0, 8);
        const rows = parsed.slice(0, 6).map((r) => columns.map((c) => stringify((r as Record<string, unknown>)[c])));
        return { columns, rows };
      }
    } catch {
      // unparseable — no preview
    }
    return undefined;
  }
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

// Self-contained todo app (inline JS/CSS, persists to localStorage). Teal accent
// `#0F766E` to match the app. No backticks / `${}` in the generated JS so the
// template literal stays valid.
function todoAppHtml(title: string, subtitle: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root { --teal: #0F766E; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f4f7f6; color: #1f2937; }
  .wrap { max-width: 480px; margin: 0 auto; padding: 32px 20px; }
  h1 { font-size: 24px; color: var(--teal); margin: 0 0 4px; }
  p.sub { color: #6b7280; margin: 0 0 20px; }
  form { display: flex; gap: 8px; margin-bottom: 16px; }
  input[type=text] { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; }
  button.add { background: var(--teal); color: #fff; border: 0; border-radius: 8px; padding: 0 16px; font-size: 15px; cursor: pointer; }
  button.add:hover { background: #0b5d57; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; align-items: center; gap: 10px; padding: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; }
  li.done .text { text-decoration: line-through; color: #9ca3af; }
  li input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--teal); }
  .text { flex: 1; }
  .del { background: none; border: 0; color: #b91c1c; cursor: pointer; font-size: 18px; line-height: 1; }
  li.empty { justify-content: center; color: #9ca3af; }
  .count { font-size: 13px; color: #6b7280; margin-top: 8px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  <form id="form">
    <input id="input" type="text" placeholder="Add a task…" autocomplete="off" />
    <button class="add" type="submit">Add</button>
  </form>
  <ul id="list"></ul>
  <div class="count" id="count"></div>
</div>
<script>
  var KEY = "asd.todo.items";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
  function updateCount() {
    var items = load();
    var done = items.filter(function (i) { return i.done; }).length;
    document.getElementById("count").textContent = done + " of " + items.length + " done";
  }
  function render() {
    var items = load();
    var list = document.getElementById("list");
    list.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Nothing here yet — add a task above.";
      list.appendChild(empty);
    } else {
      items.forEach(function (item) {
        var li = document.createElement("li");
        if (item.done) li.className = "done";
        var check = document.createElement("input");
        check.type = "checkbox";
        check.checked = !!item.done;
        check.onchange = function () { toggle(item.id); };
        var text = document.createElement("span");
        text.className = "text";
        text.textContent = item.text;
        var del = document.createElement("button");
        del.className = "del";
        del.innerHTML = "&times;";
        del.setAttribute("aria-label", "Delete");
        del.onclick = function () { remove(item.id); };
        li.appendChild(check);
        li.appendChild(text);
        li.appendChild(del);
        list.appendChild(li);
      });
    }
    updateCount();
  }
  function add(text) {
    var t = text.trim();
    if (!t) return;
    var items = load();
    items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), text: t, done: false });
    save(items);
    render();
  }
  function toggle(id) {
    var items = load();
    items.forEach(function (i) { if (i.id === id) i.done = !i.done; });
    save(items);
    render();
  }
  function remove(id) {
    save(load().filter(function (i) { return i.id !== id; }));
    render();
  }
  document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("input");
    add(input.value);
    input.value = "";
    input.focus();
  });
  render();
</script>
</body>
</html>
`;
}
