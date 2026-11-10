import { useStore } from './store';
import type { Action, PreviewRow } from './types';
import { nextSeq, sleep, uid } from './util';

/*
 * Simulated agent engine.
 * Drives tool-status steps, streaming replies, approval lifecycles, undo,
 * retry, and destructive confirms. All timing and orchestration live here;
 * the store is pure state + primitive mutators.
 */

const st = () => useStore.getState();

let tickerStarted = false;
function ensureTicker() {
  if (tickerStarted) return;
  tickerStarted = true;
  setInterval(() => {
    const { toolStatus } = useStore.getState();
    if (!toolStatus) return;
    if (toolStatus.state === 'running' || toolStatus.state === 'blocked') {
      const sec = Math.floor((Date.now() - toolStatus.startedAt) / 1000);
      if (sec >= 10) useStore.getState().patchTool({ elapsed: sec });
    }
  }, 1000);
}

// Pending retry continuations (chat "Retry" ghost).
const pendingRetry = new Map<string, () => void>();

function step(
  sessionId: string,
  label: string,
  stepNo: number,
  total: number,
  duration = 1100,
) {
  st().setTool({
    id: uid('t'),
    sessionId,
    label,
    step: stepNo,
    total,
    state: 'running',
    startedAt: Date.now(),
    seq: nextSeq(),
  });
  return sleep(duration);
}

function doneChip(sessionId: string, stepNo: number, total: number) {
  st().setTool({
    id: uid('t'),
    sessionId,
    label: 'Done',
    step: stepNo,
    total,
    state: 'done',
    startedAt: Date.now(),
    seq: nextSeq(),
  });
  return sleep(1200);
}

async function streamAgentText(sessionId: string, text: string) {
  const id = uid('m');
  st().addMessage({
    id,
    sessionId,
    role: 'agent',
    kind: 'text',
    text: '',
    status: 'streaming',
    seq: nextSeq(),
    createdAt: Date.now(),
  });
  const words = text.split(' ');
  let acc = '';
  for (let i = 0; i < words.length; i += 3) {
    acc += words.slice(i, i + 3).join(' ') + ' ';
    st().patchMessage(id, { text: acc.trim() });
    await sleep(70);
  }
  st().patchMessage(id, { text, status: 'sent' });
}

function addError(sessionId: string, text: string) {
  st().addMessage({
    id: uid('m'),
    sessionId,
    role: 'agent',
    kind: 'error',
    text,
    status: 'sent',
    retry: true,
    seq: nextSeq(),
    createdAt: Date.now(),
  });
}

function addDashboardCard(
  sessionId: string,
  dashboardId: string,
  name: string,
  meta: string,
) {
  st().addMessage({
    id: uid('m'),
    sessionId,
    role: 'agent',
    kind: 'dashboard-card',
    dashboardId,
    dashboardName: name,
    dashboardMeta: meta,
    status: 'sent',
    seq: nextSeq(),
    createdAt: Date.now(),
  });
}

function stillHasPending(sessionId: string, excludeId: string) {
  return st().actions.some(
    (a) =>
      a.sessionId === sessionId &&
      a.id !== excludeId &&
      (a.state === 'pending' || a.state === 'editing'),
  );
}

// ---------- Result mapping ----------

interface ResultInfo {
  resultLine: string;
  logTitle: string;
  logResult: string;
  tool: string;
}

function resultFor(a: Action): ResultInfo {
  switch (a.type) {
    case 'email':
      return {
        resultLine: 'Sent to Anna',
        logTitle: 'Sent email to Anna',
        logResult: 'Delivered to anna@example.com',
        tool: 'email',
      };
    case 'sms':
      return {
        resultLine: 'Message sent',
        logTitle: 'Sent message',
        logResult: 'To +48 601 234 567',
        tool: 'sms',
      };
    case 'slack':
      return {
        resultLine: 'Posted to #general',
        logTitle: 'Posted to #general',
        logResult: 'Posted',
        tool: 'slack',
      };
    case 'calendar':
      return a.destructive
        ? {
            resultLine: 'Deleted Standup',
            logTitle: 'Deleted event',
            logResult: 'Standup · 5 people notified',
            tool: 'calendar',
          }
        : {
            resultLine: 'Invites sent to Anna',
            logTitle: 'Created event',
            logResult: 'Lunch with Anna · 2 guests',
            tool: 'calendar',
          };
    default:
      return {
        resultLine: 'Done',
        logTitle: a.title,
        logResult: 'Done',
        tool: 'dashboard',
      };
  }
}

function updateLogForApprove(a: Action) {
  const info = resultFor(a);
  const log = st().logs.find((l) => l.actionId === a.id);
  if (log) {
    st().patchLog(log.id, {
      state: 'done',
      title: info.logTitle,
      result: info.logResult,
      tool: info.tool,
    });
  }
}

function updateLogForReject(a: Action) {
  const log = st().logs.find((l) => l.actionId === a.id);
  if (log) {
    st().patchLog(log.id, {
      state: 'rejected',
      title: `Rejected ${a.type === 'email' ? 'email to Anna' : a.title.toLowerCase()}`,
      result: 'You rejected this',
    });
  }
}

// ---------- Flows ----------

async function readCalendarFlow(sessionId: string) {
  ensureTicker();
  const logId = uid('l');
  st().addLog({
    id: logId,
    sessionId,
    ts: Date.now(),
    title: 'Read calendar',
    tool: 'calendar',
    result: '',
    state: 'running',
  });
  await step(sessionId, 'Reading calendar…', 1, 2);
  await step(sessionId, 'Counting events…', 2, 2);
  await doneChip(sessionId, 2, 2);
  st().patchLog(logId, { state: 'done', result: '14 events' });
  st().clearTool();
  await streamAgentText(
    sessionId,
    'You have 14 events this week. Friday 1pm is taken, but Thursday afternoon is open.',
  );
  const dashId = 'dash-week';
  const cur = st().dashboards[dashId];
  st().upsertDashboard({
    ...cur,
    id: dashId,
    state: 'ready',
    updatedTs: Date.now(),
    updatedLabel: 'Updated just now',
    stale: false,
  });
  addDashboardCard(sessionId, dashId, 'Week ahead', '7 days · 14 items');
  st().addLog({
    id: uid('l'),
    sessionId,
    ts: Date.now(),
    title: 'Created dashboard',
    tool: 'dashboard',
    result: 'Week ahead · 14 items',
    state: 'done',
  });
  st().patchSession(sessionId, {
    snippet: 'You have 14 events this week.',
    ts: Date.now(),
  });
}

async function dashboardFlow(sessionId: string) {
  ensureTicker();
  const logId = uid('l');
  st().addLog({
    id: logId,
    sessionId,
    ts: Date.now(),
    title: 'Read email',
    tool: 'email',
    result: '',
    state: 'running',
  });
  await step(sessionId, 'Reading receipts…', 1, 4, 900);
  // First attempt fails — demonstrates the error + Retry pattern (Flow B).
  st().setTool({
    id: uid('t'),
    sessionId,
    label: "Couldn't read your inbox.",
    step: 1,
    total: 4,
    state: 'failed',
    cause: 'Access expired',
    startedAt: Date.now(),
    seq: nextSeq(),
  });
  st().patchLog(logId, { state: 'failed', result: "Couldn't read your inbox" });
  addError(sessionId, 'Nothing was changed. Retry to continue.');
  pendingRetry.set(sessionId, () => void dashboardSuccess(sessionId));
}

async function dashboardSuccess(sessionId: string) {
  const logId = uid('l');
  st().addLog({
    id: logId,
    sessionId,
    ts: Date.now(),
    title: 'Read email',
    tool: 'email',
    result: '',
    state: 'running',
  });
  await step(sessionId, 'Reading messages…', 1, 4);
  await step(sessionId, 'Grouping spend…', 2, 4);
  await step(sessionId, 'Building dashboard…', 3, 4);
  await doneChip(sessionId, 4, 4);
  st().patchLog(logId, { state: 'done', result: '38 receipts' });
  st().clearTool();
  await streamAgentText(
    sessionId,
    'Your week is up 12% on dining. Groceries are steady and transport is down 4%.',
  );
  const dashId = 'dash-weekly';
  const cur = st().dashboards[dashId];
  st().upsertDashboard({
    ...cur,
    id: dashId,
    state: 'ready',
    updatedTs: Date.now(),
    updatedLabel: 'Updated now',
    stale: false,
  });
  addDashboardCard(sessionId, dashId, 'Spending', '7 days · 12 items');
  st().addLog({
    id: uid('l'),
    sessionId,
    ts: Date.now(),
    title: 'Created dashboard',
    tool: 'dashboard',
    result: 'Spending · 12 items',
    state: 'done',
  });
  st().patchSession(sessionId, {
    snippet: 'Your week is up 12% on dining.',
    ts: Date.now(),
  });
}

async function sendEmailFlow(sessionId: string) {
  ensureTicker();
  const actionId = uid('a');
  const logId = uid('l');
  st().addLog({
    id: logId,
    sessionId,
    ts: Date.now(),
    title: 'Draft email',
    tool: 'email',
    result: '',
    state: 'running',
    actionId,
  });
  await step(sessionId, 'Drafting message…', 1, 2, 900);
  st().upsertAction({
    id: actionId,
    sessionId,
    type: 'email',
    glyph: 'email',
    title: 'Send email',
    preview: [
      { label: 'To', value: 'anna@example.com' },
      { label: 'Subject', value: 'Running late' },
      {
        label: 'Body',
        value: 'Hey Anna, running about 15 minutes behind. Start without me.',
      },
    ],
    consequence: "Sends immediately. Can't be recalled.",
    reversible: false,
    destructive: false,
    state: 'proposed',
    seq: nextSeq(),
    createdAt: Date.now(),
  });
  st().patchLog(logId, { state: 'blocked', result: 'Send email to Anna' });
  st().setTool({
    id: uid('t'),
    sessionId,
    label: 'Waiting for you',
    step: 2,
    total: 2,
    state: 'blocked',
    startedAt: Date.now(),
    seq: nextSeq(),
  });
  await sleep(700);
  st().patchAction(actionId, { state: 'pending' });
  await sleep(1200);
  st().clearTool();
  st().patchSession(sessionId, {
    hasPending: true,
    snippet: 'Send email to Anna — Running late',
    ts: Date.now(),
  });
  st().setPanelMode('approvals');
  st().setExpandedActionId(actionId);
}

async function scheduleFlow(sessionId: string) {
  ensureTicker();
  const logId = uid('l');
  st().addLog({
    id: logId,
    sessionId,
    ts: Date.now(),
    title: 'Read calendar',
    tool: 'calendar',
    result: '',
    state: 'running',
  });
  await step(sessionId, 'Checking calendar…', 1, 3);
  await step(sessionId, 'Checking conflicts…', 2, 3, 900);
  st().patchLog(logId, { state: 'done', result: '14 events' });
  await step(sessionId, 'Finding a time…', 3, 3, 800);
  st().clearTool();
  await streamAgentText(
    sessionId,
    'Friday 1pm is taken — Standup runs 1:00–1:30 pm. Nothing was booked. I found 1:30–2:30 pm free.',
  );
  const actionId = uid('a');
  st().upsertAction({
    id: actionId,
    sessionId,
    type: 'calendar',
    glyph: 'calendar',
    title: 'Create event',
    preview: [
      { label: 'Title', value: 'Lunch with Anna' },
      { label: 'When', value: 'Fri 14 Nov, 1:30–2:30 pm' },
      { label: 'Where', value: 'Café Nero, Kings Cross' },
      { label: 'Guests', value: 'Anna Nowak, +1' },
    ],
    consequence: "Sends invites to 2 people. Can't be undone.",
    reversible: false,
    destructive: false,
    state: 'proposed',
    seq: nextSeq(),
    createdAt: Date.now(),
  });
  st().addLog({
    id: uid('l'),
    sessionId,
    ts: Date.now(),
    title: 'Create event',
    tool: 'calendar',
    result: 'Waiting for approval',
    state: 'blocked',
    actionId,
  });
  await sleep(700);
  st().patchAction(actionId, { state: 'pending' });
  st().patchSession(sessionId, {
    hasPending: true,
    snippet: 'Create event — Lunch with Anna',
    ts: Date.now(),
  });
  st().setPanelMode('approvals');
  st().setExpandedActionId(actionId);
}

async function destructiveFlow(sessionId: string) {
  ensureTicker();
  await step(sessionId, 'Finding the event…', 1, 2, 900);
  const actionId = uid('a');
  st().upsertAction({
    id: actionId,
    sessionId,
    type: 'calendar',
    glyph: 'x-octagon',
    title: 'Delete event',
    preview: [
      { label: 'Title', value: 'Standup' },
      { label: 'When', value: 'Fri 14 Nov, 10:00' },
      { label: 'Guests', value: '4 others' },
    ],
    consequence: "Sends cancellations to 5 people. Can't be undone.",
    reversible: false,
    destructive: true,
    state: 'proposed',
    seq: nextSeq(),
    createdAt: Date.now(),
  });
  st().addLog({
    id: uid('l'),
    sessionId,
    ts: Date.now(),
    title: 'Delete event',
    tool: 'calendar',
    result: 'Waiting for approval',
    state: 'blocked',
    actionId,
  });
  await sleep(700);
  st().patchAction(actionId, { state: 'pending' });
  st().clearTool();
  st().patchSession(sessionId, {
    hasPending: true,
    snippet: 'Delete event — Standup',
    ts: Date.now(),
  });
  st().setPanelMode('approvals');
  st().setExpandedActionId(actionId);
}

async function genericFlow(sessionId: string) {
  ensureTicker();
  await step(sessionId, 'Checking calendar…', 1, 2, 900);
  await step(sessionId, 'Reviewing your week…', 2, 2, 900);
  await doneChip(sessionId, 2, 2);
  st().clearTool();
  await streamAgentText(
    sessionId,
    "I can check your calendar, draft messages, or build a dashboard. Try a quick action above.",
  );
  st().patchSession(sessionId, { snippet: 'A new request', ts: Date.now() });
}

// ---------- Public API ----------

export function sendMessage(text: string) {
  const s = st();
  let sessionId = s.activeSessionId;
  if (!sessionId) sessionId = s.createSession();
  const session = s.sessions.find((x) => x.id === sessionId);
  if (session && session.title === 'New session') {
    s.patchSession(sessionId, {
      title: text.slice(0, 40).replace(/[.…]$/, ''),
      snippet: text,
    });
  }
  s.addMessage({
    id: uid('m'),
    sessionId,
    role: 'user',
    kind: 'text',
    text,
    status: 'sent',
    seq: nextSeq(),
    createdAt: Date.now(),
  });
  s.patchSession(sessionId, { ts: Date.now() });

  const t = text.toLowerCase();
  let flow: (sid: string) => Promise<void>;
  if (/delete/.test(t) && /(standup|event|meeting|invite)/.test(t)) flow = destructiveFlow;
  else if (/schedule|lunch|event|meeting|new event/.test(t)) flow = scheduleFlow;
  else if (/message|email|anna|text |sms|slack|send/.test(t)) flow = sendEmailFlow;
  else if (/dashboard|spending|report|chart|receipts/.test(t)) flow = dashboardFlow;
  else if (/summari|calendar|check|week|standup/.test(t)) flow = readCalendarFlow;
  else flow = genericFlow;
  void flow(sessionId);
}

export function retryLastFailed(sessionId: string) {
  const cont = pendingRetry.get(sessionId);
  if (!cont) return;
  pendingRetry.delete(sessionId);
  const msgs = st().messages[sessionId] ?? [];
  const err = [...msgs].reverse().find((m) => m.retry);
  if (err) st().patchMessage(err.id, { retry: false, text: 'Retrying…' });
  void cont();
}

async function doApprove(id: string) {
  const a = st().actions.find((x) => x.id === id);
  if (!a) return;
  st().patchAction(id, { state: 'approving', approvingLong: false, approvedAt: Date.now() });
  st().clearTool();
  await sleep(1600);
  const cur = st().actions.find((x) => x.id === id);
  if (!cur || cur.state !== 'approving') return;
  const reversible = !!a.reversible;
  const resultLine = resultFor(a).resultLine;
  st().patchAction(id, {
    state: 'approved',
    resultLine,
    undoUntil: reversible ? Date.now() + 10000 : undefined,
  });
  updateLogForApprove(a);
  st().patchSession(a.sessionId, {
    hasPending: stillHasPending(a.sessionId, id),
    ts: Date.now(),
  });
  st().pushToast({
    id: uid('toast'),
    text: resultLine,
    undo: reversible,
    actionId: id,
  });
  if (reversible) {
    setTimeout(() => {
      const c = st().actions.find((x) => x.id === id);
      if (c && c.state === 'approved' && c.undoUntil && Date.now() >= c.undoUntil) {
        st().patchAction(id, { state: 'done', undoUntil: undefined });
      }
    }, 10050);
  }
}

export function approveAction(id: string) {
  const a = st().actions.find((x) => x.id === id);
  if (!a) return;
  if (a.state !== 'pending' && a.state !== 'editing') return;
  if (a.destructive) {
    st().setConfirmSheet(id);
    return;
  }
  void doApprove(id);
}

export function confirmDestructive() {
  const id = st().confirmSheet;
  if (!id) return;
  st().setConfirmSheet(null);
  void doApprove(id);
}

export function cancelDestructive() {
  st().setConfirmSheet(null);
}

export function rejectAction(id: string) {
  const a = st().actions.find((x) => x.id === id);
  if (!a) return;
  if (a.state !== 'pending' && a.state !== 'editing') return;
  st().patchAction(id, { state: 'rejected', undoUntil: undefined });
  st().clearTool();
  updateLogForReject(a);
  st().patchSession(a.sessionId, {
    hasPending: stillHasPending(a.sessionId, id),
    ts: Date.now(),
  });
}

export function editAction(id: string) {
  st().patchAction(id, { state: 'editing' });
}

export function cancelEditAction(id: string) {
  st().patchAction(id, { state: 'pending' });
}

export function approveEditedAction(id: string, preview: PreviewRow[]) {
  st().patchAction(id, { preview, state: 'pending' });
  void doApprove(id);
}

export function askAgainAction(id: string) {
  const a = st().actions.find((x) => x.id === id);
  if (!a) return;
  const newId = uid('a');
  st().upsertAction({
    ...a,
    id: newId,
    state: 'proposed',
    seq: nextSeq(),
    createdAt: Date.now(),
    resultLine: undefined,
    undoUntil: undefined,
    approvedAt: undefined,
  });
  setTimeout(() => {
    const cur = st().actions.find((x) => x.id === newId);
    if (cur && cur.state === 'proposed') {
      st().patchAction(newId, { state: 'pending' });
      st().patchSession(a.sessionId, { hasPending: true, ts: Date.now() });
      st().setPanelMode('approvals');
      st().setExpandedActionId(newId);
    }
  }, 700);
}

export function undoAction(id: string) {
  const a = st().actions.find((x) => x.id === id);
  if (!a || a.state !== 'approved' || !a.undoUntil) return;
  st().patchAction(id, { state: 'undone', undoUntil: undefined, resultLine: undefined });
  const log = st().logs.find((l) => l.actionId === id);
  if (log) st().patchLog(log.id, { result: 'Undone' });
  for (const toast of st().toasts) {
    if (toast.actionId === id) st().dismissToast(toast.id);
  }
}

// ---------- Connections ----------

const DEFAULT_SCOPES: Record<string, string[]> = {
  calendar: ['Read your events', 'Create and edit events', 'See attendees'],
  email: ['Read your inbox', 'Send email as you'],
  slack: ['Read channels', 'Post as you'],
  sms: ['Send messages'],
};

export function connectService(id: string) {
  st().setConnection(id, { state: 'connecting', cause: undefined });
  setTimeout(() => {
    const c = st().connections.find((x) => x.id === id);
    if (c && c.state === 'connecting') {
      st().setConnection(id, {
        state: 'connected',
        scopes: DEFAULT_SCOPES[id] ?? [],
        cause: undefined,
      });
    }
  }, 1200);
}

export function disconnectService(id: string) {
  st().setConnection(id, { state: 'disconnected', scopes: [], cause: undefined });
}

// ---------- Dashboards ----------

export function refreshDashboard(id: string) {
  st().patchDashboard(id, { state: 'refreshing' });
  setTimeout(() => {
    const d = st().dashboards[id];
    if (d && d.state === 'refreshing') {
      st().patchDashboard(id, {
        state: 'ready',
        updatedTs: Date.now(),
        updatedLabel: 'Updated now',
        stale: false,
      });
    }
  }, 900);
}

// Dashboard deletion is reversible for 10s (06 §4.3, 08 §6).
const deletedDashboards = new Map<
  string,
  { dash: import('./types').Dashboard; until: number }
>();

export function deleteDashboard(id: string) {
  const d = st().dashboards[id];
  if (!d) return;
  st().removeDashboard(id);
  deletedDashboards.set(id, { dash: d, until: Date.now() + 10000 });
  st().setView('chat');
  st().pushToast({ id: uid('toast'), text: 'Dashboard deleted', undo: true, dashboardId: id });
  setTimeout(() => {
    deletedDashboards.delete(id);
  }, 10050);
}

export function undoDashboardDelete(id: string) {
  const entry = deletedDashboards.get(id);
  if (!entry) return;
  deletedDashboards.delete(id);
  st().upsertDashboard(entry.dash);
  st().openDashboard(id);
}
