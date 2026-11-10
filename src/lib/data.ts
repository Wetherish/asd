import type {
  Connection,
  Dashboard,
  LogEntry,
  Message,
  Session,
  SettingsState,
} from './types';
import { nextSeq } from './util';

export interface Seed {
  connections: Connection[];
  sessions: Session[];
  messages: Record<string, Message[]>;
  logs: LogEntry[];
  dashboards: Record<string, Dashboard>;
  settings: SettingsState;
  activeSessionId: string;
}

export function createSeed(): Seed {
  const now = Date.now();
  const min = 60 * 1000;
  const hr = 60 * min;

  const connections: Connection[] = [
    {
      id: 'calendar',
      name: 'Calendar',
      glyph: 'calendar',
      scopes: ['Read your events', 'Create and edit events', 'See attendees'],
      state: 'connected',
    },
    {
      id: 'email',
      name: 'Email',
      glyph: 'email',
      scopes: ['Read your inbox', 'Send email as you'],
      state: 'connected',
    },
    {
      id: 'slack',
      name: 'Slack',
      glyph: 'slack',
      scopes: ['Read channels', 'Post as you'],
      state: 'expired',
      cause: 'Access expired',
    },
    {
      id: 'sms',
      name: 'SMS',
      glyph: 'sms',
      scopes: ['Send messages'],
      state: 'disconnected',
    },
  ];

  const weeklyId = 'sess-weekly';
  const lunchId = 'sess-lunch';
  const standupId = 'sess-standup';

  const sessions: Session[] = [
    {
      id: weeklyId,
      title: 'Weekly spending',
      snippet: 'Your week is up 12% on dining.',
      ts: now - 2 * min,
      hasPending: false,
      lastFailed: false,
    },
    {
      id: lunchId,
      title: 'Lunch with Anna',
      snippet: 'Schedule lunch Friday at 1pm',
      ts: now - 8 * hr,
      hasPending: false,
      lastFailed: false,
    },
    {
      id: standupId,
      title: 'Standup notes',
      snippet: 'Summarise the standup thread',
      ts: now - 26 * hr,
      hasPending: false,
      lastFailed: true,
    },
  ];

  const messages: Record<string, Message[]> = {
    [weeklyId]: [
      {
        id: 'msg-w1',
        sessionId: weeklyId,
        role: 'user',
        kind: 'text',
        text: 'Create a dashboard of my weekly spending',
        status: 'sent',
        seq: nextSeq(),
        createdAt: now - 3 * min,
      },
      {
        id: 'msg-w2',
        sessionId: weeklyId,
        role: 'agent',
        kind: 'text',
        text: 'Your week is up 12% on dining. Groceries are steady and transport is down 4%.',
        status: 'sent',
        seq: nextSeq(),
        createdAt: now - 2.5 * min,
      },
      {
        id: 'msg-w3',
        sessionId: weeklyId,
        role: 'agent',
        kind: 'dashboard-card',
        dashboardId: 'dash-weekly',
        dashboardName: 'Spending',
        dashboardMeta: '7 days · 12 items',
        status: 'sent',
        seq: nextSeq(),
        createdAt: now - 2 * min,
      },
    ],
    [lunchId]: [
      {
        id: 'msg-l1',
        sessionId: lunchId,
        role: 'user',
        kind: 'text',
        text: 'Schedule lunch Friday at 1pm',
        status: 'sent',
        seq: nextSeq(),
        createdAt: now - 8 * hr,
      },
    ],
    [standupId]: [
      {
        id: 'msg-s1',
        sessionId: standupId,
        role: 'user',
        kind: 'text',
        text: 'Summarise the standup thread',
        status: 'sent',
        seq: nextSeq(),
        createdAt: now - 26 * hr,
      },
    ],
  };

  const logs: LogEntry[] = [
    {
      id: 'log-1',
      sessionId: weeklyId,
      ts: now - 2 * min,
      title: 'Created dashboard',
      tool: 'dashboard',
      result: 'Spending · 12 items',
      state: 'done',
    },
    {
      id: 'log-2',
      sessionId: weeklyId,
      ts: now - 2.2 * min,
      title: 'Read email',
      tool: 'email',
      result: '38 receipts',
      state: 'done',
    },
    {
      id: 'log-3',
      sessionId: lunchId,
      ts: now - 8 * hr,
      title: 'Read calendar',
      tool: 'calendar',
      result: '14 events',
      state: 'done',
    },
    {
      id: 'log-4',
      sessionId: standupId,
      ts: now - 26 * hr,
      title: 'Posted to #general',
      tool: 'slack',
      result: 'Slack rejected the message',
      state: 'failed',
    },
  ];

  const dashboards: Record<string, Dashboard> = {
    'dash-weekly': {
      id: 'dash-weekly',
      name: 'Weekly spending',
      period: '1–7 Nov',
      source: '38 receipts',
      itemCount: 12,
      updatedLabel: 'Updated 2m ago',
      updatedTs: now - 2 * min,
      stale: false,
      state: 'ready',
      kpis: [
        { label: 'Total spend', value: '€412', delta: '+12%', direction: 'up' },
        { label: 'Per day', value: '€58', delta: '—', direction: 'flat' },
        { label: 'Receipts', value: '38', delta: '+4', direction: 'up' },
      ],
      charts: [
        {
          title: 'By category',
          items: [
            { label: 'Dining', value: '€128', pct: '31%', delta: '+12%' },
            { label: 'Groceries', value: '€96', pct: '23%', delta: 'flat' },
            { label: 'Transport', value: '€64', pct: '16%', delta: '−4%' },
            { label: 'Other', value: '€124', pct: '30%', delta: '+2%' },
          ],
        },
        {
          title: 'Daily spend',
          items: [
            { label: 'Mon', value: '€52' },
            { label: 'Tue', value: '€38' },
            { label: 'Wed', value: '€71' },
            { label: 'Thu', value: '€44' },
            { label: 'Fri', value: '€89' },
            { label: 'Sat', value: '€118' },
          ],
        },
      ],
    },
    'dash-week': {
      id: 'dash-week',
      name: 'Week ahead',
      period: '8–14 Nov',
      source: 'Calendar',
      itemCount: 14,
      updatedLabel: 'Updated just now',
      updatedTs: now,
      stale: false,
      state: 'ready',
      kpis: [
        { label: 'Events', value: '14', delta: '+2', direction: 'up' },
        { label: 'Free slots', value: '6', delta: '—', direction: 'flat' },
        { label: 'Busiest day', value: 'Thu', delta: '—', direction: 'flat' },
      ],
      charts: [
        {
          title: 'Upcoming',
          items: [
            { label: 'Standup', value: 'Mon–Fri · 10:00' },
            { label: '1:1 with Maya', value: 'Wed · 14:00' },
            { label: 'Lunch with Anna', value: 'Fri · 13:30' },
          ],
        },
      ],
    },
  };

  const settings: SettingsState = {
    model: 'Balanced',
    approvalRule: 'sending',
    notifications: {
      taskFinished: true,
      approvalNeeded: true,
      failures: true,
    },
    retentionDays: 90,
  };

  return {
    connections,
    sessions,
    messages,
    logs,
    dashboards,
    settings,
    activeSessionId: weeklyId,
  };
}
