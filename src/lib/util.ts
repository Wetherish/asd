// Small shared helpers.

let counter = 0;

/** Monotonic id — never collides within a session of the app. */
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

let seq = 0;

/** Global stream ordering across messages and actions. */
export function nextSeq(): number {
  seq += 1;
  return seq;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Format an epoch ms as a clock time like "09:41". */
export function clockTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${hh}:${m} ${ampm}`;
}

/** Relative time like "2m", "1h", "2d" (under 24h only per 07 §10). */
export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

/** Day group label: Today / Yesterday / `d MMM`. */
export function dayLabel(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  const today = new Date(now);
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(today) - startOfDay(d)) / (24 * 60 * 60 * 1000),
  );
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
