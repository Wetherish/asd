import { useStore } from './lib/store';
import { Icon } from './lib/icons';
import { dayLabel, relativeTime } from './lib/util';
import type { Session } from './lib/types';
import './Sidebar.css';

interface Group {
  label: string;
  items: Session[];
}

function groupByDay(sessions: Session[]): Group[] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const label = dayLabel(s.ts);
    const arr = map.get(label) ?? [];
    arr.push(s);
    map.set(label, arr);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}

function NavItem({
  icon,
  label,
  count,
  onClick,
}: {
  icon: string;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button className="nav-item" onClick={onClick}>
      <Icon name={icon} size={16} />
      <span className="nav-label">{label}</span>
      {count ? <span className="nav-count">{count}</span> : null}
    </button>
  );
}

export function Sidebar() {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const connections = useStore((s) => s.connections);
  const actions = useStore((s) => s.actions);
  const logs = useStore((s) => s.logs);
  const setView = useStore((s) => s.setView);
  const setActiveSession = useStore((s) => s.setActiveSession);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const createSession = useStore((s) => s.createSession);

  const connected = connections.some((c) => c.state === 'connected');
  const pendingCount = actions.filter(
    (a) => a.state === 'pending' || a.state === 'editing',
  ).length;
  const failedCount = logs.filter((l) => l.state === 'failed').length;
  const groups = groupByDay(sessions);

  return (
    <nav className="sidebar" aria-label="Navigation">
      <div className="sidebar-header">
        <span className="sidebar-name">Assistant</span>
        <span
          className={`status-dot ${connected ? 'ok' : 'off'}`}
          title={connected ? 'Connected' : 'Offline'}
        />
      </div>

      <button className="command-trigger" onClick={() => setCommandOpen(true)}>
        <Icon name="search" size={14} />
        <span>Search or run a command…</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="sidebar-nav">
        <NavItem
          icon="list"
          label="Activity"
          count={pendingCount + failedCount}
          onClick={() => setView('activity')}
        />
        <NavItem icon="calendar" label="Connections" onClick={() => setView('connections')} />
      </div>

      <div className="sessions-head">
        <span>Sessions</span>
        <button className="icon-btn" aria-label="New session" onClick={createSession}>
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className="sessions-list">
        {groups.map((g) => (
          <div key={g.label} className="sessions-group">
            <div className="sessions-group-label">{g.label}</div>
            {g.items.map((s) => (
              <button
                key={s.id}
                className={`session-row ${s.id === activeSessionId ? 'selected' : ''}`}
                onClick={() => setActiveSession(s.id)}
              >
                <span className="session-title">{s.title}</span>
                <span className="session-time tabular">{relativeTime(s.ts)}</span>
                {s.hasPending ? (
                  <span className="session-dot warning" title="Needs approval" />
                ) : null}
                {s.lastFailed ? (
                  <span className="session-dot danger" title="Last action failed" />
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="footer-item" onClick={() => setView('settings')}>
          <Icon name="gear" size={16} />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
