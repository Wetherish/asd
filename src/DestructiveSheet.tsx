import { useStore } from './lib/store';
import { confirmDestructive, cancelDestructive } from './lib/agent';
import { Icon } from './lib/icons';
import { Button } from './components/Button';
import './DestructiveSheet.css';

export function DestructiveSheet() {
  const confirmSheet = useStore((s) => s.confirmSheet);
  const device = useStore((s) => s.device);
  const action = useStore((s) => s.actions.find((a) => a.id === s.confirmSheet));

  if (!confirmSheet || !action) return null;

  const alreadyWarned = /can'?t be undone/i.test(action.consequence);

  return (
    <div
      className={`sheet-scrim ${device === 'phone' ? 'sheet-scrim--phone' : ''}`}
      onClick={() => cancelDestructive()}
    >
      <div
        className={`destructive-sheet ${device === 'phone' ? 'destructive-sheet--phone' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${action.title}?`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ds-header">
          <span className="ds-glyph danger">
            <Icon name={action.glyph} size={20} />
          </span>
          <h2 className="ds-title">{action.title}?</h2>
        </div>

        <div className="ds-preview">
          {action.preview.map((r) => (
            <div key={r.label} className="ds-row">
              <span className="ds-label">{r.label}</span>
              <span className="ds-value">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="ds-consequence danger">{action.consequence}</div>
        {!alreadyWarned ? <div className="ds-warn danger">This can't be undone.</div> : null}

        <div className="ds-actions">
          <Button variant="secondary" onClick={cancelDestructive}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDestructive}>
            {action.title}
          </Button>
        </div>
      </div>
    </div>
  );
}
