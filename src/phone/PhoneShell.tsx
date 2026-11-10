import { useStore } from '../lib/store';
import { Icon } from '../lib/icons';
import { ChatView } from '../views/ChatView';
import { ActivityView } from '../views/ActivityView';
import { ConnectionsView } from '../views/ConnectionsView';
import { SessionsView } from '../views/SessionsView';
import { SettingsView } from '../views/SettingsView';
import { DashboardView } from '../views/DashboardView';
import { TabBar } from './TabBar';
import './PhoneShell.css';

export function PhoneShell() {
  const phoneStack = useStore((s) => s.phoneStack);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const sessions = useStore((s) => s.sessions);
  const setView = useStore((s) => s.setView);
  const popPhone = useStore((s) => s.popPhone);
  const createSession = useStore((s) => s.createSession);

  const top = phoneStack[phoneStack.length - 1] ?? { kind: 'chat' as const };

  // Dashboard is a full-screen cover (03 §Shell): no tab bar, no nav.
  if (top.kind === 'dashboard') {
    return (
      <div className="phone-frame">
        <div className="phone-content phone-content--cover">
          <DashboardView />
        </div>
      </div>
    );
  }

  const activeTitle =
    sessions.find((s) => s.id === activeSessionId)?.title ?? 'Assistant';

  let title = 'Assistant';
  let leading: 'menu' | 'back' | null = null;
  let trailing: 'new' | null = null;
  switch (top.kind) {
    case 'chat':
      title = activeTitle;
      leading = 'menu';
      trailing = 'new';
      break;
    case 'sessions':
      title = 'Sessions';
      leading = 'back';
      break;
    case 'activity':
      title = 'Activity';
      break;
    case 'connections':
      title = 'Connections';
      leading = 'back';
      break;
    case 'settings':
      title = 'Settings';
      break;
  }

  return (
    <div className="phone-frame">
      <div className="phone-status" aria-hidden="true">
        <span className="phone-status-time tabular">9:41</span>
        <span className="phone-status-glyphs">•••</span>
      </div>

      <header className="phone-nav">
        {leading === 'menu' ? (
          <button
            className="phone-nav-btn"
            aria-label="Sessions"
            onClick={() => setView('sessions')}
          >
            <Icon name="menu" size={20} />
          </button>
        ) : leading === 'back' ? (
          <button className="phone-nav-btn" aria-label="Back" onClick={popPhone}>
            <Icon name="chevron-right" size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
        ) : (
          <span className="phone-nav-spacer" />
        )}

        <span className="phone-nav-title">{title}</span>

        {trailing === 'new' ? (
          <button className="phone-nav-btn" aria-label="New session" onClick={createSession}>
            <Icon name="pencil" size={20} />
          </button>
        ) : (
          <span className="phone-nav-spacer" />
        )}
      </header>

      <div className="phone-content">
        {top.kind === 'sessions' ? (
          <SessionsView />
        ) : top.kind === 'activity' ? (
          <ActivityView />
        ) : top.kind === 'connections' ? (
          <ConnectionsView />
        ) : top.kind === 'settings' ? (
          <SettingsView />
        ) : (
          <ChatView />
        )}
      </div>

      <TabBar />
    </div>
  );
}
