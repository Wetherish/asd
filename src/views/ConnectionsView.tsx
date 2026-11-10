import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import type { Connection, ConnectionState } from '../lib/types';
import { disconnectService } from '../lib/agent';
import { ConnectionRow } from '../components/ConnectionRow';
import { StatusPill } from '../components/StatusPill';
import { Button } from '../components/Button';
import { Icon } from '../lib/icons';
import './ConnectionsView.css';

function statusLabel(s: ConnectionState): string {
  switch (s) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting…';
    case 'expired':
      return 'Expired';
    case 'error':
      return 'Error';
    default:
      return 'Not connected';
  }
}

function toneFor(s: ConnectionState): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (s) {
    case 'connected':
      return 'success';
    case 'expired':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'neutral';
  }
}

function DetailSheet({
  connection,
  onClose,
}: {
  connection: Connection;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="connections-scrim" onClick={onClose}>
      <div
        className="connections-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${connection.name} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="connections-sheet-head">
          <Icon name={connection.glyph} size={24} />
          <div className="connections-sheet-heading">
            <span className="connections-sheet-name">{connection.name}</span>
            <StatusPill
              label={statusLabel(connection.state)}
              tone={toneFor(connection.state)}
            />
          </div>
        </div>

        <div className="connections-scopes">
          <h3 className="connections-scopes-title">Can do</h3>
          {connection.scopes.length === 0 ? (
            <p className="connections-scopes-none">Not connected</p>
          ) : (
            <ul className="connections-scopes-list">
              {connection.scopes.map((scope) => (
                <li key={scope} className="connections-scope">
                  <Icon name="check" size={14} />
                  <span>{scope}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="connections-sheet-actions">
          {confirming ? (
            <>
              <p className="connections-confirm-text">
                Disconnect {connection.name}? The agent will stop using it
                immediately.
              </p>
              <div className="connections-confirm-row">
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    disconnectService(connection.id);
                    onClose();
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="destructive"
              full
              onClick={() => setConfirming(true)}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConnectionsView() {
  const connections = useStore((s) => s.connections);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = connections.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="connections">
      <header className="connections-header">
        <h1 className="connections-title">Connections</h1>
      </header>

      <div className="connections-scroll">
        <div className="connections-card">
          {connections.map((c) => (
            <ConnectionRow
              key={c.id}
              connection={c}
              onOpen={() => setSelectedId(c.id)}
            />
          ))}
        </div>
        <p className="connections-note">
          Permissions are checked before every action.
        </p>
      </div>

      {selected && (
        <DetailSheet connection={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
