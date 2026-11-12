import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "../components";
import { Chevron } from "../icons";
import { useApp } from "../store";
import { api } from "../api";

function Toggle() {
  const [on, setOn] = useState(true);
  return <button className={`tgl ${on ? "on" : ""}`} onClick={() => setOn(!on)} aria-label="Toggle" />;
}

const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "openai-compatible", label: "OpenAI-compatible" },
];

const DEFAULT_MODEL: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  deepseek: "deepseek-chat",
  openrouter: "deepseek/deepseek-chat",
  "openai-compatible": "your-model",
};

export default function Settings({
  theme,
  onToggleTheme,
  onBack,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBack: () => void;
}) {
  const { me } = useApp();
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    void api
      .getSettings()
      .then((s) => {
        setProvider(s.provider);
        setModel(s.model);
        setBaseUrl(s.baseUrl);
        setApiKeySet(s.apiKeySet);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const fresh = await api.updateSettings({
        provider,
        model: model.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setApiKey("");
      setProvider(fresh.provider);
      setModel(fresh.model);
      setBaseUrl(fresh.baseUrl);
      setApiKeySet(fresh.apiKeySet);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSettings({
        provider,
        model: model.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setTestResult(res);
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <StatusBar />
      <TopBar over="Settings" title="Settings" onBack={onBack} actions={<span style={{ width: 34 }} />} />
      <div className="body">
        <div className="row" style={{ marginTop: 0 }}>
          <span className="grow">
            <span className="row-title">{me?.name ?? "Alex"}</span>
            <span className="row-meta">{me?.email ?? "alex@asd.app"}</span>
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

        <div className="section-label">Model</div>
        <div className="row" style={{ display: "block", marginTop: 0 }}>
          <label className="overline" style={{ fontSize: 9 }}>
            Provider
          </label>
          <select
            className="input"
            style={{ width: "100%", marginTop: 8, display: "block" }}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <label className="overline" style={{ fontSize: 9, display: "block", marginTop: 14 }}>
            Model
          </label>
          <input
            className="input"
            style={{ width: "100%", marginTop: 8 }}
            value={model}
            placeholder={DEFAULT_MODEL[provider]}
            onChange={(e) => setModel(e.target.value)}
          />

          {provider === "openai-compatible" ? (
            <>
              <label className="overline" style={{ fontSize: 9, display: "block", marginTop: 14 }}>
                Base URL
              </label>
              <input
                className="input"
                style={{ width: "100%", marginTop: 8 }}
                value={baseUrl}
                placeholder="http://localhost:11434/v1"
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </>
          ) : null}

          <label className="overline" style={{ fontSize: 9, display: "block", marginTop: 14 }}>
            API key
          </label>
          <input
            className="input"
            type="password"
            style={{ width: "100%", marginTop: 8 }}
            value={apiKey}
            placeholder={apiKeySet ? "•••••••• (already set)" : "sk-…"}
            onChange={(e) => setApiKey(e.target.value)}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn btn-ghost" onClick={() => void test()} disabled={testing}>
              {testing ? "Testing…" : "Test key"}
            </button>
            {saved ? <span className="meta" style={{ color: "var(--success)" }}>Saved</span> : null}
            {error ? <span className="meta" style={{ color: "var(--danger)" }}>{error}</span> : null}
          </div>
          {testResult ? (
            <div
              className="meta"
              style={{
                marginTop: 10,
                color: testResult.ok ? "var(--success)" : "var(--danger)",
                whiteSpace: "pre-wrap",
              }}
            >
              {testResult.ok ? "Connected — " : "Failed — "}
              {testResult.message}
            </div>
          ) : null}
        </div>

        <div className="section-label">Assistant</div>
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
