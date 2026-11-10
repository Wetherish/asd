import { useState } from 'react';
import type { LogEntry as LogEntryRecord, LogState } from '../lib/types';
import { Icon } from '../lib/icons';
import { clockTime } from '../lib/util';
import { retryLastFailed } from '../lib/agent';
import { Button } from './Button';
import './LogEntry.css';

export interface LogStatusMeta {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'running';
}

export function logStatus(state: LogState): LogStatusMeta {
  switch (state) {
    case 'done':
      return { label: 'Done', tone: 'success' };
    case 'failed':
      return { label: 'Failed', tone: 'danger' };
    case 'running':
      return { label: 'Running…', tone: 'running' };
    case 'blocked':
      return { label: 'Waiting for approval', tone: 'warning' };
    case 'rejected':
      return { label: 'You rejected this', tone: 'neutral' };
  }
}

/**
 * iOS timeline row (03 §Screen 4): a vertical rail with an 8pt dot,
 * time + title + tool + status on the first line, result on the second.
 */
export function LogEntry({ entry }: { entry: LogEntryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const isFailed = entry.state === 'failed';
  const status = logStatus(entry.state);

  return (
    <div className={`log ${isFailed ? 'log--failed' : ''}`}>
      <div className="log__rail" aria-hidden="true">
        <span className={`log__dot log__dot--${entry.state}`} />
      </div>

      <div className="log__body">
        <div className="log__line1">
          <span className="log__time tabular">{clockTime(entry.ts)}</span>
          <span className="log__title">{entry.title}</span>
          <span className="log__tool mono">[{entry.tool}]</span>
          <span className={`log__status log__status--${status.tone}`}>{status.label}</span>
        </div>
        <div className={`log__result ${isFailed ? 'log__result--failed' : ''}`}>
          {entry.result}
        </div>

        {expanded ? (
          <div className="log__detail">
            <div className="log__detail-row">
              <span className="log__detail-key">Duration</span>
              <span className="log__detail-value">1.2s</span>
            </div>
            <div className="log__detail-row">
              <span className="log__detail-key">Request ID</span>
              <span className="log__detail-value mono">req_8f2a91c3</span>
            </div>
          </div>
        ) : null}

        {isFailed && !expanded ? (
          <div className="log__retry">
            <Button
              variant="ghost"
              size="small"
              onClick={() => retryLastFailed(entry.sessionId)}
            >
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="log__expand"
        aria-label={expanded ? 'Hide details' : 'Show details'}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={expanded ? 'log__chevron log__chevron--open' : 'log__chevron'}>
          <Icon name="chevron-down" size={16} />
        </span>
      </button>
    </div>
  );
}
