import { useState } from 'react';
import { useStore } from '../lib/store';
import { Icon } from '../lib/icons';
import './PushDemo.css';

/**
 * Screen 8 — push / lock screen (docs/03-ios.md).
 * Simulates the locked iPhone showing approval + finished notifications
 * and a Live Activity. Approve acts in place; Reject clears.
 */
export function PushDemo() {
  const open = useStore((s) => s.lockScreenOpen);
  const setOpen = useStore((s) => s.setLockScreenOpen);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  if (!open) return null;

  return (
    <div className="lock-scrim" onClick={() => setOpen(false)}>
      <div className="lock-screen" onClick={(e) => e.stopPropagation()}>
        <div className="lock-date">Monday 9 November</div>
        <div className="lock-time tabular">09:41</div>

        <div className="lock-activity">
          <span className="lock-activity-icon">
            <Icon name="refresh" size={14} />
          </span>
          <span className="lock-activity-text">Building dashboard… 0:24</span>
        </div>

        <div className="lock-notifications">
          {rejected ? null : (
            <div className="lock-notif">
              <div className="lock-notif-head">
                <span className="lock-notif-app">ASSISTANT</span>
                <span className="lock-notif-time">now</span>
              </div>
              <div className="lock-notif-title">
                {approved ? 'Sent to Anna' : 'Approval needed'}
              </div>
              <div className="lock-notif-body">Send email to Anna — Running late</div>
              {approved ? (
                <div className="lock-done">✓ Done</div>
              ) : (
                <div className="lock-actions">
                  <button
                    className="lock-action"
                    onClick={() => {
                      setRejected(true);
                    }}
                  >
                    Reject
                  </button>
                  <button
                    className="lock-action"
                    onClick={() => {
                      /* Edit always opens the app */
                      setOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="lock-action lock-action--primary"
                    onClick={() => setApproved(true)}
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="lock-notif">
            <div className="lock-notif-head">
              <span className="lock-notif-app">ASSISTANT</span>
              <span className="lock-notif-time">2m ago</span>
            </div>
            <div className="lock-notif-title">Dashboard ready</div>
            <div className="lock-notif-body">Weekly spending · 12 categories</div>
            <div className="lock-actions">
              <button className="lock-action" onClick={() => setOpen(false)}>
                View
              </button>
            </div>
          </div>
        </div>

        <button className="lock-close" onClick={() => setOpen(false)}>
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
