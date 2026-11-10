import type { Connection } from '../lib/types';
import { Icon } from '../lib/icons';
import { connectService } from '../lib/agent';
import { Button } from './Button';
import './ConnectionRow.css';

function formatScopes(scopes: string[]): string {
  if (scopes.length === 0) return 'Not connected';
  const shown = scopes.slice(0, 2);
  const more = scopes.length - shown.length;
  const text = shown.join(' · ');
  return more > 0 ? `${text} · +${more} more` : text;
}

function scopeLineFor(connection: Connection): string {
  switch (connection.state) {
    case 'disconnected':
      return 'Not connected';
    case 'connecting':
      return '';
    case 'connected':
      return formatScopes(connection.scopes);
    case 'expired':
      return connection.cause ?? 'Access expired';
    case 'error':
      return connection.cause ?? 'Something went wrong';
  }
}

export function ConnectionRow({
  connection,
  onOpen,
}: {
  connection: Connection;
  onOpen: () => void;
}) {
  const { id, name, glyph, state } = connection;
  const scopeLine = scopeLineFor(connection);

  return (
    <div className={`conn conn--${state}`} role="group" aria-label={`${name}, ${state}`}>
      <div className="conn__icon">
        <Icon name={glyph} size={24} />
      </div>

      <div className="conn__body">
        <div className="conn__name">{name}</div>
        {scopeLine ? <div className="conn__scopes">{scopeLine}</div> : null}
      </div>

      <div className="conn__trailing">
        {state === 'disconnected' && (
          <Button variant="primary" size="small" onClick={() => connectService(id)}>
            Connect
          </Button>
        )}
        {state === 'connecting' && <span className="conn__connecting">Connecting…</span>}
        {state === 'connected' && (
          <button
            type="button"
            className="conn__chevron"
            aria-label={`Manage ${name}`}
            onClick={onOpen}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        )}
        {state === 'expired' && (
          <button type="button" className="conn__reconnect" onClick={() => connectService(id)}>
            Reconnect
          </button>
        )}
        {state === 'error' && (
          <button type="button" className="conn__retry" onClick={() => connectService(id)}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
