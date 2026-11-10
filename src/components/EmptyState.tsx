import type { ReactNode } from 'react';
import { Icon } from '../lib/icons';
import './EmptyState.css';

export function EmptyState({
  glyph,
  title,
  line,
  actions,
}: {
  glyph: string;
  title: string;
  line?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__glyph">
        <Icon name={glyph} size={48} strokeWidth={1.4} />
      </div>
      <h2 className="empty__title">{title}</h2>
      {line ? <p className="empty__line">{line}</p> : null}
      {actions ? <div className="empty__actions">{actions}</div> : null}
    </div>
  );
}
