import { useEffect, useState } from 'react';
import type { Action, ActionState, PreviewRow } from '../lib/types';
import { Icon } from '../lib/icons';
import { useStore } from '../lib/store';
import {
  approveAction,
  approveEditedAction,
  askAgainAction,
  cancelEditAction,
  editAction,
  rejectAction,
  undoAction,
} from '../lib/agent';
import { Button } from './Button';
import { StatusPill, pillToneForState } from './StatusPill';
import './ApprovalCard.css';

function headerLabel(state: ActionState): string {
  switch (state) {
    case 'pending':
      return 'Pending';
    case 'editing':
      return 'Editing';
    case 'approving':
      return 'Approving';
    case 'failed':
      return 'Failed';
    default:
      return '';
  }
}

export function ApprovalCard({ action }: { action: Action }) {
  // The draft holds editable preview values while `editing`; it resets whenever
  // the action changes or its state changes (so Cancel discards edits).
  const [draft, setDraft] = useState<PreviewRow[]>(action.preview);

  useEffect(() => {
    setDraft(action.preview);
  }, [action.id, action.state]);

  const state = action.state;
  const isDestructive = action.destructive;

  // ---- collapsed states ----

  if (state === 'proposed') {
    return <ProposedSkeleton />;
  }

  if (state === 'approved' || state === 'done') {
    const undoable = state === 'approved' && action.undoUntil != null;
    return (
      <div className="approval-line" role="status">
        <span className="approval-line__done">
          <Icon name="check-circle" size={16} />
        </span>
        <span className="approval-line__text">{action.resultLine ?? 'Done'}</span>
        {undoable ? (
          <Button variant="ghost" size="small" onClick={() => undoAction(action.id)}>
            Undo
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="small"
            onClick={() => useStore.getState().setView('activity')}
          >
            View in activity
          </Button>
        )}
      </div>
    );
  }

  if (state === 'undone') {
    return (
      <div className="approval-line approval-line--muted" role="status">
        <span className="approval-line__muted">
          <Icon name="undo" size={16} />
        </span>
        <span className="approval-line__text">Undone</span>
      </div>
    );
  }

  if (state === 'rejected') {
    return (
      <div className="approval-line approval-line--muted" role="status">
        <span className="approval-line__muted">
          <Icon name="x" size={16} />
        </span>
        <span className="approval-line__text">{action.title} rejected</span>
        <Button variant="ghost" size="small" onClick={() => askAgainAction(action.id)}>
          Ask again
        </Button>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="approval-line" role="status">
        <span className="approval-line__warning">
          <Icon name="warning-triangle" size={16} />
        </span>
        <span className="approval-line__text">Expired</span>
        <Button variant="ghost" size="small" onClick={() => askAgainAction(action.id)}>
          Ask again
        </Button>
      </div>
    );
  }

  // ---- open states: pending | editing | approving | failed ----

  const isEditing = state === 'editing';
  const isApproving = state === 'approving';
  const isFailed = state === 'failed';

  const approveLabel = isDestructive ? action.title : isEditing ? 'Approve edited' : 'Approve';

  return (
    <section
      className={isFailed ? 'approval approval--failed' : 'approval'}
      role="group"
      aria-label={`Approval needed. ${action.title}. ${action.consequence}`}
    >
      <header className="approval__header">
        <span
          className={isDestructive ? 'approval__glyph approval__glyph--danger' : 'approval__glyph'}
        >
          <Icon name={action.glyph} size={20} />
        </span>
        <h3 className="approval__title">{action.title}</h3>
        <StatusPill label={headerLabel(state)} tone={pillToneForState(state)} />
      </header>

      <div className="approval__preview">
        {draft.map((row, i) =>
          isEditing ? (
            <div className="approval__row" key={`${action.id}-${i}`}>
              <label className="approval__label" htmlFor={`${action.id}-${i}`}>
                {row.label}
              </label>
              <input
                id={`${action.id}-${i}`}
                className="approval__input"
                value={row.value}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)),
                  )
                }
              />
            </div>
          ) : (
            <div className="approval__row" key={`${action.id}-${i}`}>
              <span className="approval__label">{row.label}</span>
              <span className="approval__value">{row.value}</span>
            </div>
          ),
        )}
      </div>

      {isFailed && action.cause ? (
        <p className="approval__cause">
          <Icon name="x-octagon" size={14} />
          {action.cause}
        </p>
      ) : null}

      <p
        className={
          isDestructive
            ? 'approval__consequence approval__consequence--danger'
            : 'approval__consequence'
        }
      >
        {action.consequence}
      </p>

      {isApproving && action.approvingLong ? (
        <p className="approval__long">Still working. Taking longer than usual.</p>
      ) : null}

      <div className="approval__actions">
        {state === 'pending' && (
          <>
            <Button variant="secondary" size="small" onClick={() => rejectAction(action.id)}>
              Reject
            </Button>
            <Button variant="secondary" size="small" onClick={() => editAction(action.id)}>
              Edit
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'primary'}
              size="small"
              onClick={() => approveAction(action.id)}
            >
              {approveLabel}
            </Button>
          </>
        )}

        {state === 'editing' && (
          <>
            <Button variant="secondary" size="small" onClick={() => cancelEditAction(action.id)}>
              Cancel
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'primary'}
              size="small"
              onClick={() => approveEditedAction(action.id, draft)}
            >
              {approveLabel}
            </Button>
          </>
        )}

        {state === 'approving' && (
          <Button variant="primary" size="small" disabled loading>
            Approving…
          </Button>
        )}

        {state === 'failed' && (
          <>
            <Button variant="secondary" size="small" onClick={() => rejectAction(action.id)}>
              Dismiss
            </Button>
            <Button variant="secondary" size="small" onClick={() => editAction(action.id)}>
              Edit
            </Button>
            <Button variant="primary" size="small" onClick={() => askAgainAction(action.id)}>
              Retry
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

function ProposedSkeleton() {
  return (
    <div className="approval approval--proposed" role="status" aria-label="Preparing…">
      <div className="approval__skeleton-header">
        <span className="approval__skeleton approval__skeleton--glyph" />
        <span className="approval__skeleton approval__skeleton--title" />
      </div>
      {[0, 1, 2].map((i) => (
        <div className="approval__skeleton-row" key={i}>
          <span className="approval__skeleton approval__skeleton--label" />
          <span className="approval__skeleton approval__skeleton--value" />
        </div>
      ))}
      <span className="approval__preparing">Preparing…</span>
    </div>
  );
}
