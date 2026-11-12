import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import { WebSocket } from 'ws';
import { RealtimeService } from './realtime.service';

type ClientMessage = { type: string; data?: { scope?: string; id?: string } };

@WebSocketGateway({ path: '/ws' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtime: RealtimeService,
    private readonly jwt: JwtService,
  ) {}

  handleConnection(socket: WebSocket, request: IncomingMessage): void {
    let userId: string;
    try {
      const payload = this.jwt.verify<{ sub?: string }>(this.extractToken(request.url));
      if (!payload.sub) throw new Error('missing sub');
      userId = payload.sub;
    } catch {
      socket.close(1008, 'Unauthorized');
      return;
    }

    this.realtime.register(socket, userId);
    socket.on('message', (raw) => this.onMessage(socket, raw.toString()));
  }

  handleDisconnect(socket: WebSocket): void {
    this.realtime.unregister(socket);
  }

  private onMessage(socket: WebSocket, text: string): void {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(text) as ClientMessage;
    } catch {
      return;
    }
    const { type, data } = msg;
    switch (type) {
      case 'subscribe':
        if (data?.scope && data.id) void this.realtime.subscribe(socket, data.scope as never, data.id);
        break;
      case 'unsubscribe':
        if (data?.scope && data.id) this.realtime.unsubscribe(socket, data.scope as never, data.id);
        break;
      case 'ping':
        socket.send(JSON.stringify({ type: 'pong', data: null, ts: new Date().toISOString() }));
        break;
      default:
        this.logger.debug(`unknown ws message type: ${type}`);
    }
  }

  private extractToken(url: string | undefined): string {
    const query = (url ?? '').split('?')[1] ?? '';
    const token = new URLSearchParams(query).get('token');
    if (!token) throw new Error('missing token');
    return token;
  }
}
