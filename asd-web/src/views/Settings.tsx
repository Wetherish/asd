import { useState } from "react";
import { StatusBar, TopBar } from "../components";
import { Chevron } from "../icons";

function Toggle() {
  const [on, setOn] = useState(true);
  return <button className={`tgl ${on ? "on" : ""}`} onClick={() => setOn(!on)} aria-label="Toggle" />;
}

export default function Settings({
  theme,
  onToggleTheme,
  onBack,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <StatusBar />
      <TopBar over="Settings" title="Settings" onBack={onBack} actions={<span style={{ width: 34 }} />} />
      <div className="body">
        <div className="row" style={{ marginTop: 0 }}>
          <span className="grow">
            <span className="row-title">Alex</span>
            <span className="row-meta">alex@example.com</span>
          </span>
          <Chevron width={15} height={15} />
        </div>

        <div className="section-label">Appearance</div>
        <div className="seg">
          <button className={theme === "light" ? "active" : ""} onClick={onToggleTheme}>
            Light
          </button>
          <button className={theme === "dark" ? "active" : ""} onClick={onToggleTheme}>
            Dark
          </button>
          <span>Auto</span>
        </div>

        <div className="section-label">Assistant</div>
        <div className="row">
          <span className="grow">
            <span className="row-title">Default model</span>
          </span>
          <span className="row-val">Claude Sonnet 4.5</span>
          <Chevron width={15} height={15} />
        </div>
        <div className="row">
          <span className="grow">
            <span className="row-title">Approval rule</span>
          </span>
          <span className="row-val">Ask first</span>
          <Chevron width={15} height={15} />
        </div>

        <div className="section-label">Notifications</div>
        {["Job finished", "Approval needed", "Live Activity"].map((label) => (
          <div className="row" key={label}>
            <span className="grow">
              <span className="row-title">{label}</span>
            </span>
            <Toggle />
          </div>
        ))}

        <div className="section-label">Connections</div>
        <div className="row">
          <span className="grow">
            <span className="row-title">Connections</span>
            <span className="row-meta">3 connected</span>
          </span>
          <Chevron width={15} height={15} />
        </div>
      </div>
    </>
  );
}
