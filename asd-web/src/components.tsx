import type { ReactNode } from "react";
import { Back, Chevron, Close, Ellipsis, Share } from "./icons";

export function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span className="sig">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export function TopBar({
  over,
  title,
  onBack,
  actions,
}: {
  over?: string;
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="topbar">
      {onBack ? (
        <button className="iconbtn" onClick={onBack} aria-label="Back">
          <Back />
        </button>
      ) : (
        <span style={{ width: 34 }} />
      )}
      <div className="topbar-title">
        {over ? <div className="topbar-over">{over}</div> : null}
        <div className="topbar-name">{title}</div>
      </div>
      <div style={{ display: "flex", gap: 1 }}>{actions}</div>
    </div>
  );
}

export function Pill({ kind, label }: { kind: string; label: string }) {
  return <span className={`pill pill-${kind}`}>{label}</span>;
}

export function TabBar({
  active,
  onChange,
}: {
  active: string;
  onChange: (t: string) => void;
}) {
  const tabs = ["Home", "Sessions", "Agents", "Jobs"];
  return (
    <div className="tabbar">
      {tabs.map((t) => (
        <button key={t} className={active === t.toLowerCase() ? "on" : ""} onClick={() => onChange(t.toLowerCase())}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function DefaultActions({ onShare, onMenu }: { onShare?: () => void; onMenu?: () => void }) {
  return (
    <>
      {onShare ? (
        <button className="iconbtn" onClick={onShare} aria-label="Share">
          <Share />
        </button>
      ) : null}
      <button className="iconbtn" onClick={onMenu} aria-label="Menu">
        <Ellipsis />
      </button>
    </>
  );
}

export { Back, Chevron, Close };
