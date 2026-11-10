import { create } from 'zustand';
import type {
  Action,
  Connection,
  Dashboard,
  Device,
  LogEntry,
  Message,
  PhoneScreen,
  Session,
  SettingsState,
  Theme,
  Toast,
  ToolStatus,
  ViewId,
} from './types';
import { createSeed } from './data';

type PhoneTab = 'chat' | 'activity' | 'settings';

function viewToPhone(v: ViewId): { tab: PhoneTab; screen: PhoneScreen; mode: 'root' | 'push' } {
  switch (v) {
    case 'chat':
      return { tab: 'chat', screen: { kind: 'chat' }, mode: 'root' };
    case 'sessions':
      return { tab: 'chat', screen: { kind: 'sessions' }, mode: 'push' };
    case 'activity':
      return { tab: 'activity', screen: { kind: 'activity' }, mode: 'root' };
    case 'connections':
      return { tab: 'settings', screen: { kind: 'connections' }, mode: 'push' };
    case 'settings':
      return { tab: 'settings', screen: { kind: 'settings' }, mode: 'root' };
    default:
      return { tab: 'chat', screen: { kind: 'chat' }, mode: 'root' };
  }
}

export interface StoreState {
  // appearance
  theme: Theme;
  setTheme: (t: Theme) => void;

  // navigation
  view: ViewId;
  dashboardId: string | null;
  setView: (v: ViewId) => void;
  openDashboard: (id: string) => void;
  activeSessionId: string | null;
  setActiveSession: (id: string) => void;

  // device + phone navigation
  device: Device;
  setDevice: (d: Device) => void;
  phoneTab: PhoneTab;
  phoneStack: PhoneScreen[];
  setPhoneTab: (tab: PhoneTab) => void;
  pushPhone: (screen: PhoneScreen) => void;
  popPhone: () => void;
  lockScreenOpen: boolean;
  setLockScreenOpen: (b: boolean) => void;

  // right panel + command bar + destructive sheet
  panelMode: 'approvals' | 'dashboard';
  panelOpen: boolean;
  setPanelMode: (m: 'approvals' | 'dashboard') => void;
  togglePanel: () => void;
  expandedActionId: string | null;
  setExpandedActionId: (id: string | null) => void;
  commandOpen: boolean;
  setCommandOpen: (b: boolean) => void;
  confirmSheet: string | null; // action id awaiting destructive confirm
  setConfirmSheet: (id: string | null) => void;

  // data
  connections: Connection[];
  sessions: Session[];
  messages: Record<string, Message[]>;
  actions: Action[];
  toolStatus: ToolStatus | null;
  logs: LogEntry[];
  dashboards: Record<string, Dashboard>;
  settings: SettingsState;
  toasts: Toast[];

  // primitive mutators (agent + components call these)
  addMessage: (m: Message) => void;
  patchMessage: (id: string, patch: Partial<Message>) => void;
  setTool: (t: ToolStatus) => void;
  patchTool: (patch: Partial<ToolStatus>) => void;
  clearTool: () => void;
  upsertAction: (a: Action) => void;
  patchAction: (id: string, patch: Partial<Action>) => void;
  addLog: (l: LogEntry) => void;
  patchLog: (id: string, patch: Partial<LogEntry>) => void;
  upsertDashboard: (d: Dashboard) => void;
  patchDashboard: (id: string, patch: Partial<Dashboard>) => void;
  removeDashboard: (id: string) => void;
  setConnection: (id: string, patch: Partial<Connection>) => void;
  pushToast: (t: Toast) => void;
  dismissToast: (id: string) => void;
  createSession: () => string;
  patchSession: (id: string, patch: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  setSettings: (patch: Partial<SettingsState>) => void;
  resetDemo: () => void;
}

const seed = createSeed();

export const useStore = create<StoreState>()((set, get) => ({
  theme: 'light',
  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.dataset.theme = t;
  },

  view: 'chat',
  dashboardId: null,
  setView: (v) =>
    set((s) => {
      if (s.device === 'phone') {
        const { tab, screen, mode } = viewToPhone(v);
        if (mode === 'root') return { view: v, phoneTab: tab, phoneStack: [screen] };
        return { view: v, phoneStack: [...s.phoneStack, screen] };
      }
      return { view: v };
    }),
  openDashboard: (id) =>
    set((s) => {
      if (s.device === 'phone') {
        return { dashboardId: id, phoneStack: [...s.phoneStack, { kind: 'dashboard', id }] };
      }
      return { view: 'dashboard', dashboardId: id };
    }),
  activeSessionId: seed.activeSessionId,
  setActiveSession: (id) =>
    set((s) => {
      if (s.device === 'phone') {
        return {
          activeSessionId: id,
          expandedActionId: null,
          phoneTab: 'chat',
          phoneStack: [{ kind: 'chat' }],
        };
      }
      return { activeSessionId: id, view: 'chat', expandedActionId: null };
    }),

  device: 'desktop',
  setDevice: (d) =>
    set({
      device: d,
      view: 'chat',
      dashboardId: null,
      phoneTab: 'chat',
      phoneStack: [{ kind: 'chat' }],
      lockScreenOpen: false,
    }),
  phoneTab: 'chat',
  phoneStack: [{ kind: 'chat' }],
  setPhoneTab: (tab) => {
    const screen: PhoneScreen =
      tab === 'chat' ? { kind: 'chat' } : tab === 'activity' ? { kind: 'activity' } : { kind: 'settings' };
    set({ phoneTab: tab, phoneStack: [screen], dashboardId: null });
  },
  pushPhone: (screen) => set((s) => ({ phoneStack: [...s.phoneStack, screen] })),
  popPhone: () =>
    set((s) => (s.phoneStack.length > 1 ? { phoneStack: s.phoneStack.slice(0, -1) } : {})),
  lockScreenOpen: false,
  setLockScreenOpen: (b) => set({ lockScreenOpen: b }),

  panelMode: 'approvals',
  panelOpen: true,
  setPanelMode: (m) => set({ panelMode: m }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  expandedActionId: null,
  setExpandedActionId: (id) => set({ expandedActionId: id }),
  commandOpen: false,
  setCommandOpen: (b) => set({ commandOpen: b }),
  confirmSheet: null,
  setConfirmSheet: (id) => set({ confirmSheet: id }),

  connections: seed.connections,
  sessions: seed.sessions,
  messages: seed.messages,
  actions: [],
  toolStatus: null,
  logs: seed.logs,
  dashboards: seed.dashboards,
  settings: seed.settings,
  toasts: [],

  addMessage: (m) =>
    set((s) => {
      const list = s.messages[m.sessionId] ?? [];
      return { messages: { ...s.messages, [m.sessionId]: [...list, m] } };
    }),
  patchMessage: (id, patch) =>
    set((s) => {
      const out: Record<string, Message[]> = {};
      for (const [sid, list] of Object.entries(s.messages)) {
        const idx = list.findIndex((m) => m.id === id);
        if (idx === -1) {
          out[sid] = list;
        } else {
          const next = list.slice();
          next[idx] = { ...next[idx], ...patch };
          out[sid] = next;
        }
      }
      return { messages: out };
    }),
  setTool: (t) => set({ toolStatus: t }),
  patchTool: (patch) =>
    set((s) => (s.toolStatus ? { toolStatus: { ...s.toolStatus, ...patch } } : {})),
  clearTool: () => set({ toolStatus: null }),

  upsertAction: (a) =>
    set((s) => {
      const idx = s.actions.findIndex((x) => x.id === a.id);
      if (idx === -1) return { actions: [...s.actions, a] };
      const next = s.actions.slice();
      next[idx] = a;
      return { actions: next };
    }),
  patchAction: (id, patch) =>
    set((s) => ({
      actions: s.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  addLog: (l) => set((s) => ({ logs: [l, ...s.logs] })),
  patchLog: (id, patch) =>
    set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

  upsertDashboard: (d) =>
    set((s) => ({ dashboards: { ...s.dashboards, [d.id]: d } })),
  patchDashboard: (id, patch) =>
    set((s) => {
      const cur = s.dashboards[id];
      if (!cur) return {};
      return { dashboards: { ...s.dashboards, [id]: { ...cur, ...patch } } };
    }),
  removeDashboard: (id) =>
    set((s) => {
      const next = { ...s.dashboards };
      delete next[id];
      return { dashboards: next };
    }),

  setConnection: (id, patch) =>
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    })),

  pushToast: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  createSession: () => {
    const id = `sess_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    const session: Session = {
      id,
      title: 'New session',
      snippet: '',
      ts: Date.now(),
      hasPending: false,
      lastFailed: false,
    };
    set((s) => ({
      sessions: [session, ...s.sessions],
      messages: { ...s.messages, [id]: [] },
      activeSessionId: id,
      expandedActionId: null,
      ...(s.device === 'phone'
        ? { phoneStack: [{ kind: 'chat' }], phoneTab: 'chat' as PhoneTab }
        : { view: 'chat' as ViewId }),
    }));
    return id;
  },

  patchSession: (id, patch) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === id ? { ...sess, ...patch } : sess,
      ),
    })),

  deleteSession: (id) =>
    set((s) => {
      const sessions = s.sessions.filter((x) => x.id !== id);
      const messages = { ...s.messages };
      delete messages[id];
      const actions = s.actions.filter((a) => a.sessionId !== id);
      const logs = s.logs.filter((l) => l.sessionId !== id);
      const activeSessionId =
        s.activeSessionId === id ? (sessions[0]?.id ?? null) : s.activeSessionId;
      return { sessions, messages, actions, logs, activeSessionId, view: 'chat' };
    }),

  setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  resetDemo: () => {
    const fresh = createSeed();
    set({
      connections: fresh.connections,
      sessions: fresh.sessions,
      messages: fresh.messages,
      actions: [],
      toolStatus: null,
      logs: fresh.logs,
      dashboards: fresh.dashboards,
      settings: fresh.settings,
      activeSessionId: fresh.activeSessionId,
      view: 'chat',
      dashboardId: null,
      phoneStack: [{ kind: 'chat' }],
      phoneTab: 'chat',
      lockScreenOpen: false,
      panelMode: 'approvals',
      expandedActionId: null,
      confirmSheet: null,
      commandOpen: false,
      toasts: [],
    });
  },
}));
