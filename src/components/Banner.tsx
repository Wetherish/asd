import { Icon } from '../lib/icons';
import './Banner.css';

const GLYPH: Record<1 | 2 | 3 | 4, string> = {
  1: 'warning-triangle', // auth expired
  2: 'clock', // offline
  3: 'x-octagon', // tool failed
  4: 'bubble', // info
};

export function Banner({
  priority,
  title,
  line,
  actionLabel,
  onAction,
}: {
  priority: 1 | 2 | 3 | 4;
  title: string;
  line?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={`banner banner--p${priority}`}>
      <div className="banner__glyph">
        <Icon name={GLYPH[priority]} size={16} />
      </div>
      <div className="banner__body">
        <div className="banner__title">{title}</div>
        {line ? <div className="banner__line">{line}</div> : null}
      </div>
      {actionLabel ? (
        <button type="button" className="banner__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
