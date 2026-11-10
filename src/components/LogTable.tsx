import { Fragment, useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import type { LogEntry as LogEntryRecord } from '../lib/types';
import { clockTime, dayLabel, uid } from '../lib/util';
import { retryLastFailed } from '../lib/agent';
import { logStatus } from './LogEntry';
import { Icon } from '../lib/icons';
import './LogTable.css';

function LogRow({ entry, dense }: { entry: LogEntryRecord; dense: boolean }) {
  const setActiveSession = useStore((s) => s.setActiveSession);
  const pushToast = useStore((s) => s.pushToast);
  const [expanded, setExpanded] = useState(false);

  const isFailed = entry.state === 'failed';
  const status = logStatus(entry.state);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard?.writeText(entry.id).catch(() => undefined);
    pushToast({ id: uid('toast'), text: 'Request ID copied' });
  };

  const openChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSession(entry.sessionId);
  };

  const retry = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryLastFailed(entry.sessionId);
  };

  return (
    <Fragment>
      <tr
        className={`logtable__row ${isFailed ? 'logtable__row--failed' : ''} ${
          dense ? 'logtable__row--dense' : ''
        }`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <td className="logtable__cell logtable__cell--time tabular">{clockTime(entry.ts)}</td>
        <td className="logtable__cell logtable__cell--action">{entry.title}</td>
        <td className="logtable__cell logtable__cell--tool mono">{entry.tool}</td>
        <td className="logtable__cell logtable__cell--status">
          <span className={`logtable__dot logtable__dot--${entry.state}`} aria-hidden="true" />
          <span className={`logtable__status logtable__status--${status.tone}`}>{status.label}</span>
        </td>
        <td className="logtable__cell logtable__cell--result">{entry.result}</td>
        <td className="logtable__cell logtable__cell--actions">
          <div className="logtable__actions">
            {isFailed ? (
              <button className="logtable__action" onClick={retry}>
                Retry
              </button>
            ) : null}
            <button className="logtable__action" onClick={copyId}>
              Copy ID
            </button>
            <button className="logtable__action" onClick={openChat}>
              Open in chat
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="logtable__detail-row">
          <td colSpan={6}>
            <div className="logtable__detail">
              <div className="logtable__detail-item">
                <span className="logtable__detail-key">Duration</span>
                <span className="logtable__detail-value">1.2s</span>
              </div>
              <div className="logtable__detail-item">
                <span className="logtable__detail-key">Tool</span>
                <span className="logtable__detail-value mono">{entry.tool}</span>
              </div>
              <div className="logtable__detail-item">
                <span className="logtable__detail-key">Request ID</span>
                <span className="logtable__detail-value mono">req_8f2a91c3</span>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function LogTable({
  entries,
  dense,
}: {
  entries: LogEntryRecord[];
  dense: boolean;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, LogEntryRecord[]>();
    for (const e of entries) {
      const key = dayLabel(e.ts);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [entries]);

  return (
    <div className="logtable">
      <table className="logtable__table">
        <thead>
          <tr className="logtable__head">
            <th className="logtable__th logtable__th--time">Time</th>
            <th className="logtable__th logtable__th--action">Action</th>
            <th className="logtable__th logtable__th--tool">Tool</th>
            <th className="logtable__th logtable__th--status">Status</th>
            <th className="logtable__th logtable__th--result">Result</th>
            <th className="logtable__th logtable__th--actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([day, items]) => (
            <Fragment key={day}>
              <tr className="logtable__day">
                <td colSpan={6}>{day}</td>
              </tr>
              {items.map((e) => (
                <LogRow key={e.id} entry={e} dense={dense} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DensityToggle({
  dense,
  onToggle,
}: {
  dense: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="density-toggle"
      onClick={onToggle}
      aria-pressed={dense}
      aria-label={dense ? 'Use comfortable row density' : 'Use compact row density'}
      title={dense ? 'Comfortable' : 'Compact'}
    >
      <Icon name="list" size={16} />
    </button>
  );
}
