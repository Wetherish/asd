import { useEffect, useRef, useState } from "react";
import type { Agent } from "../api/types";
import { Close } from "../icons";

/**
 * Talk (voice) — dark immersive overlay. Opens on Home ("Talk" button) or from
 * the session composer (mic). Speech is transcribed in-browser via the Web
 * Speech API; the transcript is handed back through `onDone` with an optional
 * lead-agent destination.
 *
 * - mode "home": pick a lead agent, Done creates a session from the transcript.
 * - mode "composer": destination is fixed to the current session, Done sends.
 *
 * Falls back to a plain text area when the Web Speech API is unavailable or the
 * microphone is denied, so the feature still works everywhere.
 */

type TalkMode = "home" | "composer";
type Status = "listening" | "idle" | "unsupported" | "error";

type Props = {
  mode: TalkMode;
  agents?: Agent[];
  title?: string;
  onClose: () => void;
  onDone: (transcript: string, leadAgentId?: string) => void | Promise<void>;
};

// Minimal typings for the Web Speech API (absent from lib.dom).
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
const ctor = (window as unknown as {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
});
const Recognition = ctor.SpeechRecognition ?? ctor.webkitSpeechRecognition;

const BARS = 32;

export default function TalkOverlay({ mode, agents = [], title, onClose, onDone }: Props) {
  const [status, setStatus] = useState<Status>(Recognition ? "listening" : "unsupported");
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [leadAgentId, setLeadAgentId] = useState(agents[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);
  const finalRef = useRef("");

  const stop = () => {
    listeningRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
  };

  const start = () => {
    if (!Recognition) {
      setStatus("unsupported");
      return;
    }
    const rec = new Recognition();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SpeechResultEvent) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          finalRef.current += res[0].transcript + " ";
          setFinalText(finalRef.current.trim());
        } else {
          interimText += res[0].transcript;
        }
      }
      setInterim(interimText);
    };

    rec.onerror = (e: { error: string }) => {
      // Permission denied → fall back to typing; "no-speech" is harmless.
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        listeningRef.current = false;
        setStatus("error");
      }
    };

    rec.onend = () => {
      if (listeningRef.current) {
        try {
          rec.start();
        } catch {
          /* guard against double-start races */
        }
      } else {
        setStatus((s) => (s === "listening" ? "idle" : s));
      }
    };

    recRef.current = rec;
    listeningRef.current = true;
    try {
      rec.start();
    } catch {
      setStatus("unsupported");
      return;
    }
    setStatus("listening");
  };

  useEffect(() => {
    start();
    return () => {
      listeningRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spoken = (finalText + (interim ? " " + interim : "")).trim();
  const canType = status === "unsupported" || status === "error";
  const text = (canType ? typed : spoken).trim();
  const listening = status === "listening";

  const done = async () => {
    if (!text || submitting) return;
    setSubmitting(true);
    stop();
    try {
      await onDone(text, leadAgentId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="talk-overlay">
      <div className="talk-inner">
        <div className="talk-top">
          <button className="iconbtn" onClick={onClose} aria-label="Cancel">
            <Close />
          </button>
          <div className="overline" style={{ color: "var(--text-2)" }}>
            Voice
          </div>
          <span style={{ width: 34 }} />
        </div>

        <div className="talk-stage" onClick={() => !listening && !canType && start()}>
          <div className={`talk-wave${listening ? " listening" : ""}`}>
            {Array.from({ length: BARS }).map((_, i) => (
              <i key={i} style={{ animationDelay: `${(i % 12) * 0.07}s` }} />
            ))}
          </div>

          <div className="talk-status">{listening ? "Listening…" : "Tap to speak"}</div>

          {canType ? (
            <textarea
              className="talk-textarea"
              value={typed}
              placeholder={status === "error" ? "Microphone blocked — type instead…" : "Voice not supported here — type instead…"}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className={`talk-transcript${text ? "" : " empty"}`}>
              {text || "Say what you need…"}
            </div>
          )}
        </div>

        <div className="talk-foot">
          {mode === "home" ? (
            <>
              <div className="section-label" style={{ marginTop: 0 }}>
                To
              </div>
              <div className="talk-dest">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    className={`talk-chip${leadAgentId === a.id ? " on" : ""}`}
                    onClick={() => setLeadAgentId(a.id)}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="section-label" style={{ marginTop: 0 }}>
              To · {title}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" style={{ flex: 1.6 }} onClick={() => void done()} disabled={!text || submitting}>
              {submitting ? "Working…" : "Done"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
