import type { ReactNode } from 'react';
import { Icon } from '../lib/icons';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export function Button(props: {
  variant?: ButtonVariant; // default 'primary'
  size?: 'regular' | 'small'; // default 'regular'
  leadingIcon?: string; // icon name
  full?: boolean;
  disabled?: boolean;
  loading?: boolean; // locks width, shows disabled, no spinner
  onClick?: () => void;
  children: ReactNode;
  'aria-label'?: string;
}) {
  const {
    variant = 'primary',
    size = 'regular',
    leadingIcon,
    full,
    disabled,
    loading,
    onClick,
    children,
    'aria-label': ariaLabel,
  } = props;

  const className = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    full ? 'btn--full' : '',
    loading ? 'btn--loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {leadingIcon ? <Icon name={leadingIcon} size={16} /> : null}
      {children}
    </button>
  );
}
