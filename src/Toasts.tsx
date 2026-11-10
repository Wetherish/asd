import { useEffect } from 'react';
import { useStore } from './lib/store';
import { undoAction, undoDashboardDelete } from './lib/agent';
import { Icon } from './lib/icons';
import type { Toast } from './lib/types';
import './Toasts.css';

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useStore((s) => s.dismissToast);

  useEffect(() => {
    const ms = toast.undo ? 10000 : 4000;
    const t = setTimeout(() => dismissToast(toast.id), ms);
    return () => clearTimeout(t);
  }, [toast.id, toast.undo, dismissToast]);

  const handleUndo = () => {
    if (toast.dashboardId) undoDashboardDelete(toast.dashboardId);
    else if (toast.actionId) undoAction(toast.actionId);
    dismissToast(toast.id);
  };

  return (
    <div className="toast" role="status">
      <Icon name="check-circle" size={16} />
      <span className="toast-text">{toast.text}</span>
      {toast.undo ? (
        <button className="toast-undo" onClick={handleUndo}>
          Undo
        </button>
      ) : null}
      <button
        className="toast-x"
        aria-label="Dismiss"
        onClick={() => dismissToast(toast.id)}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
