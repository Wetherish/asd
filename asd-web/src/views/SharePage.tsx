import { useEffect, useState } from "react";
import { api } from "../api";
import type { Artifact } from "../api/types";
import { ArtifactBody } from "./ArtifactView";

type State = "loading" | "locked" | "ready" | "error";

export default function SharePage({ token }: { token: string }) {
  const [state, setState] = useState<State>("loading");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getShare(token);
        if (cancelled) return;
        if (res.needsPassword) {
          setState("locked");
        } else {
          setArtifact(res.artifact ?? null);
          setState("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const unlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      const { key } = await api.unlockShare(token, password);
      const res = await api.getShare(token, key);
      setArtifact(res.artifact ?? null);
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="app">
      <div className="overlay-inner" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="topbar">
          <div className="topbar-title">
            <div className="topbar-over">Shared with you</div>
            {artifact ? <div className="topbar-name">{artifact.name}</div> : null}
          </div>
        </div>

        <div className="body">
          {state === "loading" ? <div className="meta">Loading…</div> : null}

          {state === "error" ? (
            <div className="meta" style={{ color: "var(--danger)" }}>
              {error ?? "This link is invalid or has been revoked."}
            </div>
          ) : null}

          {state === "locked" ? (
            <div>
              <div className="section-label">This link is password-protected</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void unlock();
                  }}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={() => void unlock()} disabled={unlocking || !password}>
                  {unlocking ? "Unlocking…" : "Unlock"}
                </button>
              </div>
              {error ? (
                <div className="meta" style={{ color: "var(--danger)", marginTop: 8 }}>
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}

          {state === "ready" && artifact ? (
            <ArtifactBody artifact={artifact} editing={false} body="" setBody={() => {}} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
