// Domain model — mirrors docs/00-overview.md mental model:
// Session · Message · Action · Dashboard. Nothing else exists.

export type Theme = 'light' | 'dark';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'expired'
  | 'error';

export interface Connection {
  id: string;
  name: string;
  glyph: string; // icon key (see lib/icons)
  scopes: string[]; // human-readable granted scopes
  state: ConnectionState;
  cause?: string;
}

export type ActionType =
  | 'email'
  | 'calendar'
  | 'slack'
  | 'sms'
  | 'dashboard'
  | 'file';

export type ActionState =
  | 'proposed'
  | 'pending'
  | 'editing'
  | 'approving'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'failed'
  | 'done'
  | 'undone';

export interface PreviewRow {
  label: string;
  value: string;
}

export interface Action {
  id: string;
  sessionId: string;
  type: ActionType;
  glyph: string; // icon key
  title: string; // imperative verb + object: "Send email", "Create event"
  preview: PreviewRow[];
  consequence: string;
  reversible: boolean;
  destructive: boolean;
  state: ActionState;
  resultLine?: string; // past tense: "Sent to Anna"
  cause?: string; // failure cause
  seq: number; // stream ordering
  createdAt: number;
  approvedAt?: number;
  undoUntil?: number; // timestamp until which Undo is offered
  approvingLong?: boolean; // 10s reassurance line shown
}

export type MessageRole = 'user' | 'agent' | 'system';

export type MessageKind = 'text' | 'dashboard-card' | 'error';

export type MessageStatus = 'sending' | 'sent' | 'failed' | 'streaming';

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  kind: MessageKind;
  text?: string;
  status: MessageStatus;
  dashboardId?: string;
  dashboardName?: string;
  dashboardMeta?: string;
  retry?: boolean; // shows a Retry ghost (failed tool)
  seq: number;
  createdAt: number;
}

export type ToolState = 'queued' | 'running' | 'done' | 'failed' | 'blocked';

export interface ToolStatus {
  id: string;
  sessionId: string;
  label: string; // present progressive, ≤3 words + …
  step: number;
  total: number;
  state: ToolState;
  cause?: string;
  elapsed?: number; // seconds
  startedAt: number;
  seq: number;
}

export type LogState = 'running' | 'done' | 'failed' | 'blocked' | 'rejected';

export interface LogEntry {
  id: string;
  sessionId: string;
  ts: number;
  title: string; // verb + object
  tool: string; // email / calendar / slack / sms / dashboard
  result: string;
  state: LogState;
  actionId?: string;
}

export interface DashboardKPI {
  label: string;
  value: string;
  delta: string;
  direction: 'up' | 'down' | 'flat';
}

export interface DashboardChartItem {
  label: string;
  value: string;
  pct?: string;
  delta?: string;
}

export interface DashboardChart {
  title: string;
  items: DashboardChartItem[];
}

export type DashboardState = 'ready' | 'building' | 'failed' | 'refreshing';

export interface Dashboard {
  id: string;
  name: string;
  period: string;
  source: string;
  itemCount: number;
  updatedLabel: string;
  updatedTs: number;
  stale: boolean;
  state: DashboardState;
  kpis: DashboardKPI[];
  charts: DashboardChart[];
}

export type ViewId =
  | 'chat'
  | 'activity'
  | 'connections'
  | 'sessions'
  | 'settings'
  | 'dashboard';

export interface Session {
  id: string;
  title: string;
  snippet: string;
  ts: number;
  hasPending: boolean;
  lastFailed: boolean;
}

export interface SettingsState {
  model: 'Balanced' | 'Fast' | 'Thorough';
  approvalRule: 'always' | 'sending' | 'readonly';
  notifications: {
    taskFinished: boolean;
    approvalNeeded: boolean;
    failures: boolean;
  };
  retentionDays: 30 | 90 | 180;
}

export interface Toast {
  id: string;
  text: string;
  undo?: boolean;
  actionId?: string;
  dashboardId?: string;
}

export type Device = 'desktop' | 'phone';

export type PhoneScreen =
  | { kind: 'chat' }
  | { kind: 'sessions' }
  | { kind: 'activity' }
  | { kind: 'connections' }
  | { kind: 'settings' }
  | { kind: 'dashboard'; id: string };
