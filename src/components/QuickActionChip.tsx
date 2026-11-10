import { Icon } from '../lib/icons';
import './QuickActionChip.css';

export function QuickActionChip({
  label,
  icon,
  onClick,
  selected,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={`qa-chip${selected ? ' qa-chip--selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected ?? false}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      <span className="qa-chip__label">{label}</span>
    </button>
  );
}
