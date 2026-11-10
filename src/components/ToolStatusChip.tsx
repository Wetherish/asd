import { useStore } from '../lib/store';
import { Icon } from '../lib/icons';
import type { ToolState } from '../lib/types';
import './ToolStatusChip.css';

const GLYPH: Record<ToolState, string> = {
  queued: 'clock',
  running: 'clock',
  done: 'check-circle',
  failed: 'x-octagon',
  blocked: 'warning-triangle',
};

// Suffix appended to `tool-chip__glyph` to pick the state colour.
const TONE: Record<ToolState, string> = {
  queued: '',
  running: '',
  done: '--success',
  failed: '--danger',
  blocked: '--warning',
};

function fmtElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ToolStatusChip() {
  const tool = useStore((s) => s.toolStatus);
  if (!tool) return null;

  const showCounter =
    tool.state === 'running' || tool.state === 'queued' || tool.state === 'blocked';

  return (
    <div className="tool-chip" role="status" aria-live="polite" key={tool.id}>
      <span className={`tool-chip__glyph${TONE[tool.state]}`}>
        <Icon name={GLYPH[tool.state]} size={14} />
      </span>
      <span className="tool-chip__label">{tool.label}</span>
      {tool.state === 'failed' && tool.cause ? (
        <span className="tool-chip__cause">{tool.cause}</span>
      ) : null}
      {showCounter ? (
        <span className="tool-chip__counter">
          {tool.step} of {tool.total}
        </span>
      ) : null}
      {tool.elapsed !== undefined && tool.state !== 'done' && tool.state !== 'failed' ? (
        <span className="tool-chip__elapsed">{fmtElapsed(tool.elapsed)}</span>
      ) : null}
    </div>
  );
}
