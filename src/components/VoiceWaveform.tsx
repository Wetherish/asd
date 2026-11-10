import { useMemo } from 'react';
import './VoiceWaveform.css';

const BAR_COUNT = 32;

/** Deterministic pseudo-random height in the spec's 4–24pt band. */
function barHeight(i: number): number {
  const t = Math.sin(i * 12.9898) * 43758.5453;
  const frac = t - Math.floor(t);
  return Math.round(4 + frac * 20);
}

export function VoiceWaveform({ active }: { active?: boolean }) {
  const heights = useMemo(
    () => Array.from({ length: BAR_COUNT }, (_, i) => barHeight(i)),
    [],
  );

  return (
    <span
      className={`waveform${active ? ' waveform--active' : ''}`}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="waveform__bar"
          style={{
            height: `${h}px`,
            animationDelay: active ? `${(-i * 0.06).toFixed(2)}s` : undefined,
            animationDuration: active
              ? `${(0.8 + (i % 5) * 0.08).toFixed(2)}s`
              : undefined,
          }}
        />
      ))}
    </span>
  );
}
