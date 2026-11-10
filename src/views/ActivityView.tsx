import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import type { LogEntry as LogEntryType } from '../lib/types';
import { dayLabel } from '../lib/util';
import { FilterBar } from '../components/FilterBar';
import { LogEntry } from '../components/LogEntry';
import { LogTable, DensityToggle } from '../components/LogTable';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Icon } from '../lib/icons';
import './ActivityView.css';

const FILTERS = ['All', 'Sent', 'Created', 'Read', 'Failed', 'Waiting'];
const SERVICES = ['All', 'Calendar', 'Email', 'Slack', 'SMS', 'Dashboard'];

type Category = 'Sent' | 'Created' | 'Read' | 'Failed' | 'Waiting';

function classify(e: LogEntryType): Category {
  if (e.state === 'failed' || e.state === 'rejected') return 'Failed';
  if (e.state === 'running' || e.state === 'blocked') return 'Waiting';
  const t = e.title.toLowerCase();
  if (t.startsWith('read')) return 'Read';
  if (t.startsWith('sent') || t.startsWith('posted')) return 'Sent';
  return 'Created';
}

function serviceOf(e: LogEntryType): string {
  const t = e.tool.toLowerCase();
  if (t === 'calendar') return 'Calendar';
  if (t === 'email') return 'Email';
  if (t === 'slack') return 'Slack';
  if (t === 'sms') return 'SMS';
  return 'Dashboard';
}

export function ActivityView() {
  const logs = useStore((s) => s.logs);
  const device = useStore((s) => s.device);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('All');
  const [service, setService] = useState('All');
  const [dense, setDense] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ⌘F focuses search (04 §5).
  useEffect(() => {
    if (device !== 'desktop') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [device]);

  const textFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.tool.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q),
    );
  }, [logs, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: textFiltered.length };
    for (const f of FILTERS.slice(1)) c[f] = 0;
    for (const e of textFiltered) c[classify(e)] += 1;
    return c;
  }, [textFiltered]);

  const visible = useMemo(() => {
    let out = textFiltered;
    if (active !== 'All') out = out.filter((e) => classify(e) === active);
    if (service !== 'All') out = out.filter((e) => serviceOf(e) === service);
    return out;
  }, [textFiltered, active, service]);

  const groups = useMemo(() => {
    const map = new Map<string, LogEntryType[]>();
    for (const e of visible) {
      const key = dayLabel(e.ts);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [visible]);

  const searchOpen = focused || query.length > 0;
  const activeFilterCount =
    (query.trim() ? 1 : 0) + (active !== 'All' ? 1 : 0) + (service !== 'All' ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setQuery('');
    setActive('All');
    setService('All');
  };

  return (
    <div className="activity">
      <header className="activity-header">
        <h1 className="activity-title">Activity</h1>
        <div className="activity-header-right">
          <div
            className={searchOpen ? 'activity-search open' : 'activity-search'}
            onClick={() => inputRef.current?.focus()}
          >
            <Icon name="search" size={16} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search activity"
              aria-label="Search activity"
            />
          </div>
          {device === 'desktop' ? (
            <DensityToggle dense={dense} onToggle={() => setDense((v) => !v)} />
          ) : null}
        </div>
      </header>

      <div className="activity-toolbar">
        <FilterBar filters={FILTERS} active={active} onSelect={setActive} counts={counts} />
        {device === 'desktop' ? (
          <>
            <div className="activity-spacer" />
            <select
              className="activity-service"
              aria-label="Filter by service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All services' : s}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <button className="activity-clear" onClick={clearFilters}>
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} · Clear
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="activity-scroll">
        {visible.length === 0 ? (
          <div className="activity-empty">
            {logs.length === 0 || !hasFilters ? (
              <EmptyState
                glyph="list"
                title="No activity yet."
                line="Actions will appear here as the agent works."
              />
            ) : (
              <EmptyState
                glyph="list"
                title="No matching activity."
                line="Try a different search or filter."
                actions={
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        ) : device === 'desktop' ? (
          <LogTable entries={visible} dense={dense} />
        ) : (
          groups.map(([day, entries]) => (
            <section key={day} className="activity-day">
              <h2 className="activity-daylabel">{day}</h2>
              {entries.map((e) => (
                <LogEntry key={e.id} entry={e} />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
