import { useEffect, useRef, useState } from 'react';
import { useStore } from './lib/store';
import { sendMessage } from './lib/agent';
import { Icon } from './lib/icons';
import './CommandBar.css';

interface Item {
  type: 'action' | 'session' | 'ask';
  id?: string;
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
}

export function CommandBar() {
  const open = useStore((s) => s.commandOpen);
  const setOpen = useStore((s) => s.setCommandOpen);
  const sessions = useStore((s) => s.sessions);
  const theme = useStore((s) => s.theme);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const st = useStore.getState();
  const actions: Item[] = [
    { type: 'action', id: 'new', label: 'New session', icon: 'plus', hint: '⌘N', run: () => st.createSession() },
    { type: 'action', id: 'settings', label: 'Open settings', icon: 'gear', hint: '⌘,', run: () => st.setView('settings') },
    { type: 'action', id: 'theme', label: 'Toggle theme', icon: theme === 'light' ? 'moon' : 'sun', run: () => st.setTheme(theme === 'light' ? 'dark' : 'light') },
    { type: 'action', id: 'connections', label: 'Connections', icon: 'calendar', hint: '⌘3', run: () => st.setView('connections') },
    { type: 'action', id: 'activity', label: 'Activity', icon: 'list', hint: '⌘2', run: () => st.setView('activity') },
    { type: 'action', id: 'reset', label: 'Reset demo', icon: 'refresh', run: () => st.resetDemo() },
  ];

  const needle = q.toLowerCase().trim();
  const filteredActions = actions.filter((a) => a.label.toLowerCase().includes(needle));
  const filteredSessions: Item[] = sessions
    .filter((s) => s.title.toLowerCase().includes(needle))
    .slice(0, 5)
    .map((s) => ({
      type: 'session',
      id: s.id,
      label: s.title,
      icon: 'bubble',
      run: () => st.setActiveSession(s.id),
    }));
  const askItem: Item[] = needle
    ? [
        {
          type: 'ask',
          label: `Ask the agent: “${q.trim()}”`,
          icon: 'send',
          run: () => {
            setOpen(false);
            sendMessage(q.trim());
          },
        },
      ]
    : [];

  const combined: Item[] = [...filteredActions, ...filteredSessions, ...askItem];
  const safeSel = Math.min(sel, Math.max(0, combined.length - 1));

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, combined.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = combined[safeSel];
      if (it) {
        setOpen(false);
        it.run();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const grouped: { label: string; items: Item[] }[] = [];
  if (filteredActions.length) grouped.push({ label: 'Actions', items: filteredActions });
  if (filteredSessions.length) grouped.push({ label: 'Sessions', items: filteredSessions });
  if (askItem.length) grouped.push({ label: 'Ask', items: askItem });

  let flatIndex = -1;

  return (
    <div className="command-scrim" onClick={() => setOpen(false)}>
      <div
        className="command-bar"
        role="dialog"
        aria-modal="true"
        aria-label="Command bar"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="command-input-row">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="command-input"
            placeholder="Search or run a command…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
          />
        </div>
        <div className="command-results">
          {combined.length === 0 ? (
            <div className="command-none">No results.</div>
          ) : (
            grouped.map((g) => (
              <div key={g.label} className="command-group">
                <div className="command-group-label">{g.label}</div>
                {g.items.map((it) => {
                  flatIndex += 1;
                  const idx = flatIndex;
                  return (
                    <button
                      key={`${it.type}-${it.id ?? it.label}`}
                      className={`command-item ${idx === safeSel ? 'selected' : ''}`}
                      onMouseEnter={() => setSel(idx)}
                      onClick={() => {
                        setOpen(false);
                        it.run();
                      }}
                    >
                      <Icon name={it.icon} size={16} />
                      <span className="command-item-label">{it.label}</span>
                      {it.hint ? <kbd>{it.hint}</kbd> : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="command-footer">
          <span>↑↓ move</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
