import { useEffect } from 'react';
import { useStore } from './lib/store';
import { approveAction } from './lib/agent';
import { Icon } from './lib/icons';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { CommandBar } from './CommandBar';
import { DestructiveSheet } from './DestructiveSheet';
import { Toasts } from './Toasts';
import { PhoneShell } from './phone/PhoneShell';
import { PushDemo } from './phone/PushDemo';
import { ChatView } from './views/ChatView';
import { ActivityView } from './views/ActivityView';
import { ConnectionsView } from './views/ConnectionsView';
import { SessionsView } from './views/SessionsView';
import { SettingsView } from './views/SettingsView';
import { DashboardView } from './views/DashboardView';
import './App.css';

export function App() {
  const theme = useStore((s) => s.theme);
  const device = useStore((s) => s.device);
  const view = useStore((s) => s.view);
  const panelOpen = useStore((s) => s.panelOpen);
  const activeSessionId = useStore((s) => s.activeSessionId);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const st = useStore.getState();

      if (st.commandOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          st.setCommandOpen(false);
        }
        return;
      }
      if (st.confirmSheet) {
        if (e.key === 'Escape') {
          e.preventDefault();
          st.setConfirmSheet(null);
        }
        return;
      }

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        st.setCommandOpen(true);
        return;
      }
      if (mod && e.key === '\\') {
        e.preventDefault();
        st.togglePanel();
        return;
      }

      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable);

      if (mod && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          st.setView('chat');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          st.setView('activity');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          st.setView('connections');
          return;
        }
        if (e.key === ',') {
          e.preventDefault();
          st.setView('settings');
          return;
        }
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          st.createSession();
          return;
        }
        if (e.key === 'Enter' && !typing) {
          const exp = st.actions.find((a) => a.id === st.expandedActionId);
          if (exp && (exp.state === 'pending' || exp.state === 'editing')) {
            e.preventDefault();
            approveAction(exp.id);
          }
          return;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (device === 'phone') {
    return (
      <div className="app app--phone">
        <div className="phone-stage">
          <div className="phone-controls">
            <button className="device-btn active" aria-pressed="true">
              <Icon name="phone" size={14} /> Phone
            </button>
            <button
              className="device-btn"
              onClick={() => useStore.getState().setDevice('desktop')}
            >
              <Icon name="monitor" size={14} /> Desktop
            </button>
            <span className="phone-controls-spacer" />
            <button
              className="device-btn"
              onClick={() => useStore.getState().setLockScreenOpen(true)}
            >
              <Icon name="bubble" size={14} /> Lock screen
            </button>
            <button
              className="icon-btn"
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              onClick={() =>
                useStore.getState().setTheme(theme === 'light' ? 'dark' : 'light')
              }
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
            </button>
          </div>
          <PhoneShell />
        </div>
        <PushDemo />
        <DestructiveSheet />
        <Toasts />
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="app">
        <DashboardView />
        <CommandBar />
        <DestructiveSheet />
        <Toasts />
      </div>
    );
  }

  const title =
    view === 'chat'
      ? useStore.getState().sessions.find((s) => s.id === activeSessionId)?.title ??
        'Assistant'
      : {
          activity: 'Activity',
          connections: 'Connections',
          sessions: 'Sessions',
          settings: 'Settings',
        }[view as string] ?? 'Assistant';

  let main: JSX.Element;
  switch (view) {
    case 'activity':
      main = <ActivityView />;
      break;
    case 'connections':
      main = <ConnectionsView />;
      break;
    case 'sessions':
      main = <SessionsView />;
      break;
    case 'settings':
      main = <SettingsView />;
      break;
    default:
      main = <ChatView />;
  }

  return (
    <div className="app">
      <header className="titlebar">
        <div className="titlebar-left">
          <span className="titlebar-title">{title}</span>
        </div>
        <div className="titlebar-right">
          <button
            className="device-btn"
            onClick={() => useStore.getState().setDevice('phone')}
          >
            <Icon name="phone" size={14} /> Phone
          </button>
          <button
            className="icon-btn"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            onClick={() =>
              useStore.getState().setTheme(theme === 'light' ? 'dark' : 'light')
            }
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} />
          </button>
        </div>
      </header>
      <div className="body">
        <Sidebar />
        <main className="main">{main}</main>
        {view === 'chat' && panelOpen ? <RightPanel /> : null}
      </div>
      <CommandBar />
      <DestructiveSheet />
      <Toasts />
    </div>
  );
}
