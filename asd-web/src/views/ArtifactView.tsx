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

function ArtifactBody({
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

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const ids = Object.keys(selected).filter((id) => selected[id]);

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
