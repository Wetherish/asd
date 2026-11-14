import { useState } from "react";
import { api } from "../api";
import type { Artifact, Person, PersonRole } from "../api/types";
import { Close, Pencil, Share, Trash } from "../icons";

type Props = {
  artifact: Artifact;
  members: Person[];
  onClose: () => void;
  onChanged: () => void;
};

/**
 * Generic full-screen artifact viewer/editor. Opens any kind (table / doc /
 * canvas / dashboard); doc bodies are editable, the name is always renamable,
 * and artifacts can be deleted or shared with session members.
 */
export default function ArtifactView({ artifact, members, onClose, onChanged }: Props) {
  const [name, setName] = useState(artifact.name);
  const [body, setBody] = useState(artifact.content.kind === "doc" ? artifact.content.body : "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const content = artifact.content.kind === "doc" ? { kind: "doc" as const, body } : undefined;
      await api.updateArtifact(artifact.id, { name: name.trim() || artifact.name, content });
      setEditing(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${artifact.name}”?`)) return;
    try {
      await api.deleteArtifact(artifact.id);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="overlay">
      <div className="overlay-inner">
        <div className="topbar">
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <Close />
          </button>
          <div className="topbar-title">
            <div className="topbar-over">{artifact.kind}</div>
            {editing ? (
              <input
                className="input"
                style={{ width: "100%", marginTop: 6 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="topbar-name">{name}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 1 }}>
            {editing ? (
              <>
                <button className="btn btn-primary btn-small" onClick={() => void save()} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button className="iconbtn" onClick={() => setEditing(false)} aria-label="Cancel">
                  <Close />
                </button>
              </>
            ) : (
              <>
                <button className="iconbtn" onClick={() => setEditing(true)} aria-label="Edit">
                  <Pencil />
                </button>
                <button className="iconbtn" onClick={() => setShowShare(true)} aria-label="Share">
                  <Share />
                </button>
                <button className="iconbtn" onClick={() => void remove()} aria-label="Delete">
                  <Trash />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="body">
          {error ? (
            <div className="meta" style={{ color: "var(--danger)", marginBottom: 10 }}>
              {error}
            </div>
          ) : null}

          <div className="section-label">Content</div>
          <ArtifactBody artifact={artifact} editing={editing} body={body} setBody={setBody} />

          <div className="section-label">Shared with</div>
          <div className="row">
            <span className="grow">
              <span className="row-title">
                {artifact.sharedWith.length ? `${artifact.sharedWith.length} people` : "Only you"}
              </span>
              <span className="row-meta">Manage access from the share sheet</span>
            </span>
            <button className="linkbtn" onClick={() => setShowShare(true)}>
              Share
            </button>
          </div>
        </div>

        {showShare ? (
          <ShareSheet
            artifact={artifact}
            members={members}
            onClose={() => setShowShare(false)}
            onShared={onChanged}
          />
        ) : null}
      </div>
    </div>
  );
}

export function ArtifactBody({
  artifact,
  editing,
  body,
  setBody,
}: {
  artifact: Artifact;
  editing: boolean;
  body: string;
  setBody: (v: string) => void;
}) {
  const content = artifact.content;

  if (content.kind === "doc") {
    if (editing) {
      return (
        <textarea
          className="doc-editor"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write here…"
        />
      );
    }
    return <div className="prose" style={{ whiteSpace: "pre-wrap" }}>{content.body || <em className="meta">Empty document</em>}</div>;
  }

  if (content.kind === "table") {
    if (!content.columns.length && !content.rows.length) {
      return <div className="meta">Empty table.</div>;
    }
    return (
      <table className="art-table">
        <thead>
          <tr>
            {content.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {content.rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (content.kind === "canvas") {
    if (!content.nodes.length) return <div className="meta">Empty canvas.</div>;
    return (
      <div>
        {content.nodes.map((n) => (
          <div className="row" key={n.id}>
            <span className="grow">
              <span className="row-title">{n.type}</span>
              <span className="row-meta">
                x {n.x} · y {n.y}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (content.kind === "list") {
    if (!content.items.length) return <div className="meta">Empty list.</div>;
    return (
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {content.items.map((item) => (
          <li
            key={item.id}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid var(--border-2)",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 6,
                border: "2px solid var(--border-2)",
                background: item.checked ? "var(--accent)" : "transparent",
                flexShrink: 0,
              }}
            />
            <span className="row-title">{item.text}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (content.kind === "image") {
    return content.url ? <img src={content.url} alt={content.alt ?? "Plot"} style={{ maxWidth: "100%", borderRadius: 10 }} /> : <div className="meta">Image (not yet rendered).</div>;
  }

  if (content.kind === "data") {
    if (content.preview?.columns.length) {
      return (
        <table className="art-table">
          <thead>
            <tr>
              {content.preview.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.preview.rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return <div className="meta">Data file ({content.format}).</div>;
  }

  if (content.kind === "app") {
    if (!content.url) return <div className="meta">App (not yet deployed).</div>;
    return (
      <div>
        <iframe
          src={content.url}
          title={artifact.name}
          style={{
            width: "100%",
            height: 480,
            border: "1px solid var(--border-2)",
            borderRadius: 10,
            background: "#fff",
          }}
        />
        <div style={{ marginTop: 8 }}>
          <a className="linkbtn" href={content.url} target="_blank" rel="noreferrer">
            Open app
          </a>
        </div>
      </div>
    );
  }

  if (!content.widgets.length) return <div className="meta">Empty dashboard.</div>;
  return (
    <div>
      {content.widgets.map((w) => (
        <div className="row" key={w.id}>
          <span className="grow">
            <span className="row-title">{w.type}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function ShareSheet({
  artifact,
  members,
  onClose,
  onShared,
}: {
  artifact: Artifact;
  members: Person[];
  onClose: () => void;
  onShared: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [role, setRole] = useState<PersonRole>("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const ids = Object.keys(selected).filter((id) => selected[id]);

  const createLink = async () => {
    setLinkBusy(true);
    setLinkError(null);
    try {
      const res = await api.createShareLink(artifact.id, { password: linkPassword || undefined });
      setLink(window.location.origin + res.url);
    } catch (e) {
      setLinkError(e instanceof Error ? e.message : String(e));
    } finally {
      setLinkBusy(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — leave the link visible for manual copy
    }
  };

  const share = async () => {
    if (!ids.length) return;
    setBusy(true);
    setError(null);
    try {
      await api.shareArtifact(artifact.id, { personIds: ids, role });
      onShared();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>
          Share “{artifact.name}”
        </div>

        <div className="section-label">People</div>
        {members.length ? (
          members.map((m) => (
            <button key={m.id} className="row" style={{ width: "100%", textAlign: "left" }} onClick={() => toggle(m.id)}>
              <span className="grow">
                <span className="row-title">{m.name}</span>
                <span className="row-meta">{m.email}</span>
              </span>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  border: "2px solid var(--border-2)",
                  background: selected[m.id] ? "var(--accent)" : "transparent",
                  flexShrink: 0,
                }}
              />
            </button>
          ))
        ) : (
          <div className="meta">No other members in this session.</div>
        )}

        <div className="section-label">Permission</div>
        <div className="seg">
          {(["viewer", "editor"] as PersonRole[]).map((r) => (
            <button key={r} className={role === r ? "active" : ""} onClick={() => setRole(r)}>
              {r === "viewer" ? "Can view" : "Can edit"}
            </button>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 18 }}>
          Link
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            type="password"
            placeholder="Password (optional)"
            value={linkPassword}
            onChange={(e) => setLinkPassword(e.target.value)}
          />
          <button className="btn btn-ghost" onClick={() => void createLink()} disabled={linkBusy}>
            {linkBusy ? "Creating…" : "Create link"}
          </button>
        </div>
        {linkError ? (
          <div className="meta" style={{ color: "var(--danger)", marginTop: 8 }}>
            {linkError}
          </div>
        ) : null}
        {link ? (
          <div className="row" style={{ marginTop: 10 }}>
            <span className="grow">
              <span className="row-meta" style={{ wordBreak: "break-all" }}>
                {link}
              </span>
            </span>
            <button className="linkbtn" onClick={() => void copyLink()}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="meta" style={{ color: "var(--danger)", marginTop: 10 }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => void share()} disabled={busy || !ids.length}>
            {busy ? "Sharing…" : "Share"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
