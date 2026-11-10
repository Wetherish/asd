import { useStore } from '../lib/store';
import { Icon } from '../lib/icons';
import { retryLastFailed } from '../lib/agent';
import type { Message } from '../lib/types';
import './MessageBubble.css';

export function MessageBubble({ message }: { message: Message }) {
  const list = useStore((s) => s.messages[message.sessionId]);

  // "Assistant" label appears once per contiguous agent group (first only).
  let prev: Message | undefined;
  if (list) {
    const idx = list.findIndex((m) => m.id === message.id);
    prev = idx > 0 ? list[idx - 1] : undefined;
  }
  const firstInGroup =
    message.role === 'agent' && (!prev || prev.role !== 'agent');

  if (message.role === 'user') {
    const cls = [
      'msg__bubble',
      message.status === 'sending' ? 'msg__bubble--sending' : '',
      message.status === 'failed' ? 'msg__bubble--failed' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="msg msg--user">
        <div className={cls}>
          {message.status === 'sending' ? <Icon name="clock" size={14} /> : null}
          <span className="sr-only">You said: </span>
          <span>{message.text}</span>
        </div>
        {message.status === 'failed' ? (
          <div className="msg__user-hint">Not sent · Tap to retry</div>
        ) : null}
      </div>
    );
  }

  if (message.kind === 'dashboard-card') {
    return (
      <div className="msg msg--agent">
        {firstInGroup ? <div className="msg__group">Assistant</div> : null}
        <button
          type="button"
          className="msg__card"
          onClick={() => {
            if (message.dashboardId) {
              useStore.getState().openDashboard(message.dashboardId);
            }
          }}
          aria-label={`${message.dashboardName ?? ''}. ${message.dashboardMeta ?? ''}`}
        >
          <span className="msg__card-body">
            <span className="msg__card-name">{message.dashboardName}</span>
            {message.dashboardMeta ? (
              <span className="msg__card-meta">{message.dashboardMeta}</span>
            ) : null}
          </span>
          <span className="msg__card-chevron">
            <Icon name="chevron-right" size={16} />
          </span>
        </button>
      </div>
    );
  }

  if (message.kind === 'error') {
    return (
      <div className="msg msg--agent">
        {firstInGroup ? <div className="msg__group">Assistant</div> : null}
        <div className="msg__error">
          <span className="msg__error-glyph">
            <Icon name="x-octagon" size={14} />
          </span>
          <span className="msg__error-text">{message.text}</span>
          {message.retry ? (
            <button
              type="button"
              className="msg__retry"
              onClick={() => retryLastFailed(message.sessionId)}
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="msg msg--agent">
      {firstInGroup ? <div className="msg__group">Assistant</div> : null}
      <div className="msg__text">
        {message.text}
        {message.status === 'streaming' ? (
          <span className="msg__caret" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}
