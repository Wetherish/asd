import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';
import { SessionAccessService } from '../common/session-access.service';
import { matchesEvent, RealtimeEvent, Scope } from '../shared/contract';

type SocketState = {
  userId: string;
  // Session ids this user is allowed to see — used to filter session-scoped
  // events (including `global` subscriptions, which would otherwise leak data
  // from sessions the user is not a member of).
  sessions: Set<string>;
  subs: Set<string>;
};

// Holds connected sockets + their scope subscriptions and routes events.
// Connections are authenticated by the gateway before they are registered, and
// session-scoped events are only delivered to sockets whose user is a member.
@Injectable()
export class RealtimeService {
  private sockets = new Map<WebSocket, SocketState>();

  constructor(private readonly access: SessionAccessService) {}

  register(socket: WebSocket, userId: string): void {
    const state: SocketState = { userId, sessions: new Set(), subs: new Set() };
    this.sockets.set(socket, state);
    // Load memberships in the background so session-scoped events can be
    // filtered for `global` subscribers. Fresh checks still gate explicit
    // `session` subscriptions via subscribe().
    void this.access
      .memberSessionIds(userId)
      .then((ids) => {
        for (const id of ids) state.sessions.add(id);
      })
      .catch(() => {});
  }

  unregister(socket: WebSocket): void {
    this.sockets.delete(socket);
  }

  async subscribe(socket: WebSocket, scope: Scope, id: string): Promise<void> {
    const state = this.sockets.get(socket);
    if (!state) return;
    if (scope === 'session') {
      const role = await this.access.role(id, state.userId);
      if (!role) return; // not a member — silently ignore
      state.sessions.add(id);
    }
    state.subs.add(`${scope}:${id}`);
  }

  unsubscribe(socket: WebSocket, scope: Scope, id: string): void {
    this.sockets.get(socket)?.subs.delete(`${scope}:${id}`);
  }

  publish(event: RealtimeEvent): void {
    const sessionId = sessionIdOf(event);
    const text = JSON.stringify(event);
    for (const [socket, state] of this.sockets) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      if (sessionId && !state.sessions.has(sessionId)) continue;
      if (this.matchesAny(state.subs, event)) socket.send(text);
    }
  }

  private matchesAny(subs: Set<string>, event: RealtimeEvent): boolean {
    for (const key of subs) {
      const idx = key.indexOf(':');
      if (idx < 0) continue;
      const scope = key.slice(0, idx) as Scope;
      const id = key.slice(idx + 1);
      if (matchesEvent(scope, id, event)) return true;
    }
    return false;
  }
}

// The session an event belongs to, or undefined for non-session events
// (e.g. job.updated, pong), which remain scoped only by subscription.
function sessionIdOf(e: RealtimeEvent): string | undefined {
  switch (e.type) {
    case 'message.delta':
    case 'message.done':
    case 'message.error':
      return e.data.sessionId;
    case 'approval.created':
    case 'approval.updated':
      return e.data.approval.sessionId;
    case 'session.updated':
      return e.data.session.id;
    case 'presence':
      return e.data.sessionId;
    default:
      return undefined;
  }
}
