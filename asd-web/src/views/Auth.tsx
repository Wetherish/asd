import { useState } from "react";
import { StatusBar, TopBar } from "../components";
import { useApp } from "../store";

export default function Auth() {
  const { login, signup } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <StatusBar />
      <TopBar over="asd" title={mode === "login" ? "Sign in" : "Create account"} />
      <form
        className="body"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="section-label">Email</div>
        <input
          className="input"
          style={{ width: "100%" }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />

        <div className="section-label" style={{ marginTop: 14 }}>
          Password
        </div>
        <input
          className="input"
          style={{ width: "100%" }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "signup" ? (
          <div className="meta" style={{ marginTop: 8 }}>
            At least 8 characters with uppercase, lowercase, and a number.
          </div>
        ) : null}

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 20 }}
          type="submit"
          disabled={busy || !email || !password}
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        {error ? (
          <div className="meta" style={{ color: "var(--danger)", marginTop: 12 }}>
            {error}
          </div>
        ) : null}

        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 12 }}
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </>
  );
}
