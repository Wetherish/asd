import { useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import type { Action, Message } from '../lib/types';
import { connectService, sendMessage } from '../lib/agent';
import { MessageBubble } from '../components/MessageBubble';
import { ApprovalCard } from '../components/ApprovalCard';
import { ToolStatusChip } from '../components/ToolStatusChip';
import { Composer } from '../components/Composer';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import './ChatView.css';

type TimelineItem =
  | { kind: 'message'; message: Message }
  | { kind: 'action'; action: Action }
  | { kind: 'tool' };

const EXAMPLES = [
  'Create a dashboard of my weekly spending',
  "Message Anna that I'm running late",
  'Schedule lunch Friday at 1pm',
];

function seqOf(it: TimelineItem): number {
  if (it.kind === 'message') return it.message.seq;
  if (it.kind === 'action') return it.action.seq;
  return Number.MAX_SAFE_INTEGER;
}

export function ChatView() {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const messages = useStore((s) => s.messages);
  const actions = useStore((s) => s.actions);
  const toolStatus = useStore((s) => s.toolStatus);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);

  // Follow new content while the user is near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  });

  const sessionMessages = activeSessionId ? messages[activeSessionId] ?? [] : [];
  const sessionActions = actions.filter((a) => a.sessionId === activeSessionId);

  const items: TimelineItem[] = [
    ...sessionMessages.map(
      (m): TimelineItem => ({ kind: 'message', message: m }),
    ),
    ...sessionActions.map(
      (a): TimelineItem => ({ kind: 'action', action: a }),
    ),
  ].sort((a, b) => seqOf(a) - seqOf(b));

  // Most recent agent message anchors the tool-status chip.
  let agentIndex = -1;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.kind === 'message' && it.message.role === 'agent') {
      agentIndex = i;
      break;
    }
  }

  const showTool = toolStatus !== null && toolStatus.sessionId === activeSessionId;
  const renderItems = items.slice();
  if (showTool) {
    renderItems.splice(agentIndex >= 0 ? agentIndex : renderItems.length, 0, {
      kind: 'tool' as const,
    });
  }

  const noSessions = sessions.length === 0;
  const empty = items.length === 0;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  };

  return (
    <div className="chatview">
      <div className="chatview-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="chatview-inner">
          {noSessions ? (
            <div className="chatview-center">
              <EmptyState
                glyph="bubble"
                title="Your assistant is ready."
                line="Connect a service so it can act."
                actions={
                  <>
                    <Button
                      variant="primary"
                      onClick={() => connectService('calendar')}
                    >
                      Connect Calendar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => useStore.getState().createSession()}
                    >
                      Just chat
                    </Button>
                  </>
                }
              />
            </div>
          ) : empty ? (
            <div className="chatview-center">
              <div className="chatview-examples">
                {EXAMPLES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="chatview-example"
                    onClick={() => sendMessage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="chatview-timeline">
              {renderItems.map((it) => {
                if (it.kind === 'tool') {
                  return (
                    <li key="tool-status">
                      <ToolStatusChip />
                    </li>
                  );
                }
                if (it.kind === 'message') {
                  return (
                    <li key={it.message.id}>
                      <MessageBubble message={it.message} />
                    </li>
                  );
                }
                return (
                  <li key={it.action.id}>
                    <ApprovalCard action={it.action} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <Composer />
    </div>
  );
}
