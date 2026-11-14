import type { RealtimeEvent, Scope } from "./types";

export type RealtimeClientOptions = {
  wsUrl: string; // e.g. "ws://localhost:4000/ws"
  getToken: () => string | null;
};

type Handler = (event: RealtimeEvent) => void;

function matchesEvent(scope: Scope, id: string, e: RealtimeEvent): boolean {
  switch (scope) {
    case "session":
      switch (e.type) {
        case "message.delta":
        case "message.done":
        case "message.error":
          return e.data.sessionId === id;
        case "approval.created":
        case "approval.updated":
          return e.data.approval.sessionId === id;
        case "artifact.created":
        case "artifact.updated":
          return e.data.sessionId === id;
        case "session.updated":
          return e.data.session.id === id;
        case "presence":
          return e.data.sessionId === id;
        default:
          return false;
      }
    case "job":
      return e.type === "job.updated" && e.data.job.id === id;
    case "global":
      return (
        e.type === "approval.created" ||
        e.type === "approval.updated" ||
        e.type === "job.updated" ||
        e.type === "session.updated"
      );
    default:
      return false;
  }
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private subs = new Map<string, Set<Handler>>();
  private pending: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private backoff = 1000;
  private closed = false;
  private readonly opts: RealtimeClientOptions;

  constructor(opts: RealtimeClientOptions) {
    this.opts = opts;
  }

  connect() {
    if (this.closed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    const token = this.opts.getToken() ?? "";
    const url = `${this.opts.wsUrl}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.backoff = 1000;
      for (const msg of this.pending) ws.send(msg);
      this.pending = [];
      for (const key of this.subs.keys()) {
        const [scope, id] = this.splitKey(key);
        if (scope && id) this.sendSubscribe(scope, id, ws);
      }
    };
    ws.onmessage = (m) => {
      let event: unknown;
      try {
        event = JSON.parse(m.data as string);
      } catch {
        return;
      }
      if (typeof event !== "object" || event === null || !("type" in event)) return;
      const e = event as RealtimeEvent;
      for (const [key, handlers] of this.subs) {
        const [scope, id] = this.splitKey(key);
        if (!scope || !id || !matchesEvent(scope, id, e)) continue;
        for (const h of handlers) h(e);
      }
    };
    ws.onclose = () => {
      this.ws = null;
      if (!this.closed) this.scheduleReconnect();
    };
    ws.onerror = () => {
      // onclose follows
    };
  }

  subscribe(scope: Scope, id: string, handler: Handler): () => void {
    const key = `${scope}:${id}`;
    let set = this.subs.get(key);
    if (!set) {
      set = new Set();
      this.subs.set(key, set);
      this.sendSubscribe(scope, id);
    }
    set.add(handler);
    return () => {
      const s = this.subs.get(key);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) {
        this.subs.delete(key);
        this.send({ type: "unsubscribe", data: { scope, id } });
      }
    };
  }

  close() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.ws?.close();
    this.ws = null;
    this.subs.clear();
    this.pending = [];
  }

  private sendSubscribe(scope: Scope, id: string, ws?: WebSocket) {
    this.send({ type: "subscribe", data: { scope, id } }, ws);
  }

  private send(msg: unknown, ws?: WebSocket) {
    const socket = ws ?? this.ws;
    const text = JSON.stringify(msg);
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(text);
    else this.pending.push(text);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.closed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.backoff = Math.min(this.backoff * 2, 30_000);
      this.connect();
    }, this.backoff);
  }

  private splitKey(key: string): [Scope, string] | [null, null] {
    const idx = key.indexOf(":");
    if (idx < 0) return [null, null];
    return [key.slice(0, idx) as Scope, key.slice(idx + 1)];
  }
}
