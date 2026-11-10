import './StatusPill.css';

export type PillTone = 'success' | 'warning' | 'danger' | 'neutral';

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  return (
    <span className={`pill pill--${tone}`}>
      <span className="pill__dot" aria-hidden="true" />
      <span className="pill__label">{label}</span>
    </span>
  );
}

/**
 * Map an `ActionState` (or any state string) to a pill tone.
 * success = completed/connected, danger = failed, warning = awaiting attention,
 * everything else = neutral.
 */
export function pillToneForState(state: string): PillTone {
  switch (state) {
    case 'approved':
    case 'done':
    case 'connected':
      return 'success';
    case 'failed':
    case 'error':
      return 'danger';
    case 'pending':
    case 'expired':
    case 'blocked':
      return 'warning';
    default:
      return 'neutral';
  }
}
