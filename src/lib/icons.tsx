import type { CSSProperties, ReactNode } from 'react';

/**
 * Outline glyph set (SF Symbols / Segoe Fluent parity, 01 §7).
 * All icons are stroke-based, `currentColor`, weight matches text.
 * No custom illustrations, no AI sparkles/brains/robots.
 */

const GLYPHS: Record<string, ReactNode> = {
  // Services
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  email: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  slack: (
    <>
      <path d="M9.5 3.5v7M14.5 3.5v7M3.5 9.5h7M3.5 14.5h7M14 9.5h6.5M14 14.5h6.5M9.5 13.5v7M14.5 13.5v7" />
    </>
  ),
  sms: (
    <>
      <path d="M21 11.5c0 3.6-4 6.5-9 6.5-1 0-2-.1-2.9-.3L4 20.5v-3.4C3.1 15.9 3 13.8 3 11.5c0-3.6 4-6.5 9-6.5s9 2.9 9 6.5z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </>
  ),
  // Status glyphs
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.3 2.4 2.4 4.6-5.2" />
    </>
  ),
  'warning-triangle': (
    <>
      <path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  'x-octagon': (
    <>
      <path d="M7.9 3h8.2L21 7.9v8.2L16.1 21H7.9L3 16.1V7.9L7.9 3z" />
      <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 3v4.2h-4.2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="m7 7 10 10M17 7 7 17" />,
  undo: (
    <>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 5.5V9h3.5" />
    </>
  ),
  // UI
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  send: <path d="M12 20V5M6 11l6-6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-3.8-3.8" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  bubble: (
    <path d="M21 12c0 3.3-4 6-9 6-1 0-2-.1-2.9-.3L4 20v-3.4C3.1 15.5 3 13.7 3 12c0-3.3 4-6 9-6s9 2.7 9 6z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  pencil: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  share: (
    <>
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </>
  ),
  expand: (
    <>
      <path d="M8.5 3.5H5.5a2 2 0 0 0-2 2v3M15.5 3.5h3a2 2 0 0 1 2 2v3M8.5 20.5H5.5a2 2 0 0 1-2-2v-3M15.5 20.5h3a2 2 0 0 0 2-2v-3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5z" />,
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
};

export type IconName = keyof typeof GLYPHS | (string & {});

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.6,
  style,
  filled = false,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: 'block', ...style }}
    >
      {GLYPHS[name] ?? GLYPHS.check}
    </svg>
  );
}

export const hasIcon = (name: string) => name in GLYPHS;
