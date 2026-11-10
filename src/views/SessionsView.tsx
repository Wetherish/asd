import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { Session } from '../lib/types';
import { dayLabel, relativeTime } from '../lib/util';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Icon } from '../lib/icons';
import './SessionsView.css';

export function SessionsView() {
  const sessions = useStore((s) => s.sessions);
  const setActiveSession = useStore((s) => s.setActiveSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const createSession = useStore((s) => s.createSession);
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.snippet.toLowerCase().includes(q),
    );
  }, [sessions, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of filtered) {
      const key = dayLabel(s.ts);
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="sessions">
      <header className="sessions-header">
        <h1 className="sessions-title">Sessions</h1>
        <div className="sessions-search">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
        </div>
      </header>

      <div className="sessions-scroll">
        {filtered.length === 0 ? (
          <div className="sessions-empty">
            {sessions.length === 0 ? (
              <EmptyState
                glyph="bubble"
                title="No conversations yet."
                line="Start a chat and it will appear here."
                actions={
                  <Button variant="primary" onClick={() => createSession()}>
                    Start a chat
                  </Button>
                }
              />
            ) : (
              <EmptyState
                glyph="search"
                title="Nothing matches your search."
                line="Try a different term."
                actions={
                  <Button variant="ghost" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          groups.map(([day, list]) => (
            <section key={day} className="sessions-day">
              <h2 className="sessions-daylabel">{day}</h2>
              {list.map((s) => (
                <div key={s.id} className="session-row">
                  <button
                    type="button"
                    className="session-row-hit"
                    onClick={() => setActiveSession(s.id)}
                  >
                    <span className="session-row-title">{s.title}</span>
                    <span className="session-row-snippet">
                      {s.snippet || 'New session'}
                    </span>
                  </button>
                  <span className="session-row-time tabular">
                    {relativeTime(s.ts)}
                  </span>
                  {(s.hasPending || s.lastFailed) && (
                    <span
                      className={
                        s.hasPending
                          ? 'session-dot session-dot-warning'
                          : 'session-dot session-dot-danger'
                      }
                      aria-label={s.hasPending ? 'Needs approval' : 'Failed'}
                    />
                  )}
                  <div className="session-row-actions">
                    <button
                      type="button"
                      className="session-more"
                      aria-label={`Options for ${s.title}`}
                      aria-haspopup="menu"
                      aria-expanded={menuId === s.id}
                      onClick={() =>
                        setMenuId(menuId === s.id ? null : s.id)
                      }
                    >
                      <Icon name="more" size={16} />
                    </button>
                    {menuId === s.id && (
                      <div className="session-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="session-menu-delete"
                          onClick={() => {
                            deleteSession(s.id);
                            setMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
