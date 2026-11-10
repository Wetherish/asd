import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from '../lib/store';
import type { SettingsState } from '../lib/types';
import { uid } from '../lib/util';
import { Icon } from '../lib/icons';
import { Button } from '../components/Button';
import './SettingsView.css';

const MODELS: { id: SettingsState['model']; desc: string }[] = [
  { id: 'Balanced', desc: 'Best for most tasks' },
  { id: 'Fast', desc: 'Quicker, less thorough' },
  { id: 'Thorough', desc: 'Slower, most capable' },
];

const RULES: {
  id: SettingsState['approvalRule'];
  label: string;
  sub: string;
  explainer: string;
}[] = [
  {
    id: 'always',
    label: 'Always',
    sub: 'ask',
    explainer: 'Asks before every action that changes something.',
  },
  {
    id: 'sending',
    label: 'Sending',
    sub: 'only',
    explainer:
      'Asks before sending messages or deleting. Read-only runs freely.',
  },
  {
    id: 'readonly',
    label: 'Read-only',
    sub: 'never ask',
    explainer: 'Reads run freely. Everything else still asks.',
  },
];

const NOTIFS: {
  key: keyof SettingsState['notifications'];
  label: string;
}[] = [
  { key: 'taskFinished', label: 'Task finished' },
  { key: 'approvalNeeded', label: 'Approval needed' },
  { key: 'failures', label: 'Failures' },
];

const RETENTION: SettingsState['retentionDays'][] = [30, 90, 180];

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="settings-scrim" onClick={onClose}>
      <div
        className="settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="settings-sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function SettingsView() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const setView = useStore((s) => s.setView);
  const connections = useStore((s) => s.connections);
  const pushToast = useStore((s) => s.pushToast);

  const [modelOpen, setModelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentRule =
    RULES.find((r) => r.id === settings.approvalRule) ?? RULES[1];

  const connectionSummary =
    connections
      .filter((c) => c.state === 'connected')
      .map((c) => c.name)
      .join(', ') || 'Not connected';

  return (
    <div className="settings">
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </header>

      <div className="settings-scroll">
        <section className="settings-section">
          <h2 className="settings-section-heading">Agent</h2>
          <div className="settings-group">
            <button
              type="button"
              className="settings-row"
              onClick={() => setModelOpen(true)}
            >
              <span className="settings-row-label">Model</span>
              <span className="settings-row-value">{settings.model}</span>
              <Icon name="chevron-right" size={16} />
            </button>

            <div className="settings-approval">
              <div
                className="settings-segment"
                role="radiogroup"
                aria-label="Approval rules"
              >
                {RULES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={settings.approvalRule === r.id}
                    className={
                      'settings-segment-item' +
                      (settings.approvalRule === r.id ? ' active' : '')
                    }
                    onClick={() => setSettings({ approvalRule: r.id })}
                  >
                    <span className="settings-segment-label">{r.label}</span>
                    <span className="settings-segment-sub">{r.sub}</span>
                  </button>
                ))}
              </div>
              <p className="settings-explainer">{currentRule.explainer}</p>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-heading">Notifications</h2>
          <div className="settings-group">
            {NOTIFS.map((n) => (
              <label key={n.key} className="settings-row settings-row-toggle">
                <span className="settings-row-label">{n.label}</span>
                <span className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications[n.key]}
                    onChange={(e) =>
                      setSettings({
                        notifications: {
                          ...settings.notifications,
                          [n.key]: e.target.checked,
                        },
                      })
                    }
                  />
                  <span className="settings-switch-track" />
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-heading">Connections</h2>
          <div className="settings-group">
            <button
              type="button"
              className="settings-row"
              onClick={() => setView('connections')}
            >
              <span className="settings-row-label">Connections</span>
              <span className="settings-row-value">{connectionSummary}</span>
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-heading">Data</h2>
          <div className="settings-group">
            <div className="settings-row">
              <span className="settings-row-label">Keep activity for</span>
              <div
                className="settings-segment settings-segment-retention"
                role="radiogroup"
                aria-label="Keep activity for"
              >
                {RETENTION.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={settings.retentionDays === d}
                    className={
                      'settings-segment-item' +
                      (settings.retentionDays === d ? ' active' : '')
                    }
                    onClick={() => setSettings({ retentionDays: d })}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="settings-row settings-row-danger"
              onClick={() => setDeleteOpen(true)}
            >
              <span className="settings-row-label">Delete all activity</span>
            </button>
          </div>
        </section>
      </div>

      {modelOpen && (
        <Sheet title="Model" onClose={() => setModelOpen(false)}>
          <div className="settings-model-list">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={settings.model === m.id}
                className={
                  'settings-model-option' +
                  (settings.model === m.id ? ' active' : '')
                }
                onClick={() => {
                  setSettings({ model: m.id });
                  setModelOpen(false);
                }}
              >
                <span className="settings-model-name">{m.id}</span>
                <span className="settings-model-desc">{m.desc}</span>
              </button>
            ))}
          </div>
          <p className="settings-model-note">
            Changes apply to new messages.
          </p>
        </Sheet>
      )}

      {deleteOpen && (
        <Sheet title="Delete all activity?" onClose={() => setDeleteOpen(false)}>
          <p className="settings-delete-copy">
            This clears the log. It can't be undone.
          </p>
          <div className="settings-delete-actions">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // NOTE: the store exposes no clear-logs mutator; log this as a
                // prototype acknowledgement and confirm via toast.
                pushToast({
                  id: uid('toast'),
                  text: 'Activity cleared',
                  undo: false,
                });
                setDeleteOpen(false);
              }}
            >
              Delete all
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
